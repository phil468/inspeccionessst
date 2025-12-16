<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Registro;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class SyncController extends Controller
{
    /**
     * Sincronizar registros pendientes desde el cliente
     * Recibe un array de registros creados offline y los almacena en el servidor
     */
    public function syncRegistros(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'registros' => 'required|array',
            'registros.*.local_id' => 'required|string|uuid',
            'registros.*.campania_id' => 'required|exists:campanias,id',
            'registros.*.material_id' => 'required|exists:materiales,id',
            'registros.*.fundo_id' => 'required|exists:fundos,id',
            'registros.*.lote_id' => 'required|exists:lotes,id',
            'registros.*.motivo_id' => 'required|exists:motivos,id',
            'registros.*.cantidad' => 'required|numeric|min:0',
            'registros.*.numero_tractor' => 'nullable|string|max:255',
            'registros.*.observaciones' => 'nullable|string',
            'registros.*.fecha_registro' => 'required|date',
            'registros.*.created_at' => 'nullable|date',
            'registros.*.updated_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $registrosRecibidos = $request->registros;
        $resultados = [
            'sincronizados' => [],
            'duplicados' => [],
            'errores' => [],
        ];

        DB::beginTransaction();

        try {
            foreach ($registrosRecibidos as $registroData) {
                $localId = $registroData['local_id'];

                // Verificar si ya existe por local_id o por id del servidor
                $existente = Registro::where('local_id', $localId)
                    ->orWhere(function($query) use ($registroData) {
                        if (isset($registroData['id'])) {
                            $query->where('id', $registroData['id']);
                        }
                    })
                    ->first();

                if ($existente) {
                    // Ya existe, verificar timestamps para evitar sobrescribir datos más recientes
                    $updatedAtServidor = $existente->updated_at; // Carbon instance en UTC
                    $updatedAtCliente = isset($registroData['updated_at']) 
                        ? \Carbon\Carbon::parse($registroData['updated_at'])->setTimezone('UTC')
                        : null;

                    // Si el cliente tiene un timestamp más antiguo que el servidor, hay conflicto
                    if ($updatedAtCliente && $updatedAtCliente->lt($updatedAtServidor)) {
                        $resultados['errores'][] = [
                            'local_id' => $localId,
                            'server_id' => $existente->id,
                            'message' => 'Conflicto: el registro en el servidor es más reciente',
                            'conflict' => true,
                            'server_updated_at' => $updatedAtServidor->toISOString(),
                            'client_updated_at' => $updatedAtCliente->format('c'),
                        ];
                        continue;
                    }

                    // Si llegamos aquí, el cliente es más reciente o igual, procedemos a actualizar
                    $datosActualizacion = [
                        'campania_id' => $registroData['campania_id'],
                        'material_id' => $registroData['material_id'],
                        'fundo_id' => $registroData['fundo_id'],
                        'lote_id' => $registroData['lote_id'],
                        'motivo_id' => $registroData['motivo_id'],
                        'cantidad' => $registroData['cantidad'],
                        'numero_tractor' => $registroData['numero_tractor'] ?? null,
                        'observaciones' => $registroData['observaciones'] ?? null,
                        // 'fecha_registro' => $registroData['fecha_registro'],
                         // Mantener la fecha_registro original para no perder la referencia temporal
                        'synced' => true,
                        'synced_at' => now(),
                        'updated_at' => $updatedAtCliente ?? now(),
                    ];

                    // Actualizar el registro existente
                    $existente->update($datosActualizacion);

                    $resultados['sincronizados'][] = [
                        'local_id' => $localId,
                        'server_id' => $existente->id,
                        'message' => 'Registro actualizado exitosamente',
                    ];
                    continue;
                }

                // Crear nuevo registro
                $nuevoRegistro = Registro::create([
                    'local_id' => $localId,
                    'user_id' => $user->id,
                    'campania_id' => $registroData['campania_id'],
                    'material_id' => $registroData['material_id'],
                    'fundo_id' => $registroData['fundo_id'],
                    'lote_id' => $registroData['lote_id'],
                    'motivo_id' => $registroData['motivo_id'],
                    'cantidad' => $registroData['cantidad'],
                    'numero_tractor' => $registroData['numero_tractor'] ?? null,
                    'observaciones' => $registroData['observaciones'] ?? null,
                    'fecha_registro' => $registroData['fecha_registro'],
                    'synced' => true,
                    'synced_at' => now(),
                    'created_at' => $registroData['created_at'] ?? now(),
                    'updated_at' => $registroData['updated_at'] ?? now(),
                ]);

                $resultados['sincronizados'][] = [
                    'local_id' => $localId,
                    'server_id' => $nuevoRegistro->id,
                    'message' => 'Registro sincronizado exitosamente',
                ];
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Sincronización completada',
                'data' => $resultados,
                'summary' => [
                    'total_recibidos' => count($registrosRecibidos),
                    'sincronizados' => count($resultados['sincronizados']),
                    'duplicados' => count($resultados['duplicados']),
                    'errores' => count($resultados['errores']),
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error durante la sincronización',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener datos necesarios para trabajar offline
     * Descarga catálogos (campañas, materiales, fundos, lotes, motivos)
     */
    public function downloadCatalogos(Request $request)
    {
        try {
            $catalogos = [
                'campanias' => \App\Models\Campania::activo()->ordenadoPorReciente()->get(),
                'materiales' => \App\Models\Material::activo()->ordenadoPorNombre()->get(),
                'fundos' => \App\Models\Fundo::activo()->conLotes()->ordenadoPorNombre()->get(),
                'motivos' => \App\Models\Motivo::activo()->ordenadoPorNombre()->get(),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Catálogos descargados exitosamente',
                'data' => $catalogos,
                'timestamp' => now()->toIso8601String(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al descargar catálogos',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener registros del servidor que no están en el cliente
     * Para sincronización bidireccional (servidor -> cliente)
     */
    public function downloadRegistros(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'ultima_sincronizacion' => 'nullable|date',
            'limit' => 'nullable|integer|min:1|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $query = Registro::porUsuario($user->id)
                ->conRelaciones()
                ->ordenadoPorReciente();

            // Si se proporciona última sincronización, solo enviar los más recientes
            if ($request->filled('ultima_sincronizacion')) {
                $query->where('updated_at', '>', $request->ultima_sincronizacion);
            }

            // Limitar resultados
            $limit = $request->input('limit', 100);
            $registros = $query->limit($limit)->get();

            return response()->json([
                'success' => true,
                'message' => 'Registros descargados exitosamente',
                'data' => $registros,
                'total' => $registros->count(),
                'timestamp' => now()->toIso8601String(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al descargar registros',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verificar estado de sincronización del usuario
     */
    public function checkStatus(Request $request)
    {
        $user = $request->user();

        try {
            $totalRegistros = Registro::porUsuario($user->id)->count();
            $registrosSincronizados = Registro::porUsuario($user->id)->sincronizado()->count();
            $registrosPendientes = Registro::porUsuario($user->id)->pendienteSincronizacion()->count();

            $ultimoRegistro = Registro::porUsuario($user->id)
                ->ordenadoPorReciente()
                ->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_registros' => $totalRegistros,
                    'sincronizados' => $registrosSincronizados,
                    'pendientes' => $registrosPendientes,
                    'ultima_actualizacion' => $ultimoRegistro ? $ultimoRegistro->updated_at : null,
                    'timestamp_servidor' => now()->toIso8601String(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al verificar estado',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
