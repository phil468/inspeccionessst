<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Registro;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RegistroController extends Controller
{
    /**
     * Listar registros del usuario autenticado
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Registro::query();

        // Filtrar por usuario autenticado
        $query->porUsuario($user->id);

        // Filtrar por estado de sincronización
        if ($request->has('synced')) {
            if ($request->boolean('synced')) {
                $query->sincronizado();
            } else {
                $query->pendienteSincronizacion();
            }
        }

        // Filtrar por rango de fechas
        if ($request->filled('fecha_inicio')) {
            $fechaFin = $request->fecha_fin ?? $request->fecha_inicio;
            $query->porFecha($request->fecha_inicio, $fechaFin);
        }

        // Incluir relaciones
        $query->conRelaciones();

        // Ordenar por más reciente
        $query->ordenadoPorReciente();

        // Paginación
        $perPage = $request->input('per_page', 50);
        $registros = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $registros->items(),
            'pagination' => [
                'total' => $registros->total(),
                'per_page' => $registros->perPage(),
                'current_page' => $registros->currentPage(),
                'last_page' => $registros->lastPage(),
            ],
        ]);
    }

    /**
     * Crear nuevo registro (online u offline)
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'local_id' => 'nullable|string|uuid',
            'campania_id' => 'required|exists:campanias,id',
            'fundo_id' => 'required|exists:fundos,id',
            'cantidad' => 'required|numeric|min:0',
            'numero_tractor' => 'nullable|string|max:255',
            'observaciones' => 'nullable|string',
            'fecha_registro' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        $data['user_id'] = $user->id;

        // Si viene de sincronización offline, verificar que no exista ya por local_id
        if (isset($data['local_id'])) {
            $existente = Registro::where('local_id', $data['local_id'])->first();
            if ($existente) {
                return response()->json([
                    'success' => true,
                    'message' => 'Registro ya existe (sincronizado previamente)',
                    'data' => $existente->load([
                        'campania', 'fundo'
                    ]),
                ], 200);
            }
        }

        // Si es creación desde el servidor, marcar como sincronizado
        if (!$request->has('local_id')) {
            $data['synced'] = true;
            $data['synced_at'] = now();
        }

        $registro = Registro::create($data);
        $registro->load(['campania', 'fundo']);

        return response()->json([
            'success' => true,
            'message' => 'Registro creado exitosamente',
            'data' => $registro,
        ], 201);
    }

    /**
     * Mostrar un registro específico
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        
        $registro = Registro::conRelaciones()
            ->where('id', $id)
            ->first();

        if (!$registro) {
            return response()->json([
                'success' => false,
                'message' => 'Registro no encontrado',
            ], 404);
        }

        // Verificar que el registro pertenezca al usuario
        if ($registro->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para ver este registro',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $registro,
        ]);
    }

    /**
     * Actualizar un registro
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        
        $registro = Registro::find($id);

        if (!$registro) {
            return response()->json([
                'success' => false,
                'message' => 'Registro no encontrado',
            ], 404);
        }

        // Verificar que el registro pertenezca al usuario
        if ($registro->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para editar este registro',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'campania_id' => 'sometimes|required|exists:campanias,id',
            'fundo_id' => 'sometimes|required|exists:fundos,id',
            'cantidad' => 'sometimes|required|numeric|min:0',
            'numero_tractor' => 'nullable|string|max:255',
            'observaciones' => 'nullable|string',
            'fecha_registro' => 'sometimes|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $registro->update($validator->validated());
        $registro->load(['campania', 'fundo']);

        return response()->json([
            'success' => true,
            'message' => 'Registro actualizado exitosamente',
            'data' => $registro,
        ]);
    }

    /**
     * Eliminar (soft delete) un registro
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        
        $registro = Registro::find($id);

        if (!$registro) {
            return response()->json([
                'success' => false,
                'message' => 'Registro no encontrado',
            ], 404);
        }

        // Verificar que el registro pertenezca al usuario
        if ($registro->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para eliminar este registro',
            ], 403);
        }

        $registro->delete();

        return response()->json([
            'success' => true,
            'message' => 'Registro eliminado exitosamente',
        ]);
    }

    /**
     * Obtener estadísticas de registros del usuario
     */
    public function estadisticas(Request $request)
    {
        $user = $request->user();

        $total = Registro::porUsuario($user->id)->count();
        $sincronizados = Registro::porUsuario($user->id)->sincronizado()->count();
        $pendientes = Registro::porUsuario($user->id)->pendienteSincronizacion()->count();

        // Últimos registros
        $ultimosRegistros = Registro::porUsuario($user->id)
            ->conRelaciones()
            ->ordenadoPorReciente()
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'sincronizados' => $sincronizados,
                'pendientes' => $pendientes,
                'ultimos_registros' => $ultimosRegistros,
            ],
        ]);
    }
}
