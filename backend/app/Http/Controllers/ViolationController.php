<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Shift;
use App\Models\Violation;
use Carbon\Carbon;
use Illuminate\Http\Request;


class ViolationController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'camera_id'         => 'required|exists:cameras,id',
            'jenis_pelanggaran' => 'required|in:no_helmet,no_vest,no_boots,no_gloves,no_glasses',
            'confidence_score'  => 'required|numeric|min:0|max:100',
            'foto_bukti'        => 'required|string',
            'timestamp_deteksi' => 'required|date',
        ]);

        // Tentukan shift aktif otomatis dari timestamp
        $jam = Carbon::parse($validated['timestamp_deteksi'])->format('H:i:s');
        $shift = Shift::where('jam_mulai', '<=', $jam)
                      ->where('jam_selesai', '>', $jam)
                      ->first();

        if (!$shift) {
            $shift = Shift::orderBy('id')->first();
        }

        $violation = Violation::create([
            'camera_id'         => $validated['camera_id'],
            'shift_id'          => $shift->id,
            'jenis_pelanggaran' => $validated['jenis_pelanggaran'],
            'confidence_score'  => $validated['confidence_score'],
            'foto_bukti'        => $validated['foto_bukti'],
            'timestamp_deteksi' => Carbon::parse($validated['timestamp_deteksi'])->format('Y-m-d H:i:s'), // fix: convert ISO 8601 ke format MySQL
        ]);

        // Cooldown check
        $inCooldown = Notification::where('camera_id', $validated['camera_id'])
            ->where('timestamp_kirim', '>=', now()->subSeconds(60))
            ->exists();

        if (!$inCooldown) {
            Notification::create([
                'violation_id'      => $violation->id,
                'camera_id'         => $validated['camera_id'],
                'status_pengiriman' => 'terkirim',
                'timestamp_kirim'   => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Pelanggaran berhasil dicatat',
            'data'    => [
                'id'                => $violation->id,
                'shift_id'          => $shift->id,
                'nama_shift'        => $shift->nama_shift,
                'camera_id'         => $violation->camera_id,
                'jenis_pelanggaran' => $violation->jenis_pelanggaran,
                'confidence_score'  => $violation->confidence_score,
                'timestamp_deteksi' => $violation->timestamp_deteksi,
            ],
        ], 201);
    }

    public function index(Request $request)
    {
        $query = Violation::with(['shift', 'camera'])
            ->orderBy('timestamp_deteksi', 'desc');

        if ($request->shift_id) {
            $query->where('shift_id', $request->shift_id);
        }
        if ($request->jenis_pelanggaran) {
            $query->where('jenis_pelanggaran', $request->jenis_pelanggaran);
        }
        if ($request->tanggal_mulai) {
            $query->whereDate('timestamp_deteksi', '>=', $request->tanggal_mulai);
        }
        if ($request->tanggal_selesai) {
            $query->whereDate('timestamp_deteksi', '<=', $request->tanggal_selesai);
        }

        $perPage = $request->per_page ?? 20;
        $data = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => $data->map(fn($v) => [
                'id'                => $v->id,
                'shift_id'          => $v->shift_id,
                'nama_shift'        => $v->shift->nama_shift,
                'kode_kamera'       => $v->camera->kode_kamera,
                'jenis_pelanggaran' => $v->jenis_pelanggaran,
                'confidence_score'  => $v->confidence_score,
                'timestamp_deteksi' => $v->timestamp_deteksi,
            ]),
            'meta'    => [
                'total'    => $data->total(),
                'page'     => $data->currentPage(),
                'per_page' => $data->perPage(),
            ],
        ]);
    }

    public function show($id)
    {
        $v = Violation::with(['shift', 'camera'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => [
                'id'                => $v->id,
                'nama_shift'        => $v->shift->nama_shift,
                'kode_kamera'       => $v->camera->kode_kamera,
                'lokasi_kamera'     => $v->camera->lokasi,
                'jenis_pelanggaran' => $v->jenis_pelanggaran,
                'confidence_score'  => $v->confidence_score,
                'foto_url'          => asset('storage/' . $v->foto_bukti),
                'timestamp_deteksi' => $v->timestamp_deteksi,
            ],
        ]);
    }
}