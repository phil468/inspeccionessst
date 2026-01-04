<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResultadoInspeccion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FotoApprovalController extends Controller
{
    /**
     * Aprobar o rechazar foto inicial
     */
    public function aprobarFotoInicial(Request $request, $resultadoId)
    {
        $validator = Validator::make($request->all(), [
            'accion' => 'required|in:aprobar,rechazar',
            'comentario' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $resultado = ResultadoInspeccion::findOrFail($resultadoId);
        $user = $request->user();

        // Verificar que el usuario sea inspector en la inspección
        $inspeccion = $resultado->inspeccion()->with('inspectores')->first();
        $esInspector = $inspeccion->inspectores->contains('id', $user->personal_id);

        if (!$esInspector && !$user->hasRole('Administrador')) {
            return response()->json([
                'success' => false,
                'message' => 'Solo los inspectores asignados pueden aprobar/rechazar fotos',
            ], 403);
        }

        // Verificar que haya foto
        if (!$resultado->registro_fotografico_inicial) {
            return response()->json([
                'success' => false,
                'message' => 'No hay foto inicial para aprobar',
            ], 400);
        }

        // Actualizar estado
        $estado = $request->accion === 'aprobar' ? 'aprobada' : 'rechazada';
        
        $resultado->update([
            'foto_inicial_estado' => $estado,
            'foto_inicial_comentario' => $request->comentario,
            'foto_inicial_aprobador_id' => $user->personal_id,
            'foto_inicial_aprobada_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => $request->accion === 'aprobar' 
                ? 'Foto inicial aprobada correctamente' 
                : 'Foto inicial rechazada',
            'data' => $resultado->fresh(['fotoInicialAprobador']),
        ]);
    }

    /**
     * Aprobar o rechazar foto final
     */
    public function aprobarFotoFinal(Request $request, $resultadoId)
    {
        $validator = Validator::make($request->all(), [
            'accion' => 'required|in:aprobar,rechazar',
            'comentario' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $resultado = ResultadoInspeccion::findOrFail($resultadoId);
        $user = $request->user();

        // Verificar que el usuario sea inspector en la inspección
        $inspeccion = $resultado->inspeccion()->with('inspectores')->first();
        $esInspector = $inspeccion->inspectores->contains('id', $user->personal_id);

        if (!$esInspector && !$user->hasRole('Administrador')) {
            return response()->json([
                'success' => false,
                'message' => 'Solo los inspectores asignados pueden aprobar/rechazar fotos',
            ], 403);
        }

        // Verificar que haya foto
        if (!$resultado->registro_fotografico_final) {
            return response()->json([
                'success' => false,
                'message' => 'No hay foto final para aprobar',
            ], 400);
        }

        // Actualizar estado
        $estado = $request->accion === 'aprobar' ? 'aprobada' : 'rechazada';
        
        $resultado->update([
            'foto_final_estado' => $estado,
            'foto_final_comentario' => $request->comentario,
            'foto_final_aprobador_id' => $user->personal_id,
            'foto_final_aprobada_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => $request->accion === 'aprobar' 
                ? 'Foto final aprobada correctamente' 
                : 'Foto final rechazada',
            'data' => $resultado->fresh(['fotoFinalAprobador']),
        ]);
    }

    /**
     * Obtener historial de aprobaciones
     */
    public function obtenerHistorial($resultadoId)
    {
        $resultado = ResultadoInspeccion::with([
            'fotoInicialAprobador',
            'fotoFinalAprobador',
        ])->findOrFail($resultadoId);

        return response()->json([
            'success' => true,
            'data' => [
                'foto_inicial' => [
                    'estado' => $resultado->foto_inicial_estado,
                    'comentario' => $resultado->foto_inicial_comentario,
                    'aprobador' => $resultado->fotoInicialAprobador,
                    'aprobada_at' => $resultado->foto_inicial_aprobada_at,
                ],
                'foto_final' => [
                    'estado' => $resultado->foto_final_estado,
                    'comentario' => $resultado->foto_final_comentario,
                    'aprobador' => $resultado->fotoFinalAprobador,
                    'aprobada_at' => $resultado->foto_final_aprobada_at,
                ],
            ],
        ]);
    }
}
