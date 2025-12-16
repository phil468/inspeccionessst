<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Fundo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FundoController extends Controller
{
    /**
     * Listar todos los fundos
     */
    public function index(Request $request)
    {
        $query = Fundo::query();

        // Filtrar solo activos si se solicita
        if ($request->boolean('solo_activos', true)) {
            $query->activo();
        }

        // Incluir lotes si se solicita
        if ($request->boolean('con_lotes', false)) {
            $query->conLotes();
        }

        // Ordenar
        $query->ordenadoPorNombre();

        $fundos = $query->get();

        return response()->json([
            'success' => true,
            'data' => $fundos,
        ]);
    }

    /**
     * Crear nuevo fundo
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'ubicacion' => 'nullable|string|max:255',
            'activo' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $fundo = Fundo::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Fundo creado exitosamente',
            'data' => $fundo,
        ], 201);
    }

    /**
     * Mostrar un fundo específico
     */
    public function show($id)
    {
        $fundo = Fundo::with('lotes')->find($id);

        if (!$fundo) {
            return response()->json([
                'success' => false,
                'message' => 'Fundo no encontrado',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $fundo,
        ]);
    }

    /**
     * Actualizar un fundo
     */
    public function update(Request $request, $id)
    {
        $fundo = Fundo::find($id);

        if (!$fundo) {
            return response()->json([
                'success' => false,
                'message' => 'Fundo no encontrado',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:255',
            'ubicacion' => 'nullable|string|max:255',
            'activo' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $fundo->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Fundo actualizado exitosamente',
            'data' => $fundo,
        ]);
    }

    /**
     * Eliminar (soft delete) un fundo
     */
    public function destroy($id)
    {
        $fundo = Fundo::find($id);

        if (!$fundo) {
            return response()->json([
                'success' => false,
                'message' => 'Fundo no encontrado',
            ], 404);
        }

        $fundo->delete();

        return response()->json([
            'success' => true,
            'message' => 'Fundo eliminado exitosamente',
        ]);
    }
}
