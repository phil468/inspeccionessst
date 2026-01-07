<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ResultadoResponsableLevantamiento extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'resultado_responsables_levantamiento';

    protected $fillable = [
        'local_id',
        'resultado_id',
        'personal_id',
    ];

    // Relaciones
    public function resultado()
    {
        return $this->belongsTo(ResultadoInspeccion::class, 'resultado_id');
    }

    public function personal()
    {
        return $this->belongsTo(Personal::class);
    }
}
