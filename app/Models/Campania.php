<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Campania extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'campanias';

    protected $fillable = [
        'nombre',
        'anio_inicio',
        'anio_fin',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'anio_inicio' => 'integer',
        'anio_fin' => 'integer',
    ];

    // Relaciones
    public function registros()
    {
        return $this->hasMany(Registro::class);
    }

    // Scopes
    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

    public function scopeOrdenadoPorReciente($query)
    {
        return $query->orderBy('anio_inicio', 'desc');
    }
}
