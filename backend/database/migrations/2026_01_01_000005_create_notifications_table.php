<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('violation_id')->constrained('violations')->onDelete('cascade');
            $table->foreignId('camera_id')->constrained('cameras')->onDelete('cascade');
            $table->enum('status_pengiriman', ['terkirim', 'gagal']);
            $table->timestamp('timestamp_kirim');
            $table->timestamp('created_at')->useCurrent();
            $table->index('camera_id');
            $table->index('timestamp_kirim');
        });
    }
    public function down(): void {
        Schema::dropIfExists('notifications');
    }
};