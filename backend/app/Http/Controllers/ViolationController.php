<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\Shift;
use App\Models\Violation;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ViolationController extends Controller
{
    // POST /api/violations — dipanggil edge device, tanpa token
    public function store(Request $request)
    {
        $validated = $request->validate([
            'camera_id'         => 'required|exists:cameras,id',
            'jenis_pelanggaran' => 'required|in:no-helmet,no-vest,no-boots,no-gloves,no-glasses',
            'confidence_score'  => 'required|numeric|min:0|max:100',
            'foto_bukti'        => 'required|string',
            'timestamp_deteksi' => 'required|date',
        ]);

        // Double check confidence score minimum 50%
        if ($validated['confidence_score'] < 50) {
            return response()->json([
                'success' => false,
                'message' => 'Pelanggaran diabaikan karena confidence score terlalu rendah (minimum 50%)',
                'data'    => null,
            ], 422);
        }

        // Tentukan shift aktif otomatis dari timestamp
        $jam = Carbon::parse($validated['timestamp_deteksi'])->format('H:i:s');
        $shift = Shift::where('jam_mulai', '<=', $jam)
                      ->where('jam_selesai', '>', $jam)
                      ->first();

        if (!$shift) {
            $shift = Shift::orderBy('id')->first();
        }

        // Simpan pelanggaran
        $violation = Violation::create([
            'camera_id'         => $validated['camera_id'],
            'shift_id'          => $shift->id,
            'jenis_pelanggaran' => $validated['jenis_pelanggaran'],
            'confidence_score'  => $validated['confidence_score'],
            'foto_bukti'        => $validated['foto_bukti'],
            'timestamp_deteksi' => Carbon::parse($validated['timestamp_deteksi'])->format('Y-m-d H:i:s'),
        ]);

        // Load relasi camera untuk keperluan notifikasi
        $violation->load('camera');

        // Cooldown check
        $inCooldown = Notification::where('camera_id', $validated['camera_id'])
            ->where('timestamp_kirim', '>=', now()->subSeconds(60))
            ->exists();

        if (!$inCooldown) {
            $statusPengiriman = 'gagal';

            try {
                $token  = env('TELEGRAM_BOT_TOKEN');
                $chatId = env('TELEGRAM_CHAT_ID');

                $caption = "🚨 *PELANGGARAN K3 TERDETEKSI*\n\n"
                         . "📍 Lokasi: " . $violation->camera->lokasi . "\n"
                         . "⏰ Waktu: " . $violation->timestamp_deteksi . "\n"
                         . "🔄 Shift: " . $shift->nama_shift . "\n"
                         . "⚠️ Pelanggaran: " . strtoupper(str_replace('_', ' ', $violation->jenis_pelanggaran)) . "\n"
                         . "📊 Confidence: " . $violation->confidence_score . "%";

                $fotoPath = storage_path('app/public/' . $violation->foto_bukti);

                if (file_exists($fotoPath)) {
                    // Kirim dengan foto
                    $response = Http::attach('photo', file_get_contents($fotoPath), basename($fotoPath))
                        ->post("https://api.telegram.org/bot{$token}/sendPhoto", [
                            'chat_id'    => $chatId,
                            'caption'    => $caption,
                            'parse_mode' => 'Markdown',
                        ]);
                } else {
                    // Kirim tanpa foto kalau file tidak ditemukan
                    $response = Http::get(
                        "https://api.telegram.org/bot{$token}/sendMessage",
                        [
                            'chat_id'    => $chatId,
                            'text'       => $caption . "\n\n⚠️ _Foto bukti tidak tersedia_",
                            'parse_mode' => 'Markdown',
                        ]
                    );
                }

                if ($response->successful()) {
                    $statusPengiriman = 'terkirim';
                }
            } catch (\Exception $e) {
                $statusPengiriman = 'gagal';
            }

            Notification::create([
                'violation_id'      => $violation->id,
                'camera_id'         => $validated['camera_id'],
                'status_pengiriman' => $statusPengiriman,
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

    // GET /api/violations — butuh token
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
        $data    = $query->paginate($perPage);

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

    // GET /api/violations/{id}
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