<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Personal;
use App\Services\PersonalSyncService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PersonalController extends Controller
{
    protected $syncService;

    public function __construct(PersonalSyncService $syncService)
    {
        $this->syncService = $syncService;
    }

    /**
     * Lista de personal
     */
    public function index(Request $request)
    {
        $query = Personal::conRelaciones();

        // Filtros
        if ($request->has('empresa_id')) {
            $query->where('empresa_id', $request->empresa_id);
        }

        if ($request->has('area_id')) {
            $query->where('area_id', $request->area_id);
        }

        if ($request->has('cargo_id')) {
            $query->where('cargo_id', $request->cargo_id);
        }

        if ($request->has('activo')) {
            if ($request->activo == '1') {
                $query->activo();
            }
        }

        if ($request->has('cesado')) {
            if ($request->cesado == '1') {
                $query->cesado();
            }
        }

        if ($request->has('inspector')) {
            if ($request->inspector == '1') {
                $query->where('inspector', true);
            }
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('dni', 'like', "%{$search}%")
                    ->orWhere('correo_empresa', 'like', "%{$search}%");
            });
        }

        // Ordenamiento
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginación o todos los registros
        $perPage = $request->get('per_page', -1);
        
        if ($perPage == -1) {
            // Devolver todos los registros sin paginar
            $personal = $query->get();
            
            return response()->json([
                'success' => true,
                'data' => $personal,
            ]);
        } else {
            // Paginar
            $personal = $query->paginate($perPage);
            
            return response()->json([
                'success' => true,
                'data' => $personal->items(),
                'pagination' => [
                    'total' => $personal->total(),
                    'current_page' => $personal->currentPage(),
                    'last_page' => $personal->lastPage(),
                    'per_page' => $personal->perPage(),
                ],
            ]);
        }
    }

    /**
     * Detalle de un personal
     */
    public function show($id)
    {
        $personal = Personal::conRelaciones()->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $personal,
        ]);
    }

    /**
     * Crear nuevo personal
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'dni' => 'required|unique:personal,dni|max:100',
            'nombres' => 'required|max:250',
            'apellido_paterno' => 'required|max:250',
            'apellido_materno' => 'nullable|max:250',
            'empresa_id' => 'nullable|exists:empresas,id',
            'area_id' => 'nullable|exists:areas,id',
            'cargo_id' => 'nullable|exists:cargos,id',
            'correo_empresa' => 'nullable|email|max:250',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $request->all();
        
        // Generar nombre completo
        $data['name'] = trim(
            ($data['nombres'] ?? '') . ' ' .
            ($data['apellido_paterno'] ?? '') . ' ' .
            ($data['apellido_materno'] ?? '')
        );

        $personal = Personal::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Personal creado exitosamente',
            'data' => $personal->load([
                'empresa',
                'area',
                'cargo',
                'tipoDeTrabajador',
                'tipoDePersonal',
                'planilla',
            ]),
        ], 201);
    }

    /**
     * Actualizar personal
     */
    public function update(Request $request, $id)
    {
        $personal = Personal::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'dni' => 'required|max:100|unique:personal,dni,' . $id,
            'nombres' => 'required|max:250',
            'apellido_paterno' => 'required|max:250',
            'apellido_materno' => 'nullable|max:250',
            'empresa_id' => 'nullable|exists:empresas,id',
            'area_id' => 'nullable|exists:areas,id',
            'cargo_id' => 'nullable|exists:cargos,id',
            'correo_empresa' => 'nullable|email|max:250',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Errores de validación',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $request->all();
        
        // Actualizar nombre completo
        $data['name'] = trim(
            ($data['nombres'] ?? '') . ' ' .
            ($data['apellido_paterno'] ?? '') . ' ' .
            ($data['apellido_materno'] ?? '')
        );

        $personal->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Personal actualizado exitosamente',
            'data' => $personal->load([
                'empresa',
                'area',
                'cargo',
                'tipoDeTrabajador',
                'tipoDePersonal',
                'planilla',
            ]),
        ]);
    }

    /**
     * Eliminar personal (soft delete)
     */
    public function destroy($id)
    {
        $personal = Personal::findOrFail($id);
        $personal->delete();

        return response()->json([
            'success' => true,
            'message' => 'Personal eliminado exitosamente',
        ]);
    }

    /**
     * Sincronización manual desde API externo
     */
    public function syncFromExternalApi()
    {
        try {
            // Aumentar el tiempo límite para la sincronización (5 minutos)
            set_time_limit(300);
            
            $result = $this->syncService->syncFromExternalApi();

            return response()->json($result);
        } catch (\Exception $e) {
            \Log::error('Error en sincronización de personal: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Error al sincronizar personal: ' . $e->getMessage(),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Marcar personal como cesado
     */
    public function marcarCesado(Request $request, $id)
    {
        $personal = Personal::findOrFail($id);
        
        $personal->update([
            'cesado' => 1,
            'fecha_cese' => $request->get('fecha_cese', now()),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Personal marcado como cesado',
            'data' => $personal,
        ]);
    }

    /**
     * Reactivar personal cesado
     */
    public function reactivar($id)
    {
        $personal = Personal::findOrFail($id);
        
        $personal->update([
            'cesado' => 0,
            'fecha_cese' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Personal reactivado exitosamente',
            'data' => $personal,
        ]);
    }
}
