<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    protected $fillable = ['nama_shift', 'jam_mulai', 'jam_selesai'];

    public function violations()
    {
        return $this->hasMany(Violation::class);
    }

    public function pjShifts()
    {
        return $this->hasMany(PjShift::class);
    }
}