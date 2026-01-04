<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TipoDePuesto extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tipo_de_puestos';

    protected $fillable = [
        'name',
        'nivel_jerarquico_id',
        'estado',
    ];

    protected $casts = [
        'estado' => 'boolean',
    ];

    // Relaciones
    public function nivelJerarquico()
    {
        return $this->belongsTo(NivelJerarquico::class);
    }

    public function cargos()
    {
        return $this->hasMany(Cargo::class, 'tipo_de_puesto_id');
    }

    // Scopes
    public function scopeActivo($query)
    {
        return $query->where('estado', 1);
    }
}
