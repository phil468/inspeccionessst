<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class InspeccionResponsableArea extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'inspeccion_responsables_area';

    protected $fillable = [
        'local_id',
        'inspeccion_id',
        'area_id',
        'personal_id',
    ];

    protected $casts = [
        'inspeccion_id' => 'integer',
        'area_id' => 'integer',
        'personal_id' => 'integer',
    ];

    // Boot
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($responsable) {
            if (empty($responsable->local_id)) {
                $responsable->local_id = (string) Str::uuid();
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

    public function personal()
    {
        return $this->belongsTo(Personal::class);
    }
}
