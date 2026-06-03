<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Users
        User::firstOrCreate(['email' => 'manager@epson.co.id'], [
            'nama' => 'Manager Epson',
            'password' => Hash::make('password123'),
            'role' => 'manager',
        ]);
        User::firstOrCreate(['email' => 'hr@epson.co.id'], [
            'nama' => 'HR Epson',
            'password' => Hash::make('password123'),
            'role' => 'hr',
        ]);
        User::firstOrCreate(['email' => 'admin@epson.co.id'], [
            'nama' => 'Admin SecVis',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);

        // Shifts
        DB::table('shifts')->upsert([
            ['nama_shift' => 'Shift 1', 'jam_mulai' => '06:00:00', 'jam_selesai' => '14:00:00', 'created_at' => now(), 'updated_at' => now()],
            ['nama_shift' => 'Shift 2', 'jam_mulai' => '14:00:00', 'jam_selesai' => '22:00:00', 'created_at' => now(), 'updated_at' => now()],
        ], ['nama_shift'], ['jam_mulai', 'jam_selesai']);

        // Cameras
        DB::table('cameras')->upsert([
            ['kode_kamera' => 'CAM-01', 'lokasi' => 'Pintu Masuk Area Maintenance', 'status' => 'aktif', 'created_at' => now(), 'updated_at' => now()],
        ], ['kode_kamera'], ['lokasi', 'status']);
    }
}