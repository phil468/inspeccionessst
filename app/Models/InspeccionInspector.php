<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class InspeccionInspector extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'inspeccion_inspectores';

    protected $fillable = [
        'local_id',
        'inspeccion_id',
        'personal_id',
        'fecha_firma',
        'firma_digital',
    ];

    protected $casts = [
        'inspeccion_id' => 'integer',
        'personal_id' => 'integer',
        'fecha_firma' => 'date',
    ];

    // Boot
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($inspector) {
            if (empty($inspector->local_id)) {
                $inspector->local_id = (string) Str::uuid();
            }
        });
    }

    // Relationships
    public function inspeccion()
    {
        return $this->belongsTo(Inspeccion::class);
    }

    public function personal()
    {
        return $this->belongsTo(Personal::class);
    }
}
