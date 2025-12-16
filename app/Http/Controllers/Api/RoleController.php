<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RoleController extends Controller
{
    /**
     * Listar todos los roles
     */
    public function index()
    {
        $roles = Role::with('permissions')->orderBy('name', 'asc')->get();

        // Transformar para coincidir con el frontend
        $roles = $roles->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'description' => $role->description,
                'permissions' => $role->permissions->map(function ($perm) {
                    return [
                        'id' => $perm->id,
                        'name' => $perm->name,
                        'description' => $perm->description,
                        'resource' => $perm->resource,
                        'action' => $perm->action,
                    ];
                }),
                'created_at' => $role->created_at,
                'updated_at' => $role->updated_at,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $roles,
        ]);
    }

    private function extractAction($permissionName)
    {
        // Extraer la acción del nombre del permiso (ej: "campanias.view" -> "view")
        $parts = explode('.', $permissionName);
        return end($parts);
    }

    /**
     * Ver un rol específico
     */
    public function show($id)
    {
        $role = Role::with('permissions', 'users')->find($id);

        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Rol no encontrado',
            ], 404);
        }

        $data = [
            'id' => $role->id,
            'name' => $role->name,
            'description' => $role->description,
            'permissions' => $role->permissions->map(function ($perm) {
                return [
                    'id' => $perm->id,
                    'name' => $perm->name,
                    'description' => $perm->description,
                    'resource' => $perm->resource,
                    'action' => $perm->action,
                ];
            }),
            'users_count' => $role->users->count(),
            'created_at' => $role->created_at,
            'updated_at' => $role->updated_at,
        ];

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Crear un nuevo rol
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:roles,name',
            'description' => 'nullable|string',
            'permissions' => 'sometimes|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $role = Role::create([
            'name' => $request->name,
            'description' => $request->description,
        ]);

        // Asignar permisos si se proporcionaron
        if ($request->has('permissions')) {
            $role->permissions()->sync($request->permissions);
        }

        return response()->json([
            'success' => true,
            'message' => 'Rol creado exitosamente',
            'data' => $role->load('permissions'),
        ], 201);
    }

    /**
     * Actualizar un rol
     */
    public function update(Request $request, $id)
    {
        $role = Role::find($id);

        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Rol no encontrado',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255|unique:roles,name,' . $id,
            'description' => 'nullable|string',
            'permissions' => 'sometimes|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        if ($request->has('name')) {
            $role->name = $request->name;
        }
        if ($request->has('description')) {
            $role->description = $request->description;
        }
        $role->save();

        // Sincronizar permisos si se proporcionaron
        if ($request->has('permissions')) {
            $role->permissions()->sync($request->permissions);
        }

        return response()->json([
            'success' => true,
            'message' => 'Rol actualizado exitosamente',
            'data' => $role->load('permissions'),
        ]);
    }

    /**
     * Eliminar un rol
     */
    public function destroy($id)
    {
        $role = Role::find($id);

        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Rol no encontrado',
            ], 404);
        }

        // Verificar que no sea un rol del sistema
        if (in_array($role->name, ['Administrador', 'Supervisor', 'Operador'])) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar un rol del sistema',
            ], 403);
        }

        $role->delete();

        return response()->json([
            'success' => true,
            'message' => 'Rol eliminado exitosamente',
        ]);
    }

    /**
     * Asignar permisos a un rol
     */
    public function syncPermissions(Request $request, $id)
    {
        $role = Role::find($id);

        if (!$role) {
            return response()->json([
                'success' => false,
                'message' => 'Rol no encontrado',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $role->permissions()->sync($request->permissions);

        return response()->json([
            'success' => true,
            'message' => 'Permisos actualizados exitosamente',
            'data' => $role->load('permissions'),
        ]);
    }

    /**
     * Listar todos los permisos disponibles
     */
    public function permissions()
    {
        $permissions = Permission::orderBy('resource')->orderBy('action')->get();

        // Transformar para coincidir con el frontend
        $transformed = $permissions->map(function ($perm) {
            return [
                'id' => $perm->id,
                'name' => $perm->name,
                'description' => $perm->description,
                'resource' => $perm->resource,
                'action' => $perm->action,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $transformed,
        ]);
    }
}
