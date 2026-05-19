<?php

namespace App\Services;

use App\Jobs\SendInspeccionNotificationEmailJob;
use App\Models\Inspeccion;
use App\Models\Personal;
use App\Models\User;
use App\Models\NotificationLog;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    protected $pushService;

    public function __construct(PushNotificationService $pushService)
    {
        $this->pushService = $pushService;
    }

    /**
     * Enviar notificaciones agrupadas por personal
     */
    public function enviarNotificacionesInspeccion(Inspeccion $inspeccion): array
    {
        $notificacionesEnviadas = [];
        $recipientIndex = 0;
        $delayStepSeconds = $this->getDelayStepSeconds();

        // Agrupar resultados por personal (responsables, visores, responsables levantamiento)
        $resultadosPorPersonal = $this->agruparResultadosPorPersonal($inspeccion);

        foreach ($resultadosPorPersonal as $personalId => $datos) {
            $personal = Personal::find($personalId);

            if (!$personal || !$personal->correo_empresa) {
                continue;
            }

            // Determinar tipo de notificación
            $tipoNotificacion = $this->determinarTipoNotificacion($datos['resultados']);

            try {
                $resultadosUnicos = collect($datos['resultados'])->unique('id')->values()->all();

                // Verificar que TODOS los resultados relevantes para este personal tengan
                // la foto final resuelta (no 'pendiente' y no nulo). Si hay alguno pendiente,
                // omitimos el envío hasta que estén todos resueltos. Registramos log de omisión.
                $tienePendiente = collect($resultadosUnicos)->contains(function ($r) {
                    $estadoFoto = $r->foto_final_estado ?? null;
                    return strtolower($estadoFoto) === 'pendiente';
                });

                if ($tienePendiente) {
                    Log::info("Omitida notificación a {$personal->correo_empresa}: existen resultados con foto_final_estado pendiente");
                    NotificationLog::create([
                        'inspeccion_id' => $inspeccion->id ?? null,
                        'personal_id' => $personalId,
                        'canal' => 'email',
                        'estado' => 'omitted',
                        'motivo' => 'Existen resultados con foto_final_estado pendiente',
                        'detalles' => ['resultados' => array_map(function ($r) {
                            return ['id' => $r->id, 'foto_final_estado' => $r->foto_final_estado ?? null];
                        }, $resultadosUnicos)],
                        'resultados_count' => count($resultadosUnicos),
                    ]);
                    continue;
                }

                $delaySeconds = $recipientIndex * $delayStepSeconds;
                $emailLog = $this->encolarNotificacionEmail(
                    $inspeccion,
                    $personal,
                    $resultadosUnicos,
                    $datos['roles'],
                    $tipoNotificacion,
                    $delaySeconds
                );
                $recipientIndex++;

                $notificacionesEnviadas[] = [
                    'personal_id' => $personalId,
                    'email' => $personal->correo_empresa,
                    'tipo' => $tipoNotificacion,
                    'resultados_count' => count($resultadosUnicos),
                    'estado' => 'queued',
                    'delay_seconds' => $delaySeconds,
                ];

                Log::info("Notificación encolada por email a: {$personal->correo_empresa} para inspección ID: {$inspeccion->id} / {{ $inspeccion->numero_registro }} con delay {$delaySeconds}s", [
                    'notification_log_id' => $emailLog->id,
                    'queue_connection' => config('queue.default'),
                ]);

                // Enviar push si existe usuario asociado
                $user = User::where('personal_id', $personalId)->first();
                if ($user) {
                    $pushTitle = $tipoNotificacion === 'felicitaciones'
                        ? "✓ Inspección Completada"
                        : "⚠ Hallazgos Pendientes";

                    $pushBody = "Tienes " . count($resultadosUnicos) . " hallazgo(s) en {$inspeccion->empresa->name}";

                    $pushResult = $this->pushService->sendToUser(
                        $user,
                        $pushTitle,
                        $pushBody,
                        [
                            'type' => 'inspeccion',
                            'inspeccion_id' => $inspeccion->id,
                            'notification_type' => $tipoNotificacion,
                        ]
                    );

                    // Registrar log de push (success if any token success)
                    $pushSuccess = collect($pushResult)->contains(function ($r) {
                        return isset($r['success']) && $r['success'];
                    });
                    NotificationLog::create([
                        'inspeccion_id' => $inspeccion->id ?? null,
                        'personal_id' => $personalId,
                        'canal' => 'push',
                        'estado' => $pushSuccess ? 'sent' : 'error',
                        'motivo' => $pushSuccess ? null : 'No se pudo enviar push o sin tokens activos',
                        'detalles' => ['push_result' => $pushResult],
                        'resultados_count' => count($resultadosUnicos),
                    ]);
                }
            } catch (\Exception $e) {
                Log::error("Error al enviar notificación a {$personal->correo_empresa}: {$e->getMessage()}");
                NotificationLog::create([
                    'inspeccion_id' => $inspeccion->id ?? null,
                    'personal_id' => $personalId,
                    'canal' => 'email',
                    'estado' => 'error',
                    'motivo' => $e->getMessage(),
                    'detalles' => null,
                    'resultados_count' => count($datos['resultados']),
                ]);
            }
        }

        return [
            'enviadas' => count($notificacionesEnviadas),
            'detalles' => $notificacionesEnviadas,
        ];
    }

    /**
     * Enviar notificaciones sólo para un conjunto de personal (filtrado por IDs)
     */
    public function enviarNotificacionesInspeccionParaPersonal(Inspeccion $inspeccion, array $personalIds): array
    {
        // Aquí iremos acumulando un resumen de las notificaciones que sí quedaron encoladas.
        $notificacionesEnviadas = [];

        // Este índice sirve para espaciar los envíos por email con un delay incremental
        // y evitar que todos salgan exactamente al mismo tiempo.
        $recipientIndex = 0;

        // Tiempo base de separación entre destinatarios, configurable por variable de entorno.
        $delayStepSeconds = $this->getDelayStepSeconds();

        // Agrupamos primero todos los resultados de la inspección por persona involucrada
        // (responsable, visor o responsable de levantamiento).
        $resultadosPorPersonal = $this->agruparResultadosPorPersonal($inspeccion);

        foreach ($resultadosPorPersonal as $personalId => $datos) {
            // Este método no notifica a todos: solo procesa las personas cuyos IDs fueron
            // pasados explícitamente en el arreglo $personalIds.
            if (!in_array($personalId, $personalIds, true)) {
                continue;
            }

            // Recuperamos el registro del personal para obtener su correo corporativo.
            // Si no existe o no tiene correo, no hay forma de enviar email.
            $personal = Personal::find($personalId);
            if (!$personal || !$personal->correo_empresa) {
                continue;
            }

            // El tipo de notificación depende del estado global de los resultados asociados
            // a esta persona: felicitaciones si todo está cerrado, pendientes en caso contrario.
            $tipoNotificacion = $this->determinarTipoNotificacion($datos['resultados']);

            try {
                // Si una misma persona aparece varias veces sobre el mismo resultado por tener
                // más de un rol, aquí eliminamos duplicados para no contar ni notificar doble.
                $resultadosUnicos = collect($datos['resultados'])->unique('id')->values()->all();

                // Verificar que TODOS los resultados relevantes para este personal tengan
                // la foto final resuelta (no 'pendiente' y no nulo). Si hay alguno pendiente o nulo
                // omitimos el envío hasta que estén todos resueltos.
                $tienePendiente = collect($resultadosUnicos)->contains(function ($r) {
                    // Consideramos pendiente si el estado de la foto final es 'pendiente' o si no está definido (null).
                    $estadoFoto = $r->foto_final_estado ?? '';
                    // Consideramos pendiente si el estado de la foto final es 'pendiente', vacío o nulo.
                    return strtolower($estadoFoto) === 'pendiente' || $estadoFoto === '' || $estadoFoto === null;
                });

                // Si todavía hay fotos finales pendientes de validar, se omite el envío completo
                // para esta persona y además se deja trazabilidad en logs y en NotificationLog.
                if ($tienePendiente) {
                    Log::info("Omitida notificación a {$personal->correo_empresa}: existen resultados con foto_final_estado pendiente");
                    NotificationLog::create([
                        'inspeccion_id' => $inspeccion->id ?? null,
                        'personal_id' => $personalId,
                        'canal' => 'email',
                        'estado' => 'omitted',
                        'motivo' => 'Existen resultados con foto_final_estado pendiente',
                        'detalles' => ['resultados' => array_map(function ($r) {
                            return ['id' => $r->id, 'foto_final_estado' => $r->foto_final_estado ?? null];
                        }, $resultadosUnicos)],
                        'resultados_count' => count($resultadosUnicos),
                    ]);
                    continue;
                }

                // El delay se calcula multiplicando la posición del destinatario por el paso base.
                // Ejemplo: 0s, 5s, 10s, 15s...
                $delaySeconds = $recipientIndex * $delayStepSeconds;

                // Encolamos el correo y guardamos el log asociado. El envío real lo hace el job,
                // no este método directamente.
                $emailLog = $this->encolarNotificacionEmail(
                    $inspeccion,
                    $personal,
                    $resultadosUnicos,
                    $datos['roles'],
                    $tipoNotificacion,
                    $delaySeconds
                );
                $recipientIndex++;

                // Guardamos un resumen de lo que quedó programado para devolverlo al caller.
                $notificacionesEnviadas[] = [
                    'personal_id' => $personalId,
                    'email' => $personal->correo_empresa,
                    'tipo' => $tipoNotificacion,
                    'resultados_count' => count($resultadosUnicos),
                    'estado' => 'queued',
                    'delay_seconds' => $delaySeconds,
                ];

                // Log operativo para auditoría y debugging del encolado de emails.
                Log::info("Notificación encolada por email a: {$personal->correo_empresa}", [
                    'notification_log_id' => $emailLog->id,
                    'delay_seconds' => $delaySeconds,
                ]);

                // Además del email, intentamos enviar push si esa persona tiene un usuario
                // del sistema vinculado mediante personal_id.
                $user = User::where('personal_id', $personalId)->first();
                if ($user) {
                    // El título cambia según si la notificación es de felicitación o de pendientes.
                    $pushTitle = $tipoNotificacion === 'felicitaciones'
                        ? "✓ Inspección Completada"
                        : "⚠ Hallazgos Pendientes";

                    // El cuerpo resume cuántos hallazgos tiene y en qué empresa aplica.
                    $pushBody = "Tienes " . count($resultadosUnicos) . " hallazgo(s) en {$inspeccion->empresa->name}";

                    // El servicio push se encarga de resolver tokens activos y enviar el payload.
                    $pushResult = $this->pushService->sendToUser(
                        $user,
                        $pushTitle,
                        $pushBody,
                        [
                            'type' => 'inspeccion',
                            'inspeccion_id' => $inspeccion->id,
                            'notification_type' => $tipoNotificacion,
                        ]
                    );

                    // Consideramos exitoso el push si al menos uno de los tokens del usuario
                    // respondió con success.
                    $pushSuccess = collect($pushResult)->contains(function ($r) {
                        return isset($r['success']) && $r['success'];
                    });

                    // Registramos en la tabla de logs si el push salió bien o falló,
                    // junto con el detalle crudo que devolvió el servicio.
                    NotificationLog::create([
                        'inspeccion_id' => $inspeccion->id ?? null,
                        'personal_id' => $personalId,
                        'canal' => 'push',
                        'estado' => $pushSuccess ? 'sent' : 'error',
                        'motivo' => $pushSuccess ? null : 'No se pudo enviar push o sin tokens activos',
                        'detalles' => ['push_result' => $pushResult],
                        'resultados_count' => count($resultadosUnicos),
                    ]);
                }
            } catch (\Exception $e) {
                // Si algo falla durante el armado/encolado/envío para esta persona, lo registramos
                // y continuamos con el resto de destinatarios en lugar de cortar todo el proceso.
                Log::error("Error al enviar notificación a {$personal->correo_empresa}: {$e->getMessage()}");
                NotificationLog::create([
                    'inspeccion_id' => $inspeccion->id ?? null,
                    'personal_id' => $personalId,
                    'canal' => 'email',
                    'estado' => 'error',
                    'motivo' => $e->getMessage(),
                    'detalles' => null,
                    'resultados_count' => count($datos['resultados']),
                ]);
            }
        }

        // El método devuelve un resumen compacto con cuántas notificaciones quedaron encoladas
        // y el detalle de cada destinatario procesado exitosamente.
        return [
            'enviadas' => count($notificacionesEnviadas),
            'detalles' => $notificacionesEnviadas,
        ];
    }

    /**
     * Agrupar resultados por personal: responsable, visores y responsables de levantamiento.
     * Devuelve un array con personal_id como clave y un array con los resultados asociados y los roles que tiene en esos resultados (puede ser más de un rol si es responsable en un resultado y visor en otro, por ejemplo).
     * Ejemplo de estructura devuelta:
     * [
     *   5 => [
     *     'resultados' => [/* array de resultados donde el personal 5 es responsable, visor o responsable levantamiento * /],
     *     'roles' => ['responsable', 'visor'] // roles que tiene el personal 5 en esos resultados
     *   ],
     *   8 => [
     *     'resultados' => [/* array de resultados donde el personal 8 es responsable, visor o responsable levantamiento * /],
     *     'roles' => ['responsable_levantamiento'] // roles que tiene el personal 8 en esos resultados
     *   ],
     *   // ...
     * ]
     */
    private function agruparResultadosPorPersonal(Inspeccion $inspeccion): array
    {
        $agrupacion = [];

        foreach ($inspeccion->resultados as $resultado) {
            // Responsable
            if ($resultado->responsable_id) {
                $this->agregarAlGrupo($agrupacion, $resultado->responsable_id, $resultado, 'responsable');
            }

            // Visores
            if ($resultado->visores) {
                foreach ($resultado->visores as $visor) {
                    $this->agregarAlGrupo($agrupacion, $visor->id, $resultado, 'visor');
                }
            }

            // Responsables de levantamiento
            if ($resultado->responsablesLevantamiento) {
                foreach ($resultado->responsablesLevantamiento as $resp) {
                    $this->agregarAlGrupo($agrupacion, $resp->id, $resultado, 'responsable_levantamiento');
                }
            }
        }

        // dd($agrupacion);

        return $agrupacion;
    }

    /**
     * Agregar resultado al grupo de un personal
     */
    private function agregarAlGrupo(array &$agrupacion, int $personalId, $resultado, string $rol): void
    {
        if (!isset($agrupacion[$personalId])) {
            $agrupacion[$personalId] = [
                'resultados' => [],
                'roles' => [],
            ];
        }

        $agrupacion[$personalId]['resultados'][] = $resultado;

        if (!in_array($rol, $agrupacion[$personalId]['roles'])) {
            $agrupacion[$personalId]['roles'][] = $rol;
        }
    }

    /**
     * Determinar tipo de notificación basado en estado de resultados
     */
    private function determinarTipoNotificacion(array $resultados): string
    {
        $todosCerrados = true;

        foreach ($resultados as $resultado) {
            if (!in_array($resultado->estado, ['Cerrado', 'Ejecutado', 'Cumplimiento', 'Buena Práctica'])) {
                $todosCerrados = false;
            }
        }

        // Si todos están cerrados o ejecutados -> felicitaciones
        // En caso contrario -> advertencia por pendientes u otros estados no cerrados
        return $todosCerrados ? 'felicitaciones' : 'pendientes';
    }

    private function encolarNotificacionEmail(
        Inspeccion $inspeccion,
        Personal $personal,
        array $resultadosUnicos,
        array $roles,
        string $tipoNotificacion,
        int $delaySeconds
    ): NotificationLog {
        if (!$inspeccion->id) {
            throw new \RuntimeException('La inspección debe tener ID de servidor para encolar notificaciones');
        }

        $resultadoIds = collect($resultadosUnicos)
            ->pluck('id')
            ->filter()
            ->map(fn($id) => (int) $id)
            ->values()
            ->all();

        $emailLog = NotificationLog::create([
            'inspeccion_id' => $inspeccion->id,
            'personal_id' => $personal->id,
            'canal' => 'email',
            'estado' => 'queued',
            'motivo' => null,
            'detalles' => [
                'tipo' => $tipoNotificacion,
                'delay_seconds' => $delaySeconds,
                'queue_connection' => config('queue.default'),
                'queued_at' => now()->toIso8601String(),
            ],
            'resultados_count' => count($resultadosUnicos),
        ]);

        SendInspeccionNotificationEmailJob::dispatch(
            $emailLog->id,
            (int) $inspeccion->id,
            (int) $personal->id,
            $resultadoIds,
            array_values($roles),
            $tipoNotificacion
        )->delay(now()->addSeconds($delaySeconds));

        return $emailLog;
    }

    private function getDelayStepSeconds(): int
    {
        $raw = $_ENV['MAIL_NOTIFICATION_DELAY_SECONDS']
            ?? $_SERVER['MAIL_NOTIFICATION_DELAY_SECONDS']
            ?? 5;

        return max(0, (int) $raw);
    }
}
