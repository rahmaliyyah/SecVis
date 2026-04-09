<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'violation_id',
        'camera_id',
        'status_pengiriman',
        'timestamp_kirim',
    ];

    protected $dates = ['timestamp_kirim', 'created_at'];

    public function violation()
    {
        return $this->belongsTo(Violation::class);
    }

    public function camera()
    {
        return $this->belongsTo(Camera::class);
    }
}