<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationLog extends Model
{
    protected $table = 'notification_logs';

    protected $fillable = [
        'inspeccion_id',
        'personal_id',
        'canal',
        'estado',
        'motivo',
        'detalles',
        'resultados_count',
    ];

    protected $casts = [
        'detalles' => 'array',
    ];
}
