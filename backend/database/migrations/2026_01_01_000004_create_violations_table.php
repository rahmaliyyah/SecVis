<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('violations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('camera_id')->constrained('cameras')->onDelete('cascade');
            $table->foreignId('shift_id')->constrained('shifts')->onDelete('cascade');
            $table->enum('jenis_pelanggaran', ['no_helmet','no_vest','no_boots','no_gloves','no_glasses']);
            $table->float('confidence_score');
            $table->string('foto_bukti', 255);
            $table->timestamp('timestamp_deteksi');
            $table->timestamp('created_at')->useCurrent();
            $table->index('timestamp_deteksi');
            $table->index('shift_id');
            $table->index('camera_id');
        });
    }
    public function down(): void { Schema::dropIfExists('violations'); }
};