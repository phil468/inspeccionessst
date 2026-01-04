<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class ResultadoResponsable extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'resultado_responsables';

    protected $fillable = [
        'local_id',
        'resultado_id',
        'personal_id',
    ];

    protected $casts = [
        'resultado_id' => 'integer',
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
    public function resultado()
    {
        return $this->belongsTo(ResultadoInspeccion::class, 'resultado_id');
    }

    public function personal()
    {
        return $this->belongsTo(Personal::class);
    }
}
