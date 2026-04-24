<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // GET /api/notifications — semua role
    public function index(Request $request)
    {
        $query = Notification::with(['violation', 'camera'])
            ->orderBy('timestamp_kirim', 'desc');

        if ($request->tanggal_mulai) {
            $query->whereDate('timestamp_kirim', '>=', $request->tanggal_mulai);
        }
        if ($request->tanggal_selesai) {
            $query->whereDate('timestamp_kirim', '<=', $request->tanggal_selesai);
        }
        if ($request->status_pengiriman) {
            $query->where('status_pengiriman', $request->status_pengiriman);
        }

        $data = $query->get();

        return response()->json([
            'success' => true,
            'data'    => $data->map(fn($n) => [
                'id'                => $n->id,
                'violation_id'      => $n->violation_id,
                'kode_kamera'       => $n->camera->kode_kamera,
                'status_pengiriman' => $n->status_pengiriman,
                'timestamp_kirim'   => $n->timestamp_kirim,
            ]),
        ]);
    }

    // GET /api/notifications/cooldown-check — tanpa token
    public function cooldownCheck(Request $request)
    {
        $request->validate([
            'camera_id' => 'required|exists:cameras,id',
        ]);

        $lastNotif = Notification::where('camera_id', $request->camera_id)
            ->where('timestamp_kirim', '>=', now()->subSeconds(60))
            ->latest('timestamp_kirim')
            ->first();

        $inCooldown = $lastNotif !== null;
        $sisaDetik  = 0;

        if ($inCooldown) {
            $sisaDetik = 60 - now()->diffInSeconds($lastNotif->timestamp_kirim);
            $sisaDetik = max(0, $sisaDetik);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'in_cooldown' => $inCooldown,
                'sisa_detik'  => $sisaDetik,
            ],
        ]);
    }
}