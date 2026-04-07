<?php

namespace App\Services;

use App\Models\Inspeccion;
use App\Models\Personal;
use App\Models\User;
use App\Models\NotificationLog;
use App\Mail\NotificacionInspeccion;
use Illuminate\Support\Facades\Mail;
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
                        'detalles' => ['resultados' => array_map(function ($r) { return ['id' => $r->id, 'foto_final_estado' => $r->foto_final_estado ?? null]; }, $resultadosUnicos)],
                        'resultados_count' => count($resultadosUnicos),
                    ]);
                    continue;
                }

                // Enviar email
                Mail::to($personal->correo_empresa, $personal->name)
                    ->send(new NotificacionInspeccion(
                        $personal,
                        $inspeccion,
                        $resultadosUnicos,
                        $datos['roles'],
                        $tipoNotificacion
                    ));

                // Registrar log de envío por email
                NotificationLog::create([
                    'inspeccion_id' => $inspeccion->id ?? null,
                    'personal_id' => $personalId,
                    'canal' => 'email',
                    'estado' => 'sent',
                    'motivo' => null,
                    'detalles' => ['tipo' => $tipoNotificacion],
                    'resultados_count' => count($resultadosUnicos),
                ]);

                $notificacionesEnviadas[] = [
                    'personal_id' => $personalId,
                    'email' => $personal->correo_empresa,
                    'tipo' => $tipoNotificacion,
                    'resultados_count' => count($resultadosUnicos),
                ];

                //informar de la notificacion enviada , cual era el numero de registro y el nombre del usuario que envia la notificacion
                Log::info("Notificación enviada por email a: {$personal->correo_empresa} para inspección ID: {$inspeccion->id} / { $inspeccion->numero_registro } por usuario ID: " . auth()->id() . " / " . auth()->user()->name);
                // Log::info("Notificación enviada por email a: {$personal->correo_empresa}");

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
                    $pushSuccess = collect($pushResult)->contains(function ($r) { return isset($r['success']) && $r['success']; });
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
        $notificacionesEnviadas = [];

        $resultadosPorPersonal = $this->agruparResultadosPorPersonal($inspeccion);

        foreach ($resultadosPorPersonal as $personalId => $datos) {
            if (!in_array($personalId, $personalIds, true)) {
                continue;
            }

            $personal = Personal::find($personalId);
            if (!$personal || !$personal->correo_empresa) {
                continue;
            }

            $tipoNotificacion = $this->determinarTipoNotificacion($datos['resultados']);

            try {
                $resultadosUnicos = collect($datos['resultados'])->unique('id')->values()->all();

                // Verificar que TODOS los resultados relevantes para este personal tengan
                // la foto final resuelta (no 'pendiente' y no nulo). Si hay alguno pendiente,
                // omitimos el envío hasta que estén todos resueltos.
                $tienePendiente = collect($resultadosUnicos)->contains(function ($r) {
                    $estadoFoto = $r->foto_final_estado ?? '';
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
                        'detalles' => ['resultados' => array_map(function ($r) { return ['id' => $r->id, 'foto_final_estado' => $r->foto_final_estado ?? null]; }, $resultadosUnicos)],
                        'resultados_count' => count($resultadosUnicos),
                    ]);
                    continue;
                }

                Mail::to($personal->correo_empresa, $personal->name)
                    ->send(new NotificacionInspeccion(
                        $personal,
                        $inspeccion,
                        $resultadosUnicos,
                        $datos['roles'],
                        $tipoNotificacion
                    ));

                NotificationLog::create([
                    'inspeccion_id' => $inspeccion->id ?? null,
                    'personal_id' => $personalId,
                    'canal' => 'email',
                    'estado' => 'sent',
                    'motivo' => null,
                    'detalles' => ['tipo' => $tipoNotificacion],
                    'resultados_count' => count($resultadosUnicos),
                ]);

                $notificacionesEnviadas[] = [
                    'personal_id' => $personalId,
                    'email' => $personal->correo_empresa,
                    'tipo' => $tipoNotificacion,
                    'resultados_count' => count($resultadosUnicos),
                ];

                Log::info("Notificación enviada a: {$personal->correo_empresa}");

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

                    $pushSuccess = collect($pushResult)->contains(function ($r) { return isset($r['success']) && $r['success']; });
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
            if (!in_array($resultado->estado, ['Cerrado', 'Ejecutado','Cumplimiento','Buena Práctica'])) {
                $todosCerrados = false;
            }
        }

        // Si todos están cerrados o ejecutados -> felicitaciones
        // En caso contrario -> advertencia por pendientes u otros estados no cerrados
        return $todosCerrados ? 'felicitaciones' : 'pendientes';
    }
}
