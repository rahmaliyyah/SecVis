<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Users
        DB::table('users')->insert([
            [
                'nama'       => 'Budi Santoso',
                'email'      => 'manager@epson.co.id',
                'password'   => Hash::make('password123'),
                'role'       => 'manager',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama'       => 'Siti Rahma',
                'email'      => 'hr@epson.co.id',
                'password'   => Hash::make('password123'),
                'role'       => 'hr',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama'       => 'Andi Admin',
                'email'      => 'admin@epson.co.id',
                'password'   => Hash::make('password123'),
                'role'       => 'admin',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Shifts
        DB::table('shifts')->insert([
            [
                'nama_shift'  => 'Shift 1',
                'jam_mulai'   => '06:00:00',
                'jam_selesai' => '14:00:00',
                'created_at'  => now(),
                'updated_at'  => now(),
            ],
            [
                'nama_shift'  => 'Shift 2',
                'jam_mulai'   => '14:00:00',
                'jam_selesai' => '22:00:00',
                'created_at'  => now(),
                'updated_at'  => now(),
            ],
        ]);

        // PJ Shifts
        DB::table('pj_shifts')->insert([
            [
                'nama'       => 'Rudi Hartono',
                'shift_id'   => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'nama'       => 'Dewi Kurnia',
                'shift_id'   => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Cameras
        DB::table('cameras')->insert([
            [
                'kode_kamera' => 'CAM-01',
                'lokasi'      => 'Pintu Masuk Area Maintenance',
                'status'      => 'aktif',
                'created_at'  => now(),
                'updated_at'  => now(),
            ],
        ]);
    }
}