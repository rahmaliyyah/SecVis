<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    // GET /api/shifts — semua role
    public function index()
    {
        $shifts = Shift::all();

        return response()->json([
            'success' => true,
            'data'    => $shifts->map(fn($s) => [
                'id'          => $s->id,
                'nama_shift'  => $s->nama_shift,
                'jam_mulai'   => $s->jam_mulai,
                'jam_selesai' => $s->jam_selesai,
            ]),
        ]);
    }

    // GET /api/shifts/active — tanpa token
    public function active()
    {
        $jam = now()->format('H:i:s');

        $shift = Shift::where('jam_mulai', '<=', $jam)
                      ->where('jam_selesai', '>', $jam)
                      ->first();

        if (!$shift) {
            $shift = Shift::orderBy('id')->first();
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'id'          => $shift->id,
                'nama_shift'  => $shift->nama_shift,
                'jam_mulai'   => $shift->jam_mulai,
                'jam_selesai' => $shift->jam_selesai,
            ],
        ]);
    }

    // POST /api/shifts — admin only
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_shift'  => 'required|string|max:50',
            'jam_mulai'   => 'required|date_format:H:i:s',
            'jam_selesai' => 'required|date_format:H:i:s',
        ]);

        $shift = Shift::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Shift berhasil ditambahkan',
            'data'    => [
                'id'          => $shift->id,
                'nama_shift'  => $shift->nama_shift,
                'jam_mulai'   => $shift->jam_mulai,
                'jam_selesai' => $shift->jam_selesai,
            ],
        ], 201);
    }

    // PUT /api/shifts/{id} — admin only
    public function update(Request $request, $id)
    {
        $shift = Shift::findOrFail($id);

        $validated = $request->validate([
            'nama_shift'  => 'sometimes|string|max:50',
            'jam_mulai'   => 'sometimes|date_format:H:i:s',
            'jam_selesai' => 'sometimes|date_format:H:i:s',
        ]);

        $shift->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Shift berhasil diupdate',
            'data'    => [
                'id'          => $shift->id,
                'nama_shift'  => $shift->nama_shift,
                'jam_mulai'   => $shift->jam_mulai,
                'jam_selesai' => $shift->jam_selesai,
            ],
        ]);
    }

    // DELETE /api/shifts/{id} — admin only
    public function destroy($id)
    {
        $shift = Shift::findOrFail($id);
        $shift->delete();

        return response()->json([
            'success' => true,
            'message' => 'Shift berhasil dihapus',
        ]);
    }
}