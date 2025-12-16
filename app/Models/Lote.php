<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lote extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'lotes';

    protected $fillable = [
        'fundo_id',
        'codigo',
        'nombre',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'fundo_id' => 'integer',
    ];

    // Relaciones
    public function fundo()
    {
        return $this->belongsTo(Fundo::class);
    }

    public function registros()
    {
        return $this->hasMany(Registro::class);
    }

    // Scopes
    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

    public function scopePorFundo($query, $fundoId)
    {
        return $query->where('fundo_id', $fundoId);
    }

    public function scopeConFundo($query)
    {
        return $query->with('fundo');
    }

    public function scopeOrdenadoPorCodigo($query)
    {
        return $query->orderBy('codigo', 'asc');
    }
}
