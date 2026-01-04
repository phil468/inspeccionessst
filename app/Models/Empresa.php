<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Empresa extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'razon_social',
        'ruc',
        'domicilio',
        'actividad_economica',
        'idempresa_nisira',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    // Relaciones
    public function areas()
    {
        return $this->hasMany(Area::class);
    }

    public function inspecciones()
    {
        return $this->hasMany(Inspeccion::class);
    }

    // Scopes
    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

    public function scopeOrdenadoPorNombre($query)
    {
        return $query->orderBy('name');
    }
}
