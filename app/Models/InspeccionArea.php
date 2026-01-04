<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class InspeccionArea extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'inspeccion_areas';

    protected $fillable = [
        'local_id',
        'inspeccion_id',
        'area_id',
    ];

    protected $casts = [
        'inspeccion_id' => 'integer',
        'area_id' => 'integer',
    ];

    // Boot
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($inspeccionArea) {
            if (empty($inspeccionArea->local_id)) {
                $inspeccionArea->local_id = (string) Str::uuid();
            }
        });
    }

    // Relationships
    public function inspeccion()
    {
        return $this->belongsTo(Inspeccion::class);
    }

    public function area()
    {
        return $this->belongsTo(Area::class);
    }
}
