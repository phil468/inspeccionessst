<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Area;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AreaController extends Controller
{
    /**
     * Listar todas las áreas activas
     */
    public function index(Request $request)
    {
        $query = Area::with('empresa:id,name');

        // Filtrar solo activas si se solicita
        if ($request->boolean('solo_activas', true)) {
            $query->activo();
        }

        // Filtrar por empresa si se especifica
        if ($request->filled('empresa_id')) {
            $query->porEmpresa($request->empresa_id);
        }

        // Ordenar por nombre
        $query->ordenadoPorNombre();

        $areas = $query->get();

        return response()->json([
            'success' => true,
            'data' => $areas,
        ]);
    }

    /**
     * Crear nueva área
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'empresa_id' => 'required|exists:empresas,id',
            'name' => 'required|string|max:250',
            'centro_costo' => 'nullable|string|max:250',
            'activo' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $area = Area::create($validator->validated());
        $area->load('empresa:id,name');

        return response()->json([
            'success' => true,
            'message' => 'Área creada exitosamente',
            'data' => $area,
        ], 201);
    }

    /**
     * Mostrar un área específica
     */
    public function show(string $id)
    {
        $area = Area::with('empresa')->find($id);

        if (!$area) {
            return response()->json([
                'success' => false,
                'message' => 'Área no encontrada',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $area,
        ]);
    }

    /**
     * Actualizar un área
     */
    public function update(Request $request, string $id)
    {
        $area = Area::find($id);

        if (!$area) {
            return response()->json([
                'success' => false,
                'message' => 'Área no encontrada',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'empresa_id' => 'sometimes|required|exists:empresas,id',
            'name' => 'sometimes|required|string|max:250',
            'centro_costo' => 'sometimes|nullable|string|max:250',
            'activo' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $area->update($validator->validated());
        $area->load('empresa:id,name');

        return response()->json([
            'success' => true,
            'message' => 'Área actualizada exitosamente',
            'data' => $area,
        ]);
    }

    /**
     * Eliminar (soft delete) un área
     */
    public function destroy(string $id)
    {
        $area = Area::find($id);

        if (!$area) {
            return response()->json([
                'success' => false,
                'message' => 'Área no encontrada',
            ], 404);
        }

        $area->delete();

        return response()->json([
            'success' => true,
            'message' => 'Área eliminada exitosamente',
        ]);
    }
}
