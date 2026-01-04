<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TipoDeTrabajador extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tipo_de_trabajador';

    protected $fillable = [
        'idtipotrabajador_nisira',
        'name',
        'empresa_id',
        'estado',
    ];

    protected $casts = [
        'estado' => 'boolean',
    ];

    // Relaciones
    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function personal()
    {
        return $this->hasMany(Personal::class);
    }

    // Scopes
    public function scopeActivo($query)
    {
        return $query->where('estado', 1);
    }
}
