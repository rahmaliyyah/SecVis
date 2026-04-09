<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Camera extends Model
{
    protected $fillable = ['kode_kamera', 'lokasi', 'status'];

    public function violations()
    {
        return $this->hasMany(Violation::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }
}