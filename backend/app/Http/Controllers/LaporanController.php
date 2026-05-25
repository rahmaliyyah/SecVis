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
            'foto_bukti' => $v->foto_bukti,
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

        $includeFoto = $request->boolean('include_foto', false);
        $data['include_foto'] = $includeFoto;

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

        $tipe       = $request->tipe;
        $namaFile   = $this->buildFileName($tipe, $request);
        $report     = $this->buildReportData($tipe, $request);
        $includeFoto = $request->boolean('include_foto', false);

        $labelMapFull = [
            'no-helmet'  => 'Tidak Memakai Helm',
            'no-vest'    => 'Tidak Memakai Rompi',
            'no-boots'   => 'Tidak Memakai Sepatu Safety',
            'no-gloves'  => 'Tidak Memakai Sarung Tangan',
            'no-glasses' => 'Tidak Memakai Kacamata',
        ];

        $spreadsheet = new Spreadsheet();
        $sheet       = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Laporan K3');

        // ── Styles B&W ────────────────────────────────────────────
        $boldBlack  = ['font' => ['bold' => true, 'color' => ['argb' => 'FF000000']]];
        $headerCell = [
            'font'      => ['bold' => true, 'size' => 9, 'color' => ['argb' => 'FFFFFFFF']],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF333333']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders'   => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FF999999']]],
        ];
        $thinBorder = ['borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFCCCCCC']]]];
        $altRow     = ['fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFF5F5F5']]];

        // ── Logo & Header ──────────────────────────────────────────
        $logoSecvis = public_path('images/logo-secvis.png');
        $logoEpson  = public_path('images/logo-epson.png');

        if (file_exists($logoSecvis)) {
            $drawing = new \PhpOffice\PhpSpreadsheet\Worksheet\Drawing();
            $drawing->setName('SecVis');
            $drawing->setPath($logoSecvis);
            $drawing->setHeight(36);
            $drawing->setCoordinates('A1');
            $drawing->setOffsetX(4);
            $drawing->setOffsetY(4);
            $drawing->setWorksheet($sheet);
        }
        if (file_exists($logoEpson)) {
            $drawing = new \PhpOffice\PhpSpreadsheet\Worksheet\Drawing();
            $drawing->setName('Epson');
            $drawing->setPath($logoEpson);
            $drawing->setHeight(28);
            $drawing->setCoordinates('H1');
            $drawing->setOffsetX(4);
            $drawing->setOffsetY(8);
            $drawing->setWorksheet($sheet);
        }

        $sheet->mergeCells('B1:G1');
        $sheet->setCellValue('B1', 'LAPORAN PELANGGARAN K3 — PT INDONESIA EPSON INDUSTRY');
        $sheet->getStyle('B1')->applyFromArray([
            'font'      => ['bold' => true, 'size' => 13, 'color' => ['argb' => 'FF000000']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(44);

        $sheet->mergeCells('A2:J2');
        $sheet->setCellValue('A2', 'Periode: ' . $report['label_periode'] . '   |   Dicetak: ' . Carbon::now()->format('d/m/Y H:i') . ' WIB');
        $sheet->getStyle('A2')->applyFromArray([
            'font'      => ['size' => 9, 'color' => ['argb' => 'FF666666']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
        $sheet->getRowDimension(2)->setRowHeight(14);

        // Garis bawah header
        $sheet->getStyle('A2:J2')->applyFromArray([
            'borders' => ['bottom' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['argb' => 'FF000000']]],
        ]);

        // ── Ringkasan ──────────────────────────────────────────────
        $sheet->getRowDimension(3)->setRowHeight(6);

        $summaryData = [
            ['A4','A5', 'TOTAL PELANGGARAN', (string)$report['total']],
            ['C4','C5', 'SHIFT TERBANYAK', ($report['shiftTerbanyak']['nama_shift'] ?? '-') . ' (' . ($report['shiftTerbanyak']['total'] ?? 0) . ')'],
            ['E4','E5', 'APD PALING DILANGGAR', isset($report['apdTerbanyak']) ? (($report['labelMap'][$report['apdTerbanyak']['jenis']] ?? $report['apdTerbanyak']['jenis']) . ' (' . $report['apdTerbanyak']['total'] . ')') : '-'],
            ['G4','G5', 'KAMERA AKTIF', Camera::where('status', 'aktif')->count() . ' unit'],
        ];
        foreach ($summaryData as [$lCell, $vCell, $label, $value]) {
            $col    = preg_replace('/\d/', '', $lCell);
            $colEnd = chr(ord($col) + 1);
            $row    = preg_replace('/[A-Z]/', '', $lCell);
            $sheet->mergeCells($col . $row . ':' . $colEnd . $row);
            $sheet->setCellValue($lCell, $label);
            $sheet->getStyle($lCell)->applyFromArray([
                'font'      => ['bold' => true, 'size' => 8, 'color' => ['argb' => 'FF666666']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'borders'   => ['bottom' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFCCCCCC']]],
            ]);
            $vRow = preg_replace('/[A-Z]/', '', $vCell);
            $sheet->mergeCells($col . $vRow . ':' . $colEnd . $vRow);
            $sheet->setCellValue($vCell, $value);
            $sheet->getStyle($vCell)->applyFromArray([
                'font'      => ['bold' => true, 'size' => 13, 'color' => ['argb' => 'FF000000']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                'borders'   => ['bottom' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['argb' => 'FF000000']]],
            ]);
        }
        $sheet->getRowDimension(4)->setRowHeight(16);
        $sheet->getRowDimension(5)->setRowHeight(22);

        // ── Distribusi Jenis ───────────────────────────────────────
        $sheet->getRowDimension(6)->setRowHeight(8);
        $sheet->mergeCells('A7:D7');
        $sheet->setCellValue('A7', 'DISTRIBUSI JENIS PELANGGARAN');
        $sheet->getStyle('A7')->applyFromArray(['font' => ['bold' => true, 'size' => 9]]);

        $typeRow = 8;
        foreach (['A' => 'Jenis Pelanggaran', 'B' => 'Jumlah', 'C' => 'Persentase'] as $col => $label) {
            $sheet->setCellValue($col . $typeRow, $label);
            $sheet->getStyle($col . $typeRow)->applyFromArray($headerCell);
        }
        $sheet->getRowDimension($typeRow)->setRowHeight(16);
        $typeRow++;
        foreach ($report['byType'] as $idx => $item) {
            $sheet->setCellValue('A' . $typeRow, $labelMapFull[$item['jenis']] ?? $item['jenis']);
            $sheet->setCellValue('B' . $typeRow, $item['total']);
            $sheet->setCellValue('C' . $typeRow, $item['persentase'] . '%');
            $style = $thinBorder;
            if ($idx % 2 !== 0) $style = array_merge_recursive($style, $altRow);
            $sheet->getStyle('A' . $typeRow . ':C' . $typeRow)->applyFromArray($style);
            $sheet->getStyle('B' . $typeRow . ':C' . $typeRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getRowDimension($typeRow)->setRowHeight(14);
            $typeRow++;
        }

        // ── Distribusi Shift ───────────────────────────────────────
        $shiftStartRow = 8;
        $sheet->mergeCells('E7:H7');
        $sheet->setCellValue('E7', 'DISTRIBUSI PER SHIFT');
        $sheet->getStyle('E7')->applyFromArray(['font' => ['bold' => true, 'size' => 9]]);

        foreach (['E' => 'Shift', 'F' => 'Jam Mulai', 'G' => 'Jam Selesai', 'H' => 'Total'] as $col => $label) {
            $sheet->setCellValue($col . $shiftStartRow, $label);
            $sheet->getStyle($col . $shiftStartRow)->applyFromArray($headerCell);
        }
        $shiftDataRow = $shiftStartRow + 1;
        foreach ($report['byShift'] as $idx => $item) {
            $sheet->setCellValue('E' . $shiftDataRow, $item['nama_shift']);
            $sheet->setCellValue('F' . $shiftDataRow, $item['jam_mulai']);
            $sheet->setCellValue('G' . $shiftDataRow, $item['jam_selesai']);
            $sheet->setCellValue('H' . $shiftDataRow, $item['total']);
            $style = $thinBorder;
            if ($idx % 2 !== 0) $style = array_merge_recursive($style, $altRow);
            $sheet->getStyle('E' . $shiftDataRow . ':H' . $shiftDataRow)->applyFromArray($style);
            $sheet->getStyle('F' . $shiftDataRow . ':H' . $shiftDataRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $shiftDataRow++;
        }

        // ── Riwayat Pelanggaran ────────────────────────────────────
        $maxDistRow = max($typeRow, $shiftDataRow) + 1;
        $sheet->mergeCells('A' . $maxDistRow . ':J' . $maxDistRow);
        $sheet->setCellValue('A' . $maxDistRow, 'RIWAYAT PELANGGARAN');
        $sheet->getStyle('A' . $maxDistRow)->applyFromArray(['font' => ['bold' => true, 'size' => 9]]);
        $sheet->getRowDimension($maxDistRow)->setRowHeight(16);

        $mainHeaders = ['No', 'Waktu Deteksi', 'Shift', 'Kode Kamera', 'Jenis Pelanggaran', 'Confidence'];
        $mainCols    = ['A', 'B', 'C', 'D', 'E', 'F'];
        if ($includeFoto) {
            $mainHeaders[] = 'Foto Bukti';
            $mainCols[]    = 'G';
        }
        $headerRow = $maxDistRow + 1;
        foreach ($mainCols as $i => $col) {
            $sheet->setCellValue($col . $headerRow, $mainHeaders[$i]);
            $sheet->getStyle($col . $headerRow)->applyFromArray($headerCell);
        }
        $sheet->getRowDimension($headerRow)->setRowHeight(16);

        $dataRow = $headerRow + 1;
        foreach ($report['violationsFormatted'] as $idx => $v) {
            $sheet->setCellValue('A' . $dataRow, $idx + 1);
            $sheet->setCellValue('B' . $dataRow, $v['timestamp']);
            $sheet->setCellValue('C' . $dataRow, $v['shift']);
            $sheet->setCellValue('D' . $dataRow, $v['kamera']);
            $sheet->setCellValue('E' . $dataRow, $labelMapFull[$v['jenis']] ?? $v['jenis']);
            $sheet->setCellValue('F' . $dataRow, $v['confidence'] . '%');
            $style = $thinBorder;
            if ($idx % 2 !== 0) $style = array_merge_recursive($style, $altRow);
            $sheet->getStyle('A' . $dataRow . ':F' . $dataRow)->applyFromArray($style);
            $sheet->getStyle('A' . $dataRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle('F' . $dataRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            if ($includeFoto) {
                // Tinggi baris lebih besar untuk foto
                $sheet->getRowDimension($dataRow)->setRowHeight(52);
                $sheet->getStyle('G' . $dataRow)->applyFromArray(array_merge($thinBorder, [
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                ]));

                // Cari file foto
                $fotoBukti = $v['foto_bukti'] ?? null;
                $fotoPath  = $fotoBukti ? storage_path('app/public/' . $fotoBukti) : null;
                $fotoAlt   = $fotoBukti ? public_path($fotoBukti) : null;
                $fotoFile  = ($fotoPath && file_exists($fotoPath)) ? $fotoPath
                           : (($fotoAlt && file_exists($fotoAlt)) ? $fotoAlt : null);

                if ($fotoFile) {
                    $ext = strtolower(pathinfo($fotoFile, PATHINFO_EXTENSION));
                    $drawingFoto = new \PhpOffice\PhpSpreadsheet\Worksheet\Drawing();
                    $drawingFoto->setName('foto_' . $dataRow);
                    $drawingFoto->setPath($fotoFile);
                    $drawingFoto->setHeight(46);
                    $drawingFoto->setCoordinates('G' . $dataRow);
                    $drawingFoto->setOffsetX(4);
                    $drawingFoto->setOffsetY(3);
                    $drawingFoto->setWorksheet($sheet);
                } else {
                    $sheet->setCellValue('G' . $dataRow, 'Tidak tersedia');
                    $sheet->getStyle('G' . $dataRow)->applyFromArray([
                        'font' => ['size' => 8, 'color' => ['argb' => 'FFAAAAAA']],
                        'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                    ]);
                }
            } else {
                $sheet->getRowDimension($dataRow)->setRowHeight(14);
            }

            $dataRow++;
        }

        // Lebar kolom foto
        if ($includeFoto) {
            $sheet->getColumnDimension('G')->setWidth(16);
        }

        // ── Lebar kolom ────────────────────────────────────────────
        $sheet->getColumnDimension('A')->setWidth(6);
        $sheet->getColumnDimension('B')->setWidth(20);
        $sheet->getColumnDimension('C')->setWidth(14);
        $sheet->getColumnDimension('D')->setWidth(14);
        $sheet->getColumnDimension('E')->setWidth(34);
        $sheet->getColumnDimension('F')->setWidth(12);
        $sheet->getColumnDimension('G')->setWidth(12);
        $sheet->getColumnDimension('H')->setWidth(10);

        $spreadsheet->getDefaultStyle()->getFont()->setName('Calibri')->setSize(10);

        // ── Stream ──────────────────────────────────────────────────
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