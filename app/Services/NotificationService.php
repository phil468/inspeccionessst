<?php

namespace App\Services;

use App\Models\Inspeccion;
use App\Models\Personal;
use App\Models\User;
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
        $personalNotificado = collect();

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
                // Enviar email
                Mail::send(
                    'emails.notificacion-inspeccion',
                    [
                        'personal' => $personal,
                        'inspeccion' => $inspeccion,
                        'resultados' => $datos['resultados'],
                        'roles' => $datos['roles'],
                        'tipo' => $tipoNotificacion, // 'felicitaciones' o 'pendientes'
                    ],
                    function ($message) use ($personal, $inspeccion, $tipoNotificacion) {
                        $message->to($personal->correo_empresa, $personal->name)
                            ->subject(
                                $tipoNotificacion === 'felicitaciones'
                                    ? "✓ Inspección Completada - {$inspeccion->empresa->name}"
                                    : "⚠ Hallazgos Pendientes - {$inspeccion->empresa->name}"
                            );
                    }
                );

                // Enviar push notification si el personal tiene usuario
                $user = User::where('personal_id', $personalId)->first();
                if ($user) {
                    $pushTitle = $tipoNotificacion === 'felicitaciones'
                        ? "✓ Inspección Completada"
                        : "⚠ Hallazgos Pendientes";
                    
                    $pushBody = "Tienes " . count($datos['resultados']) . " hallazgo(s) en {$inspeccion->empresa->name}";
                    
                    $this->pushService->sendToUser(
                        $user,
                        $pushTitle,
                        $pushBody,
                        [
                            'type' => 'inspeccion',
                            'inspeccion_id' => $inspeccion->id,
                            'notification_type' => $tipoNotificacion,
                        ]
                    );
                }

                $notificacionesEnviadas[] = [
                    'personal_id' => $personalId,
                    'email' => $personal->correo_empresa,
                    'tipo' => $tipoNotificacion,
                    'resultados_count' => count($datos['resultados']),
                ];

                Log::info("Notificación enviada a: {$personal->correo_empresa}");
            } catch (\Exception $e) {
                Log::error("Error al enviar notificación a {$personal->correo_empresa}: {$e->getMessage()}");
            }
        }

        return [
            'enviadas' => count($notificacionesEnviadas),
            'detalles' => $notificacionesEnviadas,
        ];
    }

    /**
     * Agrupar resultados por personal
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
        $hayPendientes = false;
        $todosCerrados = true;

        foreach ($resultados as $resultado) {
            if (in_array($resultado->estado, ['Pendiente', 'En Proceso'])) {
                $hayPendientes = true;
                $todosCerrados = false;
            }
            
            if (!in_array($resultado->estado, ['Cerrado', 'Ejecutado'])) {
                $todosCerrados = false;
            }
        }

        // Si todos están cerrados o ejecutados -> felicitaciones
        // Si hay pendientes -> advertencia
        return $todosCerrados ? 'felicitaciones' : 'pendientes';
    }
}
