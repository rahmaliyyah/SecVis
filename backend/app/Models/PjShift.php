<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Shift;

class PjShift extends Model
{
    protected $table = 'pj_shifts';
    protected $fillable = ['nama', 'shift_id'];

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }
}