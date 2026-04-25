<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement("ALTER TABLE violations MODIFY jenis_pelanggaran ENUM('no-helmet','no-vest','no-boots','no-gloves','no-glasses') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE violations MODIFY jenis_pelanggaran ENUM('no_helmet','no_vest','no_boots','no_gloves','no_glasses') NOT NULL");
    }
};