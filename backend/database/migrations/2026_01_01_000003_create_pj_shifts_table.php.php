<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('pj_shifts', function (Blueprint $table) {
            $table->id();
            $table->string('nama', 100);
            $table->foreignId('shift_id')->constrained('shifts')->onDelete('cascade');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('pj_shifts'); }
};