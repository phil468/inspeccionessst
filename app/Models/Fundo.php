<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Fundo extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'fundos';

    protected $fillable = [
        'nombre',
        'ubicacion',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
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

    public function scopeOrdenadoPorNombre($query)
    {
        return $query->orderBy('nombre', 'asc');
    }
}
