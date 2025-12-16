<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * Listar todos los usuarios
     */
    public function index(Request $request)
    {
        $query = User::with('roles');

        // Filtrar por activos
        if ($request->has('activo')) {
            $query->where('activo', $request->boolean('activo'));
        }

        // Buscar por nombre o email
        if ($request->filled('buscar')) {
            $termino = $request->buscar;
            $query->where(function ($q) use ($termino) {
                $q->where('name', 'like', "%{$termino}%")
                  ->orWhere('email', 'like', "%{$termino}%");
            });
        }

        // Ordenar
        $query->orderBy('name', 'asc');

        $usuarios = $query->get();

        return response()->json([
            'success' => true,
            'data' => $usuarios,
        ]);
    }

    /**
     * Ver un usuario específico
     */
    public function show($id)
    {
        $usuario = User::with('roles.permissions', 'registros')->find($id);

        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $usuario,
        ]);
    }

    /**
     * Crear un nuevo usuario
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role_id' => 'nullable|exists:roles,id',
            'activo' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        $data['activo'] = $data['activo'] ?? true;

        $usuario = User::create($data);

        // Asignar rol si se proporcionó
        if (isset($data['role_id'])) {
            $role = Role::find($data['role_id']);
            if ($role) {
                $usuario->roles()->attach($role->id);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Usuario creado exitosamente',
            'data' => $usuario->load('roles.permissions'),
        ], 201);
    }

    /**
     * Actualizar un usuario
     */
    public function update(Request $request, $id)
    {
        $usuario = User::find($id);

        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $id,
            'password' => 'sometimes|nullable|string|min:6',
            'role_id' => 'sometimes|nullable|exists:roles,id',
            'activo' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        
        // Si no se proporciona password o está vacío, eliminarlo del array
        if (!isset($data['password']) || empty(trim($data['password']))) {
            unset($data['password']);
        }

        // Manejar rol si viene en el request
        if (isset($data['role_id'])) {
            $roleId = $data['role_id'];
            unset($data['role_id']);
            
            // Sincronizar roles (quitar todos y agregar el nuevo)
            if ($roleId) {
                $usuario->roles()->sync([$roleId]);
            } else {
                $usuario->roles()->sync([]);
            }
        }

        $usuario->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Usuario actualizado exitosamente',
            'data' => $usuario->load('roles.permissions'),
        ]);
    }

    /**
     * Eliminar un usuario
     */
    public function destroy($id)
    {
        $usuario = User::find($id);

        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado',
            ], 404);
        }

        // No permitir eliminar al usuario autenticado
        if ($usuario->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'No puedes eliminar tu propio usuario',
            ], 403);
        }

        $usuario->delete();

        return response()->json([
            'success' => true,
            'message' => 'Usuario eliminado exitosamente',
        ]);
    }

    /**
     * Activar/desactivar usuario
     */
    public function toggleActive($id)
    {
        $usuario = User::find($id);

        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado',
            ], 404);
        }

        $usuario->update(['activo' => !$usuario->activo]);

        return response()->json([
            'success' => true,
            'message' => 'Estado del usuario actualizado',
            'data' => $usuario,
        ]);
    }

    /**
     * Asignar rol a usuario
     */
    public function assignRole(Request $request, $id)
    {
        $usuario = User::find($id);

        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'role_id' => 'required|exists:roles,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $role = Role::find($request->role_id);
        $usuario->assignRole($role);

        return response()->json([
            'success' => true,
            'message' => 'Rol asignado exitosamente',
            'data' => $usuario->load('roles.permissions'),
        ]);
    }

    /**
     * Remover rol de usuario
     */
    public function removeRole(Request $request, $id)
    {
        $usuario = User::find($id);

        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'role_id' => 'required|exists:roles,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $role = Role::find($request->role_id);
        $usuario->removeRole($role);

        return response()->json([
            'success' => true,
            'message' => 'Rol removido exitosamente',
            'data' => $usuario->load('roles.permissions'),
        ]);
    }

    /**
     * Obtener estadísticas de usuarios
     */
    public function estadisticas()
    {
        $total = User::count();
        $activos = User::activo()->count();
        $inactivos = User::where('activo', false)->count();
        
        $porRol = Role::withCount('users')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'activos' => $activos,
                'inactivos' => $inactivos,
                'por_rol' => $porRol,
            ],
        ]);
    }
}
