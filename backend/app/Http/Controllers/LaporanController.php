<?php

namespace App\Http\Controllers;

use App\Models\Camera;
use App\Models\Shift;
use App\Models\Violation;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Font;

class LaporanController extends Controller
{
    /**
     * Bangun nama file sesuai format yang diinginkan.
     */
    private function buildFileName(string $tipe, Request $request): string
    {
        $prefix = 'REPORT PELANGGARAN K3 PT. EPSON INDONESIA_';

        if ($tipe === 'harian') {
            $tanggal = Carbon::parse($request->tanggal);
            return $prefix . $tanggal->format('d/m/Y');
        } elseif ($tipe === 'bulanan') {
            $bulan  = str_pad($request->bulan, 2, '0', STR_PAD_LEFT);
            return $prefix . $bulan . '/' . $request->tahun;
        } else {
            return $prefix . $request->tahun;
        }
    }

    /**
     * Bangun query violations & data pendukung (reusable).
     */
    private function buildReportData(string $tipe, Request $request): array
    {
        $query = Violation::with(['shift', 'camera']);

        if ($tipe === 'harian') {
            $tanggal = Carbon::parse($request->tanggal);
            $query->whereDate('timestamp_deteksi', $tanggal);
            $label_periode = 'Harian — ' . $tanggal->translatedFormat('d F Y');
        } elseif ($tipe === 'bulanan') {
            $query->whereYear('timestamp_deteksi', $request->tahun)
                  ->whereMonth('timestamp_deteksi', $request->bulan);
            $label_periode = 'Bulanan — ' .
                Carbon::createFromDate($request->tahun, $request->bulan, 1)
                      ->translatedFormat('F Y');
        } else {
            $query->whereYear('timestamp_deteksi', $request->tahun);
            $label_periode = 'Tahunan — ' . $request->tahun;
        }

        $violations = $query->orderBy('timestamp_deteksi')->get();

        // Distribusi per jenis
        $byTypeRaw = $violations->groupBy('jenis_pelanggaran')->map(fn($g) => $g->count());
        $total     = $violations->count();
        $byType    = $byTypeRaw->map(fn($count, $jenis) => [
            'jenis'      => $jenis,
            'total'      => $count,
            'persentase' => $total > 0 ? round(($count / $total) * 100, 1) : 0,
        ])->sortByDesc('total')->values()->toArray();

        // Distribusi per shift
        $shifts  = Shift::all();
        $byShift = $shifts->map(function ($shift) use ($violations) {
            $count = $violations->where('shift_id', $shift->id)->count();
            return [
                'nama_shift'  => $shift->nama_shift,
                'jam_mulai'   => $shift->jam_mulai,
                'jam_selesai' => $shift->jam_selesai,
                'total'       => $count,
            ];
        })->sortByDesc('total')->values()->toArray();

        $shiftTerbanyak = collect($byShift)->first();
        $apdTerbanyak   = collect($byType)->first();

        $labelMap = [
            'no-helmet'  => 'Helm',
            'no-vest'    => 'Rompi',
            'no-boots'   => 'Sepatu Safety',
            'no-gloves'  => 'Sarung Tangan',
            'no-glasses' => 'Kacamata',
        ];

        $violationsFormatted = $violations->map(fn($v) => [
            'timestamp'  => Carbon::parse($v->timestamp_deteksi)->format('d/m/Y H:i:s'),
            'shift'      => $v->shift->nama_shift,
            'kamera'     => $v->camera->kode_kamera,
            'jenis'      => $v->jenis_pelanggaran,
            'confidence' => $v->confidence_score,
        ])->toArray();

        return compact(
            'label_periode', 'violations', 'violationsFormatted',
            'total', 'byType', 'byShift', 'shiftTerbanyak', 'apdTerbanyak', 'labelMap'
        );
    }

    // ─── EXPORT PDF ──────────────────────────────────────────────────────────

    public function export(Request $request)
    {
        $request->validate([
            'tipe'    => 'required|in:harian,bulanan,tahunan',
            'tahun'   => 'required_if:tipe,tahunan,bulanan|nullable|integer',
            'bulan'   => 'required_if:tipe,bulanan|nullable|integer|min:1|max:12',
            'tanggal' => 'required_if:tipe,harian|nullable|date',
        ]);

        $tipe     = $request->tipe;
        $namaFile = $this->buildFileName($tipe, $request);
        $report   = $this->buildReportData($tipe, $request);

        $nomorLaporan = Violation::count() + rand(100, 999);

        $data = [
            'label_periode'     => $report['label_periode'],
            'tanggal_cetak'     => Carbon::now()->translatedFormat('d F Y, H:i') . ' WIB',
            'nomor_laporan'     => $nomorLaporan,
            'total_pelanggaran' => $report['total'],
            'shift_terbanyak'   => $report['shiftTerbanyak'] ? [
                'nama'  => $report['shiftTerbanyak']['nama_shift'],
                'total' => $report['shiftTerbanyak']['total'],
            ] : null,
            'apd_terbanyak'     => $report['apdTerbanyak'] ? [
                'nama'  => $report['labelMap'][$report['apdTerbanyak']['jenis']] ?? $report['apdTerbanyak']['jenis'],
                'total' => $report['apdTerbanyak']['total'],
            ] : null,
            'jumlah_kamera'     => Camera::where('status', 'aktif')->count(),
            'by_type'           => $report['byType'],
            'by_shift'          => $report['byShift'],
            'violations'        => $report['violationsFormatted'],
        ];

        $pdf = Pdf::loadView('pdf.laporan', $data)
            ->setPaper('a4', 'landscape')
            ->setOptions([
                'defaultFont'         => 'helvetica',
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled'     => false,
                'dpi'                 => 150,
                'margin_top'          => 14,
                'margin_bottom'       => 14,
                'margin_left'         => 14,
                'margin_right'        => 14,
                'chroot'              => public_path(),
            ]);

        $safeFileName = str_replace('/', '-', $namaFile);
return $pdf->download($safeFileName . '.pdf');
    }

    // ─── EXPORT EXCEL ────────────────────────────────────────────────────────

    public function exportExcel(Request $request)
    {
        $request->validate([
            'tipe'    => 'required|in:harian,bulanan,tahunan',
            'tahun'   => 'required_if:tipe,tahunan,bulanan|nullable|integer',
            'bulan'   => 'required_if:tipe,bulanan|nullable|integer|min:1|max:12',
            'tanggal' => 'required_if:tipe,harian|nullable|date',
        ]);

        $tipe     = $request->tipe;
        $namaFile = $this->buildFileName($tipe, $request);
        $report   = $this->buildReportData($tipe, $request);

        $spreadsheet = new Spreadsheet();
        $sheet       = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Riwayat Pelanggaran');

        // ── Warna tema ────────────────────────────────────────────
        $colorNavy  = '1A3A6B';
        $colorLight = 'E8EEF9';
        $colorWhite = 'FFFFFF';
        $colorGray  = 'F5F7FB';
        $colorRed   = 'C0392B';
        $colorGreen = '1E8449';

        // ── Header laporan ────────────────────────────────────────
        $sheet->mergeCells('A1:J1');
        $sheet->setCellValue('A1', 'LAPORAN PELANGGARAN K3 — PT EPSON INDONESIA');
        $sheet->getStyle('A1')->applyFromArray([
            'font'      => ['bold' => true, 'size' => 14, 'color' => ['argb' => 'FF' . $colorNavy]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(24);

        $sheet->mergeCells('A2:J2');
        $sheet->setCellValue('A2', 'Periode: ' . $report['label_periode'] . '   |   Dicetak: ' . Carbon::now()->format('d/m/Y H:i') . ' WIB');
        $sheet->getStyle('A2')->applyFromArray([
            'font'      => ['size' => 10, 'color' => ['argb' => 'FF555555']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
        $sheet->getRowDimension(2)->setRowHeight(16);

        // ── Ringkasan statistik ────────────────────────────────────
        $sheet->getRowDimension(3)->setRowHeight(8);

        $summaryLabels = [
            'A4' => 'TOTAL PELANGGARAN',
            'C4' => 'SHIFT TERBANYAK',
            'E4' => 'APD PALING DILANGGAR',
            'G4' => 'KAMERA AKTIF',
        ];
        $summaryValues = [
            'A5' => $report['total'],
            'C5' => ($report['shiftTerbanyak']['nama_shift'] ?? '-') . ' (' . ($report['shiftTerbanyak']['total'] ?? 0) . ')',
            'E5' => isset($report['apdTerbanyak']) ? (($report['labelMap'][$report['apdTerbanyak']['jenis']] ?? $report['apdTerbanyak']['jenis']) . ' (' . $report['apdTerbanyak']['total'] . ')') : '-',
            'G5' => Camera::where('status', 'aktif')->count() . ' unit',
        ];

        foreach ($summaryLabels as $cell => $label) {
            $col   = preg_replace('/\d/', '', $cell);
            $colEnd = chr(ord($col) + 1);
            $row   = preg_replace('/[A-Z]/', '', $cell);
            $sheet->mergeCells($col . $row . ':' . $colEnd . $row);
            $sheet->setCellValue($cell, $label);
            $sheet->getStyle($cell)->applyFromArray([
                'font'      => ['bold' => true, 'size' => 8, 'color' => ['argb' => 'FF888888']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF' . $colorLight]],
            ]);
        }
        foreach ($summaryValues as $cell => $value) {
            $col   = preg_replace('/\d/', '', $cell);
            $colEnd = chr(ord($col) + 1);
            $row   = preg_replace('/[A-Z]/', '', $cell);
            $sheet->mergeCells($col . $row . ':' . $colEnd . $row);
            $sheet->setCellValue($cell, $value);
            $sheet->getStyle($cell)->applyFromArray([
                'font'      => ['bold' => true, 'size' => 12, 'color' => ['argb' => 'FF' . $colorNavy]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF' . $colorLight]],
            ]);
        }
        $sheet->getRowDimension(4)->setRowHeight(18);
        $sheet->getRowDimension(5)->setRowHeight(22);

        // ── Distribusi per Jenis ──────────────────────────────────
        $sheet->getRowDimension(6)->setRowHeight(8);
        $sheet->mergeCells('A7:D7');
        $sheet->setCellValue('A7', 'DISTRIBUSI PER JENIS PELANGGARAN');
        $sheet->getStyle('A7')->applyFromArray([
            'font' => ['bold' => true, 'size' => 9, 'color' => ['argb' => 'FF' . $colorNavy]],
        ]);

        $labelMapFull = [
            'no-helmet'  => 'Tidak Memakai Helm',
            'no-vest'    => 'Tidak Memakai Rompi',
            'no-boots'   => 'Tidak Memakai Sepatu Safety',
            'no-gloves'  => 'Tidak Memakai Sarung Tangan',
            'no-glasses' => 'Tidak Memakai Kacamata',
        ];

        $typeHeaders = ['Jenis Pelanggaran', 'Jumlah', 'Persentase'];
        $typeRow = 8;
        foreach (['A', 'B', 'C'] as $i => $col) {
            $sheet->setCellValue($col . $typeRow, $typeHeaders[$i]);
            $sheet->getStyle($col . $typeRow)->applyFromArray([
                'font'      => ['bold' => true, 'size' => 9, 'color' => ['argb' => 'FF' . $colorWhite]],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF' . $colorNavy]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
        }
        $sheet->getRowDimension($typeRow)->setRowHeight(16);

        $typeRow++;
        foreach ($report['byType'] as $idx => $item) {
            $bgColor = $idx % 2 === 0 ? $colorWhite : 'F0F4FA';
            $sheet->setCellValue('A' . $typeRow, $labelMapFull[$item['jenis']] ?? $item['jenis']);
            $sheet->setCellValue('B' . $typeRow, $item['total']);
            $sheet->setCellValue('C' . $typeRow, $item['persentase'] . '%');
            $sheet->getStyle('A' . $typeRow . ':C' . $typeRow)->applyFromArray([
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF' . $bgColor]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
                'borders'   => ['bottom' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFDDE3EE']]],
            ]);
            $sheet->getStyle('B' . $typeRow . ':C' . $typeRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getRowDimension($typeRow)->setRowHeight(15);
            $typeRow++;
        }

        // ── Distribusi per Shift ──────────────────────────────────
        $shiftStartRow = 8; // Sama baris dengan tabel jenis (kolom E)
        $sheet->mergeCells('E7:H7');
        $sheet->setCellValue('E7', 'DISTRIBUSI PER SHIFT');
        $sheet->getStyle('E7')->applyFromArray([
            'font' => ['bold' => true, 'size' => 9, 'color' => ['argb' => 'FF' . $colorNavy]],
        ]);

        $shiftHeaders = ['Shift', 'Jam Mulai', 'Jam Selesai', 'Total'];
        foreach (['E', 'F', 'G', 'H'] as $i => $col) {
            $sheet->setCellValue($col . $shiftStartRow, $shiftHeaders[$i]);
            $sheet->getStyle($col . $shiftStartRow)->applyFromArray([
                'font'      => ['bold' => true, 'size' => 9, 'color' => ['argb' => 'FF' . $colorWhite]],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF' . $colorNavy]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
        }

        $shiftDataRow = $shiftStartRow + 1;
        foreach ($report['byShift'] as $idx => $item) {
            $bgColor = $idx % 2 === 0 ? $colorWhite : 'F0F4FA';
            $sheet->setCellValue('E' . $shiftDataRow, $item['nama_shift']);
            $sheet->setCellValue('F' . $shiftDataRow, $item['jam_mulai']);
            $sheet->setCellValue('G' . $shiftDataRow, $item['jam_selesai']);
            $sheet->setCellValue('H' . $shiftDataRow, $item['total']);
            $sheet->getStyle('E' . $shiftDataRow . ':H' . $shiftDataRow)->applyFromArray([
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF' . $bgColor]],
                'borders'   => ['bottom' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFDDE3EE']]],
            ]);
            $sheet->getStyle('F' . $shiftDataRow . ':H' . $shiftDataRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $shiftDataRow++;
        }

        // ── Tabel riwayat pelanggaran ─────────────────────────────
        $maxDistRow = max($typeRow, $shiftDataRow) + 1;

        $sheet->mergeCells('A' . $maxDistRow . ':J' . $maxDistRow);
        $sheet->setCellValue('A' . $maxDistRow, 'RIWAYAT PELANGGARAN');
        $sheet->getStyle('A' . $maxDistRow)->applyFromArray([
            'font' => ['bold' => true, 'size' => 9, 'color' => ['argb' => 'FF' . $colorNavy]],
        ]);
        $sheet->getRowDimension($maxDistRow)->setRowHeight(16);

        $mainHeaders = ['No', 'Waktu Deteksi', 'Shift', 'Kode Kamera', 'Jenis Pelanggaran', 'Confidence'];
        $mainCols    = ['A', 'B', 'C', 'D', 'E', 'F'];
        $headerRow   = $maxDistRow + 1;
        foreach ($mainCols as $i => $col) {
            $sheet->setCellValue($col . $headerRow, $mainHeaders[$i]);
            $sheet->getStyle($col . $headerRow)->applyFromArray([
                'font'      => ['bold' => true, 'size' => 9, 'color' => ['argb' => 'FF' . $colorWhite]],
                'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF' . $colorNavy]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'borders'   => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFDDE3EE']]],
            ]);
        }
        $sheet->getRowDimension($headerRow)->setRowHeight(18);

        $dataRow = $headerRow + 1;
        foreach ($report['violationsFormatted'] as $idx => $v) {
            $bgColor = $idx % 2 === 0 ? $colorWhite : $colorGray;
            $sheet->setCellValue('A' . $dataRow, $idx + 1);
            $sheet->setCellValue('B' . $dataRow, $v['timestamp']);
            $sheet->setCellValue('C' . $dataRow, $v['shift']);
            $sheet->setCellValue('D' . $dataRow, $v['kamera']);
            $sheet->setCellValue('E' . $dataRow, $labelMapFull[$v['jenis']] ?? $v['jenis']);
            $sheet->setCellValue('F' . $dataRow, $v['confidence'] . '%');
            $sheet->getStyle('A' . $dataRow . ':F' . $dataRow)->applyFromArray([
                'fill'    => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF' . $bgColor]],
                'borders' => ['bottom' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFDDE3EE']]],
            ]);
            $sheet->getStyle('A' . $dataRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('F' . $dataRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getRowDimension($dataRow)->setRowHeight(14);
            $dataRow++;
        }

        // ── Lebar kolom ─────────────────────────────────────────
        $sheet->getColumnDimension('A')->setWidth(6);
        $sheet->getColumnDimension('B')->setWidth(20);
        $sheet->getColumnDimension('C')->setWidth(14);
        $sheet->getColumnDimension('D')->setWidth(14);
        $sheet->getColumnDimension('E')->setWidth(32);
        $sheet->getColumnDimension('F')->setWidth(12);
        $sheet->getColumnDimension('G')->setWidth(12);
        $sheet->getColumnDimension('H')->setWidth(10);

        // ── Font default ─────────────────────────────────────────
        $spreadsheet->getDefaultStyle()->getFont()->setName('Calibri')->setSize(10);

        // ── Stream response ──────────────────────────────────────
        $writer = new Xlsx($spreadsheet);
        $safeFileName = str_replace('/', '-', $namaFile);

        return response()->stream(
            function () use ($writer) { $writer->save('php://output'); },
            200,
            [
                'Content-Type'        => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => 'attachment; filename="' . $safeFileName . '.xlsx"',
                'Cache-Control'       => 'max-age=0',
            ]
        );
    }
}