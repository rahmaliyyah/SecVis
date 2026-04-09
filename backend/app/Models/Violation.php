<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Shift;
use App\Models\Camera;

class Violation extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'camera_id',
        'shift_id',
        'jenis_pelanggaran',
        'confidence_score',
        'foto_bukti',
        'timestamp_deteksi',
    ];

    protected $dates = ['timestamp_deteksi', 'created_at'];

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function camera()
    {
        return $this->belongsTo(Camera::class);
    }

    public function notification()
    {
        return $this->hasOne(Notification::class);
    }
}