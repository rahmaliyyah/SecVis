<?php

namespace App\Http\Controllers;

use App\Models\Violation;
use App\Models\Shift;
use App\Models\Camera;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    // ─── SUMMARY (global, no filter) ─────────────────────────────
    public function summary(Request $request)
    {
        $hariIni  = Violation::whereDate('timestamp_deteksi', today())->count();
        $mingguIni = Violation::whereBetween('timestamp_deteksi', [
            now()->startOfWeek(), now()->endOfWeek()
        ])->count();
        $bulanIni = Violation::whereYear('timestamp_deteksi', now()->year)
            ->whereMonth('timestamp_deteksi', now()->month)->count();

        $shiftTerbanyak = Violation::whereYear('timestamp_deteksi', now()->year)
            ->whereMonth('timestamp_deteksi', now()->month)
            ->selectRaw('shift_id, count(*) as total')
            ->groupBy('shift_id')
            ->orderByDesc('total')
            ->with('shift')
            ->first();

        return response()->json([
            'status' => 'success',
            'data'   => [
                'total_hari_ini'   => $hariIni,
                'total_minggu_ini' => $mingguIni,
                'total_bulan_ini'  => $bulanIni,
                'shift_terbanyak'  => $shiftTerbanyak ? [
                    'nama_shift'         => $shiftTerbanyak->shift->nama_shift ?? '-',
                    'total_pelanggaran'  => $shiftTerbanyak->total,
                ] : null,
            ],
        ]);
    }

    // ─── TREND (date range + optional shift/camera filter) ────────
    public function trend(Request $request)
    {
        $request->validate([
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date',
            'shift_id'      => 'nullable|integer',
            'camera_id'     => 'nullable|integer',
        ]);

        $query = Violation::whereBetween('timestamp_deteksi', [
            Carbon::parse($request->tanggal_mulai)->startOfDay(),
            Carbon::parse($request->tanggal_selesai)->endOfDay(),
        ]);

        if ($request->shift_id)  $query->where('shift_id',  $request->shift_id);
        if ($request->camera_id) $query->where('camera_id', $request->camera_id);

        $data = $query->selectRaw('DATE(timestamp_deteksi) as tanggal, COUNT(*) as total')
            ->groupBy('tanggal')
            ->orderBy('tanggal')
            ->get()
            ->map(fn($r) => [
                'tanggal' => Carbon::parse($r->tanggal)->format('d/m'),
                'total'   => $r->total,
            ]);

        return response()->json(['status' => 'success', 'data' => $data]);
    }

    // ─── BY SHIFT (periode + optional camera filter) ──────────────
    public function byShift(Request $request)
    {
        $periode   = $request->get('periode', 'bulanan');
        $camera_id = $request->camera_id;

        $query = Violation::query();
        if ($camera_id) $query->where('camera_id', $camera_id);

        if ($periode === 'harian') {
            $tanggal = $request->tanggal ?? today()->toDateString();
            $query->whereDate('timestamp_deteksi', $tanggal);
        } else {
            $query->whereYear('timestamp_deteksi', now()->year)
                  ->whereMonth('timestamp_deteksi', now()->month);
        }

        $violations = $query->get();
        $shifts     = Shift::all();

        $data = $shifts->map(function ($shift) use ($violations) {
            return [
                'nama_shift'         => $shift->nama_shift,
                'jam_mulai'          => $shift->jam_mulai,
                'jam_selesai'        => $shift->jam_selesai,
                'total_pelanggaran'  => $violations->where('shift_id', $shift->id)->count(),
            ];
        })->sortByDesc('total_pelanggaran')->values();

        return response()->json(['status' => 'success', 'data' => $data]);
    }

    // ─── BY TYPE (periode + optional shift/camera filter) ─────────
    public function byType(Request $request)
    {
        $periode   = $request->get('periode', 'bulanan');
        $shift_id  = $request->shift_id;
        $camera_id = $request->camera_id;

        $query = Violation::query();
        if ($shift_id)  $query->where('shift_id',  $shift_id);
        if ($camera_id) $query->where('camera_id', $camera_id);

        if ($periode === 'harian') {
            $tanggal = $request->tanggal ?? today()->toDateString();
            $query->whereDate('timestamp_deteksi', $tanggal);
        } else {
            $query->whereYear('timestamp_deteksi', now()->year)
                  ->whereMonth('timestamp_deteksi', now()->month);
        }

        $data = $query->selectRaw('jenis_pelanggaran, COUNT(*) as total')
            ->groupBy('jenis_pelanggaran')
            ->orderByDesc('total')
            ->get()
            ->map(fn($r) => [
                'jenis_pelanggaran' => $r->jenis_pelanggaran,
                'total'             => $r->total,
            ]);

        return response()->json(['status' => 'success', 'data' => $data]);
    }
}