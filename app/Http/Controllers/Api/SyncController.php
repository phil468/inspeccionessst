<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Registro;
use App\Models\Inspeccion;
use App\Models\InspeccionArea;
use App\Models\InspeccionInspector;
use App\Models\ResultadoInspeccion;
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
            'registros.*.fundo_id' => 'required|exists:fundos,id',
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
                        'fundo_id' => $registroData['fundo_id'],
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
                    'fundo_id' => $registroData['fundo_id'],
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
     * Descarga catálogos (campañas, fundos, empresas, áreas)
     */
    public function downloadCatalogos(Request $request)
    {
        try {
            $catalogos = [
                'campanias' => \App\Models\Campania::where('activo', true)->orderBy('anio_inicio', 'desc')->get(),
                'fundos' => \App\Models\Fundo::where('activo', true)->orderBy('nombre')->get(),
                'empresas' => \App\Models\Empresa::where('activo', true)->orderBy('name')->get(),
                'areas' => \App\Models\Area::with('empresa:id,name')->where('activo', true)->orderBy('name')->get(),
                'cargos' => \App\Models\Cargo::with('empresa:id,name')->where('estado', true)->orderBy('name')->get(),
                'tipos_trabajador' => \App\Models\TipoDeTrabajador::with('empresa:id,name')
                    ->where('estado', 1)
                    ->orderBy('name')
                    ->get(),
                'tipos_personal' => \App\Models\TipoDePersonal::with('empresa:id,name')
                    ->where('estado', 1)
                    ->orderBy('name')
                    ->get(),
                'planillas' => \App\Models\Planilla::with('empresa:id,name')
                    ->where('estado', 1)
                    ->orderBy('name')
                    ->get(),
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

    /**
     * Sincronizar inspecciones pendientes desde el cliente
     * Recibe un array de inspecciones creadas offline y las almacena en el servidor
     */
    public function syncInspecciones(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'inspecciones' => 'required|array',
            'inspecciones.*.local_id' => 'required|string|uuid',
            'inspecciones.*.empresa_id' => 'nullable|exists:empresas,id',
            'inspecciones.*.area_id' => 'nullable|exists:areas,id',
            'inspecciones.*.tipo_inspeccion' => 'required|string',
            'inspecciones.*.tipo_inspeccion_otro' => 'nullable|string',
            'inspecciones.*.vigencia_desde' => 'nullable|date',
            'inspecciones.*.vigencia_hasta' => 'nullable|date',
            'inspecciones.*.razon_social' => 'nullable|string',
            'inspecciones.*.ruc' => 'nullable|string',
            'inspecciones.*.domicilio' => 'nullable|string',
            'inspecciones.*.actividad_economica' => 'nullable|string',
            'inspecciones.*.zona_inspeccionada' => 'nullable|string',
            'inspecciones.*.numero_registro' => 'required|string',
            'inspecciones.*.fecha_hora_inspeccion' => 'required|date',
            'inspecciones.*.comentario' => 'nullable|string',
            'inspecciones.*.objetivo' => 'nullable|string',
            'inspecciones.*.descripcion_causa' => 'nullable|string',
            'inspecciones.*.conclusiones_recomendaciones' => 'nullable|string',
            'inspecciones.*.created_at' => 'nullable|date',
            'inspecciones.*.updated_at' => 'nullable|date',
            // Relaciones
            'inspecciones.*.areas' => 'nullable|array',
            'inspecciones.*.areas.*.area_id' => 'required|exists:areas,id',
            'inspecciones.*.inspectores' => 'nullable|array',
            'inspecciones.*.inspectores.*.personal_id' => 'required|exists:personal,id',
            'inspecciones.*.resultados' => 'nullable|array',
            'inspecciones.*.resultados.*.local_id' => 'required|string|uuid',
            'inspecciones.*.resultados.*.descripcion' => 'required|string',
            'inspecciones.*.resultados.*.nivel_riesgo' => 'required|in:Alto,Medio,Bajo',
            'inspecciones.*.resultados.*.estado' => 'nullable|in:Pendiente,En Proceso,Ejecutado,Cerrado',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $inspeccionesRecibidas = $request->inspecciones;
        $resultados = [
            'sincronizados' => [],
            'duplicados' => [],
            'errores' => [],
        ];

        DB::beginTransaction();

        try {
            foreach ($inspeccionesRecibidas as $inspeccionData) {
                $localId = $inspeccionData['local_id'];

                // Verificar si ya existe por local_id o por id del servidor
                $existente = Inspeccion::where('local_id', $localId)
                    ->orWhere(function($query) use ($inspeccionData) {
                        if (isset($inspeccionData['id'])) {
                            $query->where('id', $inspeccionData['id']);
                        }
                    })
                    ->first();

                if ($existente) {
                    // Ya existe, verificar timestamps para evitar sobrescribir datos más recientes
                    $updatedAtServidor = $existente->updated_at; // Carbon instance en UTC
                    $updatedAtCliente = isset($inspeccionData['updated_at']) 
                        ? \Carbon\Carbon::parse($inspeccionData['updated_at'])->setTimezone('UTC')
                        : null;

                    // Si el cliente tiene un timestamp más antiguo que el servidor, hay conflicto
                    if ($updatedAtCliente && $updatedAtCliente->lt($updatedAtServidor)) {
                        $resultados['errores'][] = [
                            'local_id' => $localId,
                            'server_id' => $existente->id,
                            'message' => 'Conflicto: la inspección'. $existente->numero_registro. 'en el servidor es más reciente',
                            'conflict' => true,
                            'server_updated_at' => $updatedAtServidor->toISOString(),
                            'client_updated_at' => $updatedAtCliente->format('c'),
                        ];
                        continue;
                    }

                    // Si llegamos aquí, el cliente es más reciente o igual, procedemos a actualizar
                    $datosActualizacion = [
                        'empresa_id' => $inspeccionData['empresa_id'] ?? null,
                        'area_id' => $inspeccionData['area_id'] ?? null,
                        'tipo_inspeccion' => $inspeccionData['tipo_inspeccion'],
                        'tipo_inspeccion_otro' => $inspeccionData['tipo_inspeccion_otro'] ?? null,
                        'vigencia_desde' => $inspeccionData['vigencia_desde'] ?? null,
                        'vigencia_hasta' => $inspeccionData['vigencia_hasta'] ?? null,
                        'razon_social' => $inspeccionData['razon_social'] ?? null,
                        'ruc' => $inspeccionData['ruc'] ?? null,
                        'domicilio' => $inspeccionData['domicilio'] ?? null,
                        'actividad_economica' => $inspeccionData['actividad_economica'] ?? null,
                        'zona_inspeccionada' => $inspeccionData['zona_inspeccionada'] ?? null,
                        'numero_registro' => $inspeccionData['numero_registro'] ?? null,
                        'fecha_hora_inspeccion' => $inspeccionData['fecha_hora_inspeccion'],
                        'comentario' => $inspeccionData['comentario'] ?? null,
                        'objetivo' => $inspeccionData['objetivo'] ?? null,
                        'descripcion_causa' => $inspeccionData['descripcion_causa'] ?? null,
                        'conclusiones_recomendaciones' => $inspeccionData['conclusiones_recomendaciones'] ?? null,
                        'synced' => true,
                        'synced_at' => now(),
                        'updated_at' => $updatedAtCliente ?? now(),
                    ];

                    // Actualizar la inspección existente
                    $existente->update($datosActualizacion);

                    // Sincronizar relaciones (áreas, inspectores, resultados)
                    $this->sincronizarRelaciones($existente, $inspeccionData);

                    $resultados['sincronizados'][] = [
                        'local_id' => $localId,
                        'server_id' => $existente->id,
                        'message' => 'Inspección actualizada exitosamente',
                    ];
                    continue;
                }

                // Crear nueva inspección
                $nuevaInspeccion = Inspeccion::create([
                    'local_id' => $localId,
                    'user_id' => $user->id,
                    'empresa_id' => $inspeccionData['empresa_id'] ?? null,
                    'area_id' => $inspeccionData['area_id'] ?? null,
                    'tipo_inspeccion' => $inspeccionData['tipo_inspeccion'],
                    'tipo_inspeccion_otro' => $inspeccionData['tipo_inspeccion_otro'] ?? null,
                    'vigencia_desde' => $inspeccionData['vigencia_desde'] ?? null,
                    'vigencia_hasta' => $inspeccionData['vigencia_hasta'] ?? null,
                    'razon_social' => $inspeccionData['razon_social'] ?? null,
                    'ruc' => $inspeccionData['ruc'] ?? null,
                    'domicilio' => $inspeccionData['domicilio'] ?? null,
                    'actividad_economica' => $inspeccionData['actividad_economica'] ?? null,
                    'zona_inspeccionada' => $inspeccionData['zona_inspeccionada'] ?? null,
                    'numero_registro' => $inspeccionData['numero_registro'] ?? null,
                    'fecha_hora_inspeccion' => $inspeccionData['fecha_hora_inspeccion'],
                    'comentario' => $inspeccionData['comentario'] ?? null,
                    'objetivo' => $inspeccionData['objetivo'] ?? null,
                    'descripcion_causa' => $inspeccionData['descripcion_causa'] ?? null,
                    'conclusiones_recomendaciones' => $inspeccionData['conclusiones_recomendaciones'] ?? null,
                    'synced' => true,
                    'synced_at' => now(),
                    'created_at' => $inspeccionData['created_at'] ?? now(),
                    'updated_at' => $inspeccionData['updated_at'] ?? now(),
                ]);

                // Sincronizar relaciones (áreas, inspectores, resultados)
                $this->sincronizarRelaciones($nuevaInspeccion, $inspeccionData);

                $resultados['sincronizados'][] = [
                    'local_id' => $localId,
                    'server_id' => $nuevaInspeccion->id,
                    'message' => 'Inspección sincronizada exitosamente',
                ];
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Sincronización de inspecciones completada',
                'data' => $resultados,
                'summary' => [
                    'total_recibidos' => count($inspeccionesRecibidas),
                    'sincronizados' => count($resultados['sincronizados']),
                    'duplicados' => count($resultados['duplicados']),
                    'errores' => count($resultados['errores']),
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error durante la sincronización de inspecciones',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener inspecciones del servidor
     * Para sincronización bidireccional (servidor -> cliente)
     */
    public function downloadInspecciones(Request $request)
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
            $query = Inspeccion::porUsuario($user->id)
                ->with([
                    'user:id,name,email',
                    'empresa:id,name,razon_social,ruc',
                    'area:id,name,empresa_id',
                    'areas:id,name',
                    'inspectores:id,nombres,apellido_paterno,apellido_materno,dni',
                    'resultados' => function($q) {
                        $q->orderBy('nivel_riesgo', 'asc'); // Alto primero
                    },
                    'responsableRegistro.personal:id,nombres,apellido_paterno,apellido_materno',
                ])
                ->orderBy('fecha_hora_inspeccion', 'desc');

            // Si se proporciona última sincronización, solo enviar las más recientes
            if ($request->filled('ultima_sincronizacion')) {
                $query->where('updated_at', '>', $request->ultima_sincronizacion);
            }

            // Limitar resultados
            $limit = $request->input('limit', 100);
            $inspecciones = $query->limit($limit)->get();

            return response()->json([
                'success' => true,
                'message' => 'Inspecciones descargadas exitosamente',
                'data' => $inspecciones,
                'total' => $inspecciones->count(),
                'timestamp' => now()->toIso8601String(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al descargar inspecciones',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Sincronizar relaciones de una inspección (áreas, inspectores, resultados)
     */
    private function sincronizarRelaciones(Inspeccion $inspeccion, array $data)
    {
        // 1. Sincronizar áreas
        if (isset($data['areas']) && is_array($data['areas'])) {
            // Limpiar áreas existentes
            InspeccionArea::where('inspeccion_id', $inspeccion->id)->delete();
            
            // Agregar nuevas áreas con local_id
            foreach ($data['areas'] as $areaData) {
                InspeccionArea::create([
                    'local_id' => \Illuminate\Support\Str::uuid(),
                    'inspeccion_id' => $inspeccion->id,
                    'area_id' => $areaData['area_id'],
                ]);
            }
        }

        // 2. Sincronizar inspectores
        if (isset($data['inspectores']) && is_array($data['inspectores'])) {
            // Limpiar inspectores existentes
            InspeccionInspector::where('inspeccion_id', $inspeccion->id)->delete();
            
            // Agregar nuevos inspectores con local_id
            foreach ($data['inspectores'] as $inspectorData) {
                InspeccionInspector::create([
                    'local_id' => \Illuminate\Support\Str::uuid(),
                    'inspeccion_id' => $inspeccion->id,
                    'personal_id' => $inspectorData['personal_id'],
                ]);
            }
        }

        // 3. Sincronizar resultados/hallazgos
        if (isset($data['resultados']) && is_array($data['resultados'])) {
            foreach ($data['resultados'] as $resultadoData) {
                // Buscar por local_id para evitar duplicados
                $resultado = ResultadoInspeccion::where('local_id', $resultadoData['local_id'])->first();

                $datosResultado = [
                    'inspeccion_id' => $inspeccion->id,
                    'descripcion' => $resultadoData['descripcion'],
                    'nivel_riesgo' => $resultadoData['nivel_riesgo'],
                    'estado' => $resultadoData['estado'] ?? 'Pendiente',
                    'accion_tomar' => $resultadoData['accion_tomar'] ?? null,
                    'fecha_cierre' => $resultadoData['fecha_cierre'] ?? null,
                    'registro_fotografico_inicial' => $resultadoData['registro_fotografico_inicial'] ?? null,
                    'registro_fotografico_final' => $resultadoData['registro_fotografico_final'] ?? null,
                    'responsable_id' => $resultadoData['responsable_id'] ?? null,
                    'synced' => true,
                    'synced_at' => now(),
                ];

                if ($resultado) {
                    // Actualizar existente
                    $resultado->update($datosResultado);
                } else {
                    // Crear nuevo
                    $resultado = ResultadoInspeccion::create([
                        'local_id' => $resultadoData['local_id'],
                        ...$datosResultado,
                    ]);
                }

                // 3.1 Sincronizar visores del resultado
                if (isset($resultadoData['visores']) && is_array($resultadoData['visores'])) {
                    // Limpiar visores existentes (forceDelete para eliminar físicamente, no soft delete)
                    \App\Models\ResultadoVisor::where('resultado_id', $resultado->id)->forceDelete();
                    
                    foreach ($resultadoData['visores'] as $visorData) {
                        $personalId = is_array($visorData) ? ($visorData['personal_id'] ?? $visorData['id'] ?? null) : $visorData;
                        if ($personalId) {
                            \App\Models\ResultadoVisor::create([
                                'local_id' => \Illuminate\Support\Str::uuid(),
                                'resultado_id' => $resultado->id,
                                'personal_id' => $personalId,
                            ]);
                        }
                    }
                }

                // 3.2 Sincronizar responsables de levantamiento del resultado
                if (isset($resultadoData['responsablesLevantamiento']) && is_array($resultadoData['responsablesLevantamiento'])) {
                    // Limpiar responsables existentes (forceDelete para eliminar físicamente, no soft delete)
                    \App\Models\ResultadoResponsableLevantamiento::where('resultado_id', $resultado->id)->forceDelete();
                    
                    foreach ($resultadoData['responsablesLevantamiento'] as $respData) {
                        $personalId = is_array($respData) ? ($respData['personal_id'] ?? $respData['id'] ?? null) : $respData;
                        if ($personalId) {
                            \App\Models\ResultadoResponsableLevantamiento::create([
                                'local_id' => \Illuminate\Support\Str::uuid(),
                                'resultado_id' => $resultado->id,
                                'personal_id' => $personalId,
                            ]);
                        }
                    }
                }
            }
        }
    }
}
