<?php

namespace App\Jobs;

use App\Mail\NotificacionInspeccion;
use App\Models\Inspeccion;
use App\Models\NotificationLog;
use App\Models\Personal;
use App\Models\ResultadoInspeccion;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendInspeccionNotificationEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    /**
     * @var array<int, int>
     */
    public array $backoff = [30, 120, 300];

    /**
     * @param array<int, int> $resultadoIds
     * @param array<int, string> $roles
     */
    public function __construct(
        public int $notificationLogId,
        public int $inspeccionId,
        public int $personalId,
        public array $resultadoIds,
        public array $roles,
        public string $tipoNotificacion
    ) {}

    public function handle(): void
    {
        $notificationLog = NotificationLog::find($this->notificationLogId);

        try {
            $inspeccion = Inspeccion::with('empresa')->findOrFail($this->inspeccionId);
            $personal = Personal::findOrFail($this->personalId);

            if (!$personal->correo_empresa) {
                throw new \RuntimeException('Personal sin correo configurado');
            }

            $resultados = ResultadoInspeccion::whereIn('id', $this->resultadoIds)
                ->get()
                ->all();

            if (count($resultados) === 0) {
                throw new \RuntimeException('No se encontraron resultados para enviar en notificación');
            }

            Log::info('Intento de envío de email de notificación', [
                'notification_log_id' => $this->notificationLogId,
                'attempt' => $this->attempts(),
                'to' => $personal->correo_empresa,
                'inspeccion_id' => $inspeccion->id,
            ]);

            Mail::to($personal->correo_empresa)->send(new NotificacionInspeccion(
                $personal,
                $inspeccion,
                $resultados,
                $this->roles,
                $this->tipoNotificacion
            ));

            if ($notificationLog) {
                $detalles = $notificationLog->detalles ?? [];
                $notificationLog->update([
                    'estado' => 'sent',
                    'motivo' => null,
                    'detalles' => array_merge($detalles, [
                        'sent_at' => now()->toIso8601String(),
                        'attempts' => $this->attempts(),
                    ]),
                ]);
            }

            Log::info('Notificación enviada por email', [
                'notification_log_id' => $this->notificationLogId,
                'to' => $personal->correo_empresa,
                'inspeccion_id' => $inspeccion->id,
                'numero_registro' => $inspeccion->numero_registro,
                'attempts' => $this->attempts(),
            ]);
        } catch (Throwable $e) {
            if ($notificationLog) {
                $detalles = $notificationLog->detalles ?? [];
                $notificationLog->update([
                    'estado' => 'retrying',
                    'motivo' => $e->getMessage(),
                    'detalles' => array_merge($detalles, [
                        'last_error_at' => now()->toIso8601String(),
                        'attempts' => $this->attempts(),
                    ]),
                ]);
            }

            Log::warning('Falló intento de envío de email de notificación', [
                'notification_log_id' => $this->notificationLogId,
                'attempt' => $this->attempts(),
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function failed(Throwable $e): void
    {
        $notificationLog = NotificationLog::find($this->notificationLogId);

        if ($notificationLog) {
            $detalles = $notificationLog->detalles ?? [];
            $notificationLog->update([
                'estado' => 'error',
                'motivo' => $e->getMessage(),
                'detalles' => array_merge($detalles, [
                    'failed_at' => now()->toIso8601String(),
                    'attempts' => $this->attempts(),
                ]),
            ]);
        }

        Log::error('Notificación de email fallida definitivamente', [
            'notification_log_id' => $this->notificationLogId,
            'error' => $e->getMessage(),
            'attempts' => $this->attempts(),
        ]);
    }
}
