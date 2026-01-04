<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cargo extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'cargos';

    protected $fillable = [
        'name',
        'idcargo_nisira',
        'fechacreacion_nisira',
        'empresa_id',
        'tipo_de_puesto_id',
        'reporta_a',
        'estado',
    ];

    protected $casts = [
        'fechacreacion_nisira' => 'date',
        'estado' => 'boolean',
    ];

    // Relaciones
    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function tipoDePuesto()
    {
        return $this->belongsTo(TipoDePuesto::class);
    }

    public function cargoSuperior()
    {
        return $this->belongsTo(Cargo::class, 'reporta_a');
    }

    public function cargosSubordinados()
    {
        return $this->hasMany(Cargo::class, 'reporta_a');
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
