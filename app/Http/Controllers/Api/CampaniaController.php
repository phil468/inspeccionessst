<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campania;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CampaniaController extends Controller
{
    /**
     * Listar todas las campañas activas
     */
    public function index(Request $request)
    {
        $query = Campania::query();

        // Filtrar solo activas si se solicita
        if ($request->boolean('solo_activas', true)) {
            $query->activo();
        }

        // Ordenar por más reciente
        $query->ordenadoPorReciente();

        $campanias = $query->get();

        return response()->json([
            'success' => true,
            'data' => $campanias,
        ]);
    }

    /**
     * Crear nueva campaña
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'anio_inicio' => 'required|integer|min:2000|max:2100',
            'anio_fin' => 'required|integer|min:2000|max:2100|gte:anio_inicio',
            'activo' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $campania = Campania::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Campaña creada exitosamente',
            'data' => $campania,
        ], 201);
    }

    /**
     * Mostrar una campaña específica
     */
    public function show($id)
    {
        $campania = Campania::find($id);

        if (!$campania) {
            return response()->json([
                'success' => false,
                'message' => 'Campaña no encontrada',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $campania,
        ]);
    }

    /**
     * Actualizar una campaña
     */
    public function update(Request $request, $id)
    {
        $campania = Campania::find($id);

        if (!$campania) {
            return response()->json([
                'success' => false,
                'message' => 'Campaña no encontrada',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:255',
            'anio_inicio' => 'sometimes|required|integer|min:2000|max:2100',
            'anio_fin' => 'sometimes|required|integer|min:2000|max:2100',
            'activo' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $campania->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Campaña actualizada exitosamente',
            'data' => $campania,
        ]);
    }

    /**
     * Eliminar (soft delete) una campaña
     */
    public function destroy($id)
    {
        $campania = Campania::find($id);

        if (!$campania) {
            return response()->json([
                'success' => false,
                'message' => 'Campaña no encontrada',
            ], 404);
        }

        $campania->delete();

        return response()->json([
            'success' => true,
            'message' => 'Campaña eliminada exitosamente',
        ]);
    }
}
