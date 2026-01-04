<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EmpresaController extends Controller
{
    /**
     * Listar todas las empresas activas
     */
    public function index(Request $request)
    {
        $query = Empresa::query();

        // Filtrar solo activas si se solicita
        if ($request->boolean('solo_activas', true)) {
            $query->activo();
        }

        // Ordenar por nombre
        $query->ordenadoPorNombre();

        $empresas = $query->get();

        return response()->json([
            'success' => true,
            'data' => $empresas,
        ]);
    }

    /**
     * Crear nueva empresa
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:250',
            'razon_social' => 'nullable|string|max:250',
            'ruc' => 'nullable|string|max:11',
            'domicilio' => 'nullable|string',
            'actividad_economica' => 'nullable|string|max:250',
            'activo' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $empresa = Empresa::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Empresa creada exitosamente',
            'data' => $empresa,
        ], 201);
    }

    /**
     * Mostrar una empresa específica
     */
    public function show(string $id)
    {
        $empresa = Empresa::with('areas')->find($id);

        if (!$empresa) {
            return response()->json([
                'success' => false,
                'message' => 'Empresa no encontrada',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $empresa,
        ]);
    }

    /**
     * Actualizar una empresa
     */
    public function update(Request $request, string $id)
    {
        $empresa = Empresa::find($id);

        if (!$empresa) {
            return response()->json([
                'success' => false,
                'message' => 'Empresa no encontrada',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:250',
            'razon_social' => 'sometimes|nullable|string|max:250',
            'ruc' => 'sometimes|nullable|string|max:11',
            'domicilio' => 'sometimes|nullable|string',
            'actividad_economica' => 'sometimes|nullable|string|max:250',
            'activo' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $empresa->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Empresa actualizada exitosamente',
            'data' => $empresa,
        ]);
    }

    /**
     * Eliminar (soft delete) una empresa
     */
    public function destroy(string $id)
    {
        $empresa = Empresa::find($id);

        if (!$empresa) {
            return response()->json([
                'success' => false,
                'message' => 'Empresa no encontrada',
            ], 404);
        }

        $empresa->delete();

        return response()->json([
            'success' => true,
            'message' => 'Empresa eliminada exitosamente',
        ]);
    }
}
