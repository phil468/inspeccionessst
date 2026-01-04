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
    public function enviarNotificacionesInspeccion(Request $request, $inspeccionId)
    {
        $inspeccion = Inspeccion::with([
            'empresa',
            'area',
            'resultados.responsable',
            'resultados.visores',
            'resultados.responsablesLevantamiento',
        ])->findOrFail($inspeccionId);

        // dd($inspeccion);

        // Verificar que el usuario tenga permisos
        $user = $request->user();
        if ($inspeccion->user_id !== $user->id && !$user->hasRole('Administrador')) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para enviar notificaciones de esta inspección',
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
