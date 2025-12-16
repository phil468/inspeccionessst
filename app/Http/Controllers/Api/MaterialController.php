<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Material;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MaterialController extends Controller
{
    /**
     * Listar todos los materiales
     */
    public function index(Request $request)
    {
        $query = Material::query();

        // Filtrar solo activos si se solicita
        if ($request->boolean('solo_activos', true)) {
            $query->activo();
        }

        // Buscar por término
        if ($request->filled('buscar')) {
            $query->buscar($request->buscar);
        }

        // Ordenar
        $query->ordenadoPorNombre();

        $materiales = $query->get();

        return response()->json([
            'success' => true,
            'data' => $materiales,
        ]);
    }

    /**
     * Crear nuevo material
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'codigo' => 'required|string|max:255|unique:materiales,codigo',
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

        $material = Material::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Material creado exitosamente',
            'data' => $material,
        ], 201);
    }

    /**
     * Mostrar un material específico
     */
    public function show($id)
    {
        $material = Material::find($id);

        if (!$material) {
            return response()->json([
                'success' => false,
                'message' => 'Material no encontrado',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $material,
        ]);
    }

    /**
     * Actualizar un material
     */
    public function update(Request $request, $id)
    {
        $material = Material::find($id);

        if (!$material) {
            return response()->json([
                'success' => false,
                'message' => 'Material no encontrado',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'codigo' => 'sometimes|required|string|max:255|unique:materiales,codigo,' . $id,
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

        $material->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Material actualizado exitosamente',
            'data' => $material,
        ]);
    }

    /**
     * Eliminar (soft delete) un material
     */
    public function destroy($id)
    {
        $material = Material::find($id);

        if (!$material) {
            return response()->json([
                'success' => false,
                'message' => 'Material no encontrado',
            ], 404);
        }

        $material->delete();

        return response()->json([
            'success' => true,
            'message' => 'Material eliminado exitosamente',
        ]);
    }
}
