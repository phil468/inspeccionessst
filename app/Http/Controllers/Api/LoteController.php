<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LoteController extends Controller
{
    /**
     * Listar todos los lotes
     */
    public function index(Request $request)
    {
        $query = Lote::query();

        // Filtrar solo activos si se solicita
        if ($request->boolean('solo_activos', true)) {
            $query->activo();
        }

        // Filtrar por fundo
        if ($request->filled('fundo_id')) {
            $query->porFundo($request->fundo_id);
        }

        // Incluir fundo si se solicita
        if ($request->boolean('con_fundo', false)) {
            $query->conFundo();
        }

        // Ordenar
        $query->ordenadoPorCodigo();

        $lotes = $query->get();

        return response()->json([
            'success' => true,
            'data' => $lotes,
        ]);
    }

    /**
     * Crear nuevo lote
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fundo_id' => 'required|exists:fundos,id',
            'codigo' => 'required|string|max:255',
            'nombre' => 'required|string|max:255',
            'activo' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        // Validar que el código sea único para el fundo
        $existente = Lote::where('fundo_id', $request->fundo_id)
            ->where('codigo', $request->codigo)
            ->first();

        if ($existente) {
            return response()->json([
                'success' => false,
                'errors' => ['codigo' => ['Este código ya existe para el fundo seleccionado']],
            ], 422);
        }

        $lote = Lote::create($validator->validated());
        $lote->load('fundo');

        return response()->json([
            'success' => true,
            'message' => 'Lote creado exitosamente',
            'data' => $lote,
        ], 201);
    }

    /**
     * Mostrar un lote específico
     */
    public function show($id)
    {
        $lote = Lote::with('fundo')->find($id);

        if (!$lote) {
            return response()->json([
                'success' => false,
                'message' => 'Lote no encontrado',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $lote,
        ]);
    }

    /**
     * Actualizar un lote
     */
    public function update(Request $request, $id)
    {
        $lote = Lote::find($id);

        if (!$lote) {
            return response()->json([
                'success' => false,
                'message' => 'Lote no encontrado',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'fundo_id' => 'sometimes|required|exists:fundos,id',
            'codigo' => 'sometimes|required|string|max:255',
            'nombre' => 'sometimes|required|string|max:255',
            'activo' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        // Validar que el código sea único para el fundo (si se está actualizando)
        if ($request->filled('codigo') || $request->filled('fundo_id')) {
            $fundoId = $request->fundo_id ?? $lote->fundo_id;
            $codigo = $request->codigo ?? $lote->codigo;

            $existente = Lote::where('fundo_id', $fundoId)
                ->where('codigo', $codigo)
                ->where('id', '!=', $id)
                ->first();

            if ($existente) {
                return response()->json([
                    'success' => false,
                    'errors' => ['codigo' => ['Este código ya existe para el fundo seleccionado']],
                ], 422);
            }
        }

        $lote->update($validator->validated());
        $lote->load('fundo');

        return response()->json([
            'success' => true,
            'message' => 'Lote actualizado exitosamente',
            'data' => $lote,
        ]);
    }

    /**
     * Eliminar (soft delete) un lote
     */
    public function destroy($id)
    {
        $lote = Lote::find($id);

        if (!$lote) {
            return response()->json([
                'success' => false,
                'message' => 'Lote no encontrado',
            ], 404);
        }

        $lote->delete();

        return response()->json([
            'success' => true,
            'message' => 'Lote eliminado exitosamente',
        ]);
    }
}
