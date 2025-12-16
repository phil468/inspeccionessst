<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Motivo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MotivoController extends Controller
{
    /**
     * Listar todos los motivos
     */
    public function index(Request $request)
    {
        $query = Motivo::query();

        // Filtrar solo activos si se solicita
        if ($request->boolean('solo_activos', true)) {
            $query->activo();
        }

        // Ordenar
        $query->ordenadoPorNombre();

        $motivos = $query->get();

        return response()->json([
            'success' => true,
            'data' => $motivos,
        ]);
    }

    /**
     * Crear nuevo motivo
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'activo' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $motivo = Motivo::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Motivo creado exitosamente',
            'data' => $motivo,
        ], 201);
    }

    /**
     * Mostrar un motivo específico
     */
    public function show($id)
    {
        $motivo = Motivo::find($id);

        if (!$motivo) {
            return response()->json([
                'success' => false,
                'message' => 'Motivo no encontrado',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $motivo,
        ]);
    }

    /**
     * Actualizar un motivo
     */
    public function update(Request $request, $id)
    {
        $motivo = Motivo::find($id);

        if (!$motivo) {
            return response()->json([
                'success' => false,
                'message' => 'Motivo no encontrado',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string',
            'activo' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $motivo->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Motivo actualizado exitosamente',
            'data' => $motivo,
        ]);
    }

    /**
     * Eliminar (soft delete) un motivo
     */
    public function destroy($id)
    {
        $motivo = Motivo::find($id);

        if (!$motivo) {
            return response()->json([
                'success' => false,
                'message' => 'Motivo no encontrado',
            ], 404);
        }

        $motivo->delete();

        return response()->json([
            'success' => true,
            'message' => 'Motivo eliminado exitosamente',
        ]);
    }
}
