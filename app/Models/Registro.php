<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Registro extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'registros';

    protected $fillable = [
        'local_id',
        'user_id',
        'campania_id',
        'material_id',
        'fundo_id',
        'lote_id',
        'motivo_id',
        'cantidad',
        'numero_tractor',
        'observaciones',
        'fecha_registro',
        'synced',
        'synced_at',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'campania_id' => 'integer',
        'material_id' => 'integer',
        'fundo_id' => 'integer',
        'lote_id' => 'integer',
        'motivo_id' => 'integer',
        'cantidad' => 'decimal:2',
        'fecha_registro' => 'datetime',
        'synced' => 'boolean',
        'synced_at' => 'datetime',
    ];

    // Boot
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($registro) {
            if (empty($registro->local_id)) {
                $registro->local_id = (string) Str::uuid();
            }
            if (empty($registro->fecha_registro)) {
                $registro->fecha_registro = now();
            }
        });
    }

    // Relaciones
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function campania()
    {
        return $this->belongsTo(Campania::class);
    }

    public function material()
    {
        return $this->belongsTo(Material::class);
    }

    public function fundo()
    {
        return $this->belongsTo(Fundo::class);
    }

    public function lote()
    {
        return $this->belongsTo(Lote::class);
    }

    public function motivo()
    {
        return $this->belongsTo(Motivo::class);
    }

    // Scopes
    public function scopeSincronizado($query)
    {
        return $query->where('synced', true);
    }

    public function scopePendienteSincronizacion($query)
    {
        return $query->where('synced', false);
    }

    public function scopePorUsuario($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopePorFecha($query, $fechaInicio, $fechaFin = null)
    {
        if ($fechaFin) {
            return $query->whereBetween('fecha_registro', [$fechaInicio, $fechaFin]);
        }
        return $query->whereDate('fecha_registro', $fechaInicio);
    }

    public function scopeConRelaciones($query)
    {
        return $query->with([
            'user:id,name,email',
            'campania:id,nombre',
            'material:id,codigo,nombre',
            'fundo:id,nombre',
            'lote:id,codigo,nombre',
            'motivo:id,nombre'
        ]);
    }

    public function scopeOrdenadoPorReciente($query)
    {
        return $query->orderBy('fecha_registro', 'desc');
    }

    // Métodos
    public function marcarComoSincronizado()
    {
        $this->update([
            'synced' => true,
            'synced_at' => now(),
        ]);
    }
}
