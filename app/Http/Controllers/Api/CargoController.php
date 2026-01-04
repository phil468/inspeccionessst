<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cargo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class CargoController extends Controller
{
    /**
     * Listar todos los cargos
     */
    public function index(Request $request)
    {
        try {
            $query = Cargo::query();

            // Filtrar por estado si se especifica
            if ($request->has('estado')) {
                $query->where('estado', $request->estado);
            }

            // Filtrar por empresa si se especifica
            if ($request->has('empresa_id')) {
                $query->where('empresa_id', $request->empresa_id);
            }

            $cargos = $query->orderBy('name')->get();

            return response()->json($cargos);
        } catch (\Exception $e) {
            Log::error('Error al listar cargos: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al obtener los cargos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener un cargo específico
     */
    public function show($id)
    {
        try {
            $cargo = Cargo::findOrFail($id);
            return response()->json($cargo);
        } catch (\Exception $e) {
            Log::error('Error al obtener cargo: ' . $e->getMessage());
            return response()->json([
                'message' => 'Cargo no encontrado',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Crear un nuevo cargo
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:100',
                'empresa_id' => 'nullable|exists:empresas,id',
                'tipo_de_puesto_id' => 'nullable|exists:tipo_de_puestos,id',
                'reporta_a' => 'nullable|exists:cargos,id',
                'estado' => 'boolean',
            ]);

            // Asegurar que estado tenga un valor
            if (!isset($validated['estado'])) {
                $validated['estado'] = 1;
            }

            $cargo = Cargo::create($validated);

            return response()->json([
                'message' => 'Cargo creado exitosamente',
                'data' => $cargo
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error al crear cargo: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al crear el cargo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar un cargo existente
     */
    public function update(Request $request, $id)
    {
        try {
            $cargo = Cargo::findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:100',
                'empresa_id' => 'nullable|exists:empresas,id',
                'tipo_de_puesto_id' => 'nullable|exists:tipo_de_puestos,id',
                'reporta_a' => 'nullable|exists:cargos,id',
                'estado' => 'boolean',
            ]);

            $cargo->update($validated);

            return response()->json([
                'message' => 'Cargo actualizado exitosamente',
                'data' => $cargo
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Error de validación',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error al actualizar cargo: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al actualizar el cargo',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar un cargo (soft delete)
     */
    public function destroy($id)
    {
        try {
            $cargo = Cargo::findOrFail($id);
            
            // Verificar si tiene personal asignado
            if ($cargo->personal()->count() > 0) {
                return response()->json([
                    'message' => 'No se puede eliminar el cargo porque tiene personal asignado'
                ], 400);
            }

            $cargo->delete();

            return response()->json([
                'message' => 'Cargo eliminado exitosamente'
            ]);
        } catch (\Exception $e) {
            Log::error('Error al eliminar cargo: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error al eliminar el cargo',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
