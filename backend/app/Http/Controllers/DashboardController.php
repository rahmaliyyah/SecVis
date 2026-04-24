<?php

namespace App\Http\Controllers;

use App\Models\Violation;
use App\Models\Shift;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    // GET /api/dashboard/summary
    public function summary(Request $request)
    {
        $periode = $request->periode ?? 'harian';

        $totalHariIni = Violation::whereDate('timestamp_deteksi', today())->count();

        $totalMingguIni = Violation::whereBetween('timestamp_deteksi', [
            now()->startOfWeek(),
            now()->endOfWeek(),
        ])->count();

        $totalBulanIni = Violation::whereYear('timestamp_deteksi', now()->year)
            ->whereMonth('timestamp_deteksi', now()->month)
            ->count();

        $shiftTerbanyak = Violation::selectRaw('shift_id, COUNT(*) as total')
            ->groupBy('shift_id')
            ->orderByDesc('total')
            ->with('shift')
            ->first();

        return response()->json([
            'success' => true,
            'data'    => [
                'total_hari_ini'   => $totalHariIni,
                'total_minggu_ini' => $totalMingguIni,
                'total_bulan_ini'  => $totalBulanIni,
                'shift_terbanyak'  => $shiftTerbanyak ? [
                    'shift_id'          => $shiftTerbanyak->shift_id,
                    'nama_shift'        => $shiftTerbanyak->shift->nama_shift,
                    'total_pelanggaran' => $shiftTerbanyak->total,
                ] : null,
            ],
        ]);
    }

    // GET /api/dashboard/trend
    public function trend(Request $request)
    {
        $request->validate([
            'tanggal_mulai'   => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
        ]);

        $data = Violation::selectRaw('DATE(timestamp_deteksi) as tanggal, COUNT(*) as total')
            ->whereDate('timestamp_deteksi', '>=', $request->tanggal_mulai)
            ->whereDate('timestamp_deteksi', '<=', $request->tanggal_selesai)
            ->groupBy('tanggal')
            ->orderBy('tanggal')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $data->map(fn($d) => [
                'tanggal' => $d->tanggal,
                'total'   => $d->total,
            ]),
        ]);
    }

    // GET /api/dashboard/by-shift
    public function byShift(Request $request)
    {
        $periode = $request->periode ?? 'bulanan';

        $query = Violation::selectRaw('shift_id, COUNT(*) as total_pelanggaran')
            ->groupBy('shift_id')
            ->with('shift');

        if ($periode === 'harian') {
            $query->whereDate('timestamp_deteksi', today());
        } elseif ($periode === 'mingguan') {
            $query->whereBetween('timestamp_deteksi', [
                now()->startOfWeek(),
                now()->endOfWeek(),
            ]);
        } else {
            $query->whereYear('timestamp_deteksi', now()->year)
                  ->whereMonth('timestamp_deteksi', now()->month);
        }

        $data = $query->get();

        return response()->json([
            'success' => true,
            'data'    => $data->map(fn($d) => [
                'shift_id'          => $d->shift_id,
                'nama_shift'        => $d->shift->nama_shift,
                'total_pelanggaran' => $d->total_pelanggaran,
            ]),
        ]);
    }

    // GET /api/dashboard/by-type
    public function byType(Request $request)
    {
        $periode = $request->periode ?? 'bulanan';

        $query = Violation::selectRaw('jenis_pelanggaran, COUNT(*) as total')
            ->groupBy('jenis_pelanggaran');

        if ($periode === 'harian') {
            $query->whereDate('timestamp_deteksi', today());
        } elseif ($periode === 'mingguan') {
            $query->whereBetween('timestamp_deteksi', [
                now()->startOfWeek(),
                now()->endOfWeek(),
            ]);
        } else {
            $query->whereYear('timestamp_deteksi', now()->year)
                  ->whereMonth('timestamp_deteksi', now()->month);
        }

        $data = $query->get();
        $grandTotal = $data->sum('total');

        return response()->json([
            'success' => true,
            'data'    => $data->map(fn($d) => [
                'jenis_pelanggaran' => $d->jenis_pelanggaran,
                'total'             => $d->total,
                'persentase'        => $grandTotal > 0
                    ? round(($d->total / $grandTotal) * 100, 2)
                    : 0,
            ]),
        ]);
    }
}