<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inspeccion;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Enviar notificaciones de una inspección
     */
    public function enviarNotificacionesInspeccion(Request $request, $inspeccionLocalId)
    {
        // Validar que la inspección exista        
        $inspeccion = Inspeccion::with([
            'empresa',
            'area',
            'inspectores',
            'resultados.responsable',
            'resultados.visores',
            'resultados.responsablesLevantamiento',
        ])->where('local_id', $inspeccionLocalId)->first();

        if (!$inspeccion) {
            return response()->json([
                'success' => false,
                'message' => 'Inspección no encontrada',
            ], 404);
        }

        // return response()->json([
        //     'success' => true,
        //     'data' => $inspeccion,
        // ]);
        // dd($inspeccion);

        // Verificar que el usuario tenga permisos, puede enviar notificaciones el usario que lo creo o un administrador o algún inspector de la inspección
        $user = $request->user();


        if (
            $inspeccion->user_id !== $user->id 
        && !$user->hasRole('Administrador')
        && !in_array($user->personal_id, $inspeccion->inspectores->pluck('id')->toArray())
        ) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para enviar notificaciones de esta inspección',
                'data' => [
                    'user_id' => $user->id,
                    'inspeccion_user_id' => $inspeccion->user_id,
                    'has_role_admin' => $user->hasRole('Administrador'),
                    'personal_id' => $user->personal_id,
                    'inspectores_ids' => $inspeccion->inspectores->pluck('id')->toArray()
                ]
            ], 403);
        }

        // Enviar notificaciones
        $resultado = $this->notificationService->enviarNotificacionesInspeccion($inspeccion);

        return response()->json([
            'success' => true,
            'message' => "Se enviaron {$resultado['enviadas']} notificaciones",
            'data' => $resultado,
        ]);
    }

    /**
     * Enviar notificaciones masivas (para múltiples inspecciones)
     */
    public function enviarNotificacionesMasivas(Request $request)
    {
        $request->validate([
            'inspeccion_ids' => 'required|array',
            'inspeccion_ids.*' => 'exists:inspecciones,id',
        ]);

        $user = $request->user();
        $totalEnviadas = 0;
        $detalles = [];

        foreach ($request->inspeccion_ids as $inspeccionId) {
            $inspeccion = Inspeccion::with([
                'empresa',
                'resultados.responsable',
                'resultados.visores',
                'resultados.responsablesLevantamiento',
            ])->find($inspeccionId);

            // Verificar permisos
            if ($inspeccion->user_id !== $user->id && !$user->hasRole('Administrador')) {
                continue;
            }

            $resultado = $this->notificationService->enviarNotificacionesInspeccion($inspeccion);
            $totalEnviadas += $resultado['enviadas'];
            $detalles[] = [
                'inspeccion_id' => $inspeccionId,
                'enviadas' => $resultado['enviadas'],
            ];
        }

        return response()->json([
            'success' => true,
            'message' => "Se enviaron {$totalEnviadas} notificaciones en total",
            'data' => [
                'total_enviadas' => $totalEnviadas,
                'inspecciones_procesadas' => count($detalles),
                'detalles' => $detalles,
            ],
        ]);
    }
}
