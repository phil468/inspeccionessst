<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class NivelJerarquico extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'nivel_jerarquicos';

    protected $fillable = [
        'name',
        'estado',
    ];

    protected $casts = [
        'estado' => 'boolean',
    ];

    // Relaciones
    public function tiposDePuesto()
    {
        return $this->hasMany(TipoDePuesto::class);
    }

    // Scopes
    public function scopeActivo($query)
    {
        return $query->where('estado', 1);
    }
}
