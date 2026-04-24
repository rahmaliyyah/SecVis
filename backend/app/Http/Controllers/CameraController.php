<?php

namespace App\Http\Controllers;

use App\Models\Camera;
use Illuminate\Http\Request;

class CameraController extends Controller
{
    // GET /api/cameras — semua role
    public function index()
    {
        $cameras = Camera::all();

        return response()->json([
            'success' => true,
            'data'    => $cameras->map(fn($c) => [
                'id'          => $c->id,
                'kode_kamera' => $c->kode_kamera,
                'lokasi'      => $c->lokasi,
                'status'      => $c->status,
            ]),
        ]);
    }

    // PUT /api/cameras/{id} — admin only
    public function update(Request $request, $id)
    {
        $camera = Camera::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:aktif,nonaktif',
        ]);

        $camera->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Status kamera berhasil diupdate',
            'data'    => [
                'id'          => $camera->id,
                'kode_kamera' => $camera->kode_kamera,
                'lokasi'      => $camera->lokasi,
                'status'      => $camera->status,
            ],
        ]);
    }
}