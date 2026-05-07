<?php

namespace App\Http\Controllers;

use App\Models\Camera;
use App\Models\Shift;
use App\Models\Violation;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;

class LaporanController extends Controller
{
    public function export(Request $request)
    {
        $request->validate([
            'tipe'    => 'required|in:harian,bulanan,tahunan',
            'tahun'   => 'required_if:tipe,tahunan,bulanan|nullable|integer',
            'bulan'   => 'required_if:tipe,bulanan|nullable|integer|min:1|max:12',
            'tanggal' => 'required_if:tipe,harian|nullable|date',
        ]);

        $tipe  = $request->tipe;
        $query = Violation::with(['shift', 'camera']);

        if ($tipe === 'harian') {
            $tanggal = Carbon::parse($request->tanggal);
            $query->whereDate('timestamp_deteksi', $tanggal);
            $label_periode = 'Harian — ' . $tanggal->translatedFormat('d F Y');
            $namaFile      = 'Laporan Pelanggaran K3 PT Epson Indonesia_' . $tanggal->format('d-m-Y');

        } elseif ($tipe === 'bulanan') {
            $query->whereYear('timestamp_deteksi', $request->tahun)
                  ->whereMonth('timestamp_deteksi', $request->bulan);
            $label_periode = 'Bulanan — ' . Carbon::createFromDate($request->tahun, $request->bulan, 1)->translatedFormat('F Y');
            $namaFile      = 'Laporan Pelanggaran K3 PT Epson Indonesia_' . str_pad($request->bulan, 2, '0', STR_PAD_LEFT) . '-' . $request->tahun;

        } else {
            $query->whereYear('timestamp_deteksi', $request->tahun);
            $label_periode = 'Tahunan — ' . $request->tahun;
            $namaFile      = 'Laporan Pelanggaran K3 PT Epson Indonesia_' . $request->tahun;
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

        $nomorLaporan = Violation::count() + rand(100, 999);

        $data = [
            'label_periode'     => $label_periode,
            'tanggal_cetak'     => Carbon::now()->translatedFormat('d F Y, H:i') . ' WIB',
            'nomor_laporan'     => $nomorLaporan,
            'total_pelanggaran' => $total,
            'shift_terbanyak'   => $shiftTerbanyak ? [
                'nama'  => $shiftTerbanyak['nama_shift'],
                'total' => $shiftTerbanyak['total'],
            ] : null,
            'apd_terbanyak'     => $apdTerbanyak ? [
                'nama'  => $labelMap[$apdTerbanyak['jenis']] ?? $apdTerbanyak['jenis'],
                'total' => $apdTerbanyak['total'],
            ] : null,
            'jumlah_kamera'     => Camera::where('status', 'aktif')->count(),
            'by_type'           => $byType,
            'by_shift'          => $byShift,
            'violations'        => $violationsFormatted,
        ];

        $pdf = Pdf::loadView('pdf.laporan', $data)
            ->setPaper('a4', 'landscape')
            ->setOptions([
                'defaultFont'          => 'serif',
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled'      => false,
                'dpi'                  => 150,
                'margin_top'           => 18,
                'margin_bottom'        => 18,
                'margin_left'          => 22,
                'margin_right'         => 22,
            ]);

        return $pdf->download($namaFile . '.pdf');
    }
}