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

    // POST /api/cameras — admin only
    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode_kamera' => 'required|string|max:20|unique:cameras,kode_kamera',
            'lokasi'      => 'required|string|max:100',
        ]);

        $camera = Camera::create([
            'kode_kamera' => $validated['kode_kamera'],
            'lokasi'      => $validated['lokasi'],
            'status'      => 'aktif',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kamera berhasil ditambahkan',
            'data'    => [
                'id'          => $camera->id,
                'kode_kamera' => $camera->kode_kamera,
                'lokasi'      => $camera->lokasi,
                'status'      => $camera->status,
            ],
        ], 201);
    }

    // PUT /api/cameras/{id} — admin only
    public function update(Request $request, $id)
    {
        $camera = Camera::findOrFail($id);

        $validated = $request->validate([
            'kode_kamera' => 'sometimes|string|max:20|unique:cameras,kode_kamera,' . $id,
            'lokasi'      => 'sometimes|string|max:100',
        ]);

        $camera->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Kamera berhasil diupdate',
            'data'    => [
                'id'          => $camera->id,
                'kode_kamera' => $camera->kode_kamera,
                'lokasi'      => $camera->lokasi,
                'status'      => $camera->status,
            ],
        ]);
    }

    // DELETE /api/cameras/{id} — admin only
    public function destroy($id)
    {
        $camera = Camera::findOrFail($id);
        $camera->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kamera berhasil dihapus',
        ]);
    }
}