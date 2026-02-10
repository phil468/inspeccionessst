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
            'correo_empresa' => 'required_if:inspector,true|nullable|email|max:250',
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

        // Si es inspector, asegurar que tenga usuario y rol adecuado
        $usuarioAccion = null;
        try {
            if (!empty($personal->inspector)) {
                $correo = $personal->correo_empresa;
                if ($correo) {
                    $userModel = \App\Models\User::where('email', $correo)->first();

                    if (!$userModel) {
                        // Crear usuario con rol Operador
                        $password = \Illuminate\Support\Str::random(12);
                        $userModel = \App\Models\User::create([
                            'name' => $personal->name,
                            'email' => $correo,
                            'password' => bcrypt($password),
                            'activo' => true,
                            'personal_id' => $personal->id,
                        ]);
                        $userModel->assignRole('Operador');
                        $usuarioAccion = 'usuario_creado';
                    } else {
                        // Si tiene rol Administrador o Supervisor no hacemos cambios
                        if ($userModel->hasRole('Administrador') || $userModel->hasRole('Supervisor')) {
                            $usuarioAccion = 'sin_cambios_por_rol_superior';
                        } else {
                            // Si tiene rol Personal, cambiar a Operador
                            if ($userModel->hasRole('Personal')) {
                                $userModel->syncRoles(['Operador']);
                                $usuarioAccion = 'rol_actualizado_a_operador';
                            } else {
                                // Si no tiene roles, asignar Operador
                                if (!$userModel->roles()->exists()) {
                                    $userModel->assignRole('Operador');
                                    $usuarioAccion = 'rol_asignado_operador';
                                } else {
                                    $usuarioAccion = 'sin_cambios';
                                }
                            }
                        }

                        // Vincular user.personal_id si está vacío
                        if (empty($userModel->personal_id)) {
                            $userModel->personal_id = $personal->id;
                            $userModel->save();
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            // No bloquear la creación si falla la lógica de usuario
            \Log::warning('Error al crear/actualizar usuario para personal: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Personal creado exitosamente',
            'usuario_accion' => $usuarioAccion,
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
            'correo_empresa' => 'required_if:inspector,true|nullable|email|max:250',
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

        $usuarioAccion = null;
        try {
            if (!empty($personal->inspector)) {
                $correo = $personal->correo_empresa;
                if ($correo) {
                    $userModel = \App\Models\User::where('email', $correo)->first();

                    if (!$userModel) {
                        // Crear usuario con rol Operador
                        $password = \Illuminate\Support\Str::random(12);
                        $userModel = \App\Models\User::create([
                            'name' => $personal->name,
                            'email' => $correo,
                            'password' => bcrypt($password),
                            'activo' => true,
                            'personal_id' => $personal->id,
                        ]);
                        $userModel->assignRole('Operador');
                        $usuarioAccion = 'usuario_creado';
                    } else {
                        if ($userModel->hasRole('Administrador') || $userModel->hasRole('Supervisor')) {
                            $usuarioAccion = 'sin_cambios_por_rol_superior';
                        } else {
                            if ($userModel->hasRole('Personal')) {
                                $userModel->syncRoles(['Operador']);
                                $usuarioAccion = 'rol_actualizado_a_operador';
                            } else {
                                if (!$userModel->roles()->exists()) {
                                    $userModel->assignRole('Operador');
                                    $usuarioAccion = 'rol_asignado_operador';
                                } else {
                                    $usuarioAccion = 'sin_cambios';
                                }
                            }
                        }

                        if (empty($userModel->personal_id)) {
                            $userModel->personal_id = $personal->id;
                            $userModel->save();
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            \Log::warning('Error al crear/actualizar usuario para personal (update): ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Personal actualizado exitosamente',
            'usuario_accion' => $usuarioAccion,
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

    /**
     * Validar si el personal tiene correo y usuario.
     * Si falta correo, solicita uno.
     * Si falta usuario, lo crea automáticamente con rol Visor.
     */
    public function validarParaNotificacion(Request $request, $id)
    {
        $personal = Personal::findOrFail($id);
        
        // Verificar si tiene correo_empresa
        $tieneCorreo = !empty($personal->correo_empresa);
        
        // Buscar usuario vinculado a este personal
        $usuario = \App\Models\User::where('personal_id', $personal->id)->first();
        $tieneUsuario = $usuario !== null;
        
        return response()->json([
            'success' => true,
            'data' => [
                'personal_id' => $personal->id,
                'nombre_completo' => $personal->name,
                'correo_empresa' => $personal->correo_empresa,
                'tiene_correo' => $tieneCorreo,
                'tiene_usuario' => $tieneUsuario,
                'usuario' => $tieneUsuario ? [
                    'id' => $usuario->id,
                    'name' => $usuario->name,
                    'email' => $usuario->email,
                    'activo' => $usuario->activo,
                ] : null,
            ],
        ]);
    }

    /**
     * Actualizar correo del personal y asegurar que tenga usuario.
     * Si ya existe usuario con ese correo, solicitar confirmación para reasignar.
     */
    public function asegurarAccesoSistema(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'correo_empresa' => 'required|email|max:250',
            'forzar_reasignacion' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Correo inválido',
                'errors' => $validator->errors(),
            ], 422);
        }

        $personal = Personal::findOrFail($id);
        $correo = $request->correo_empresa;
        $forzarReasignacion = $request->boolean('forzar_reasignacion', false);

        // 1. Verificar si ya existe un usuario con ese correo
        $usuarioExistente = \App\Models\User::where('email', $correo)->first();
        
        if ($usuarioExistente) {
            // El correo ya está en uso
            if ($usuarioExistente->personal_id === $personal->id) {
                // El usuario ya está vinculado a este personal, todo OK
                return response()->json([
                    'success' => true,
                    'message' => 'El personal ya tiene usuario vinculado',
                    'data' => [
                        'personal' => $personal,
                        'usuario' => $usuarioExistente,
                        'accion' => 'ya_vinculado',
                    ],
                ]);
            }
            
            // CASO NUEVO: El usuario existe pero NO tiene personal_id (está libre)
            // En este caso, simplemente lo vinculamos al personal actual sin pedir confirmación
            if ($usuarioExistente->personal_id === null) {
                $usuarioExistente->update([
                    'personal_id' => $personal->id,
                    'name' => $personal->name,
                ]);
                
                // Actualizar correo del personal
                $personal->update(['correo_empresa' => $correo]);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Usuario vinculado exitosamente al personal',
                    'data' => [
                        'personal' => $personal->fresh(),
                        'usuario' => $usuarioExistente->fresh()->load('roles'),
                        'accion' => 'usuario_vinculado',
                    ],
                ]);
            }
            
            // El correo pertenece a un usuario que YA tiene otro personal vinculado
            if (!$forzarReasignacion) {
                // Informar el conflicto y pedir confirmación
                $otroPersonal = Personal::find($usuarioExistente->personal_id);
                
                return response()->json([
                    'success' => false,
                    'message' => 'El correo ya está asignado a otro usuario que tiene personal vinculado',
                    'error_code' => 'CORREO_EN_USO',
                    'data' => [
                        'usuario_existente' => [
                            'id' => $usuarioExistente->id,
                            'name' => $usuarioExistente->name,
                            'email' => $usuarioExistente->email,
                            'personal_actual' => $otroPersonal ? $otroPersonal->name : 'Sin personal vinculado',
                            'personal_actual_id' => $usuarioExistente->personal_id,
                        ],
                        'personal_nuevo' => [
                            'id' => $personal->id,
                            'name' => $personal->name,
                        ],
                    ],
                ], 409); // Conflict
            }
            
            // Reasignar el usuario existente a este personal
            $usuarioExistente->update([
                'personal_id' => $personal->id,
                'name' => $personal->name,
            ]);
            
            // Actualizar correo del personal
            $personal->update(['correo_empresa' => $correo]);
            
            return response()->json([
                'success' => true,
                'message' => 'Usuario reasignado exitosamente al nuevo personal',
                'data' => [
                    'personal' => $personal->fresh(),
                    'usuario' => $usuarioExistente->fresh(),
                    'accion' => 'reasignado',
                ],
            ]);
        }

        // 2. No existe usuario con ese correo, verificar si el personal ya tiene usuario
        $usuarioDelPersonal = \App\Models\User::where('personal_id', $personal->id)->first();
        
        if ($usuarioDelPersonal) {
            // El personal ya tiene usuario, actualizar su correo
            $usuarioDelPersonal->update(['email' => $correo]);
            $personal->update(['correo_empresa' => $correo]);
            
            return response()->json([
                'success' => true,
                'message' => 'Correo actualizado en personal y usuario',
                'data' => [
                    'personal' => $personal->fresh(),
                    'usuario' => $usuarioDelPersonal->fresh(),
                    'accion' => 'correo_actualizado',
                ],
            ]);
        }

        // 3. No tiene usuario, crear uno nuevo con rol Personal
        $personal->update(['correo_empresa' => $correo]);
        
        $nuevoUsuario = \App\Models\User::create([
            'name' => $personal->name,
            'email' => $correo,
            'password' => bcrypt(\Illuminate\Support\Str::random(16)), // Password aleatorio (usará Microsoft SSO)
            'personal_id' => $personal->id,
            'activo' => true,
        ]);
        
        // Asignar rol Personal
        $rolPersonal = \App\Models\Role::where('name', 'Personal')->first();
        if ($rolPersonal) {
            $nuevoUsuario->roles()->attach($rolPersonal->id);
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Usuario creado exitosamente con rol Personal',
            'data' => [
                'personal' => $personal->fresh(),
                'usuario' => $nuevoUsuario->load('roles'),
                'accion' => 'usuario_creado',
            ],
        ]);
    }
}
