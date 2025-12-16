<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Support\Facades\DB;

class RolesPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Limpiar tablas
        DB::table('role_permission')->delete();
        DB::table('user_role')->delete();
        Permission::truncate();
        Role::truncate();

        // Crear permisos para cada recurso
        $resources = [
            'campanias' => 'Campañas',
            'materiales' => 'Materiales',
            'fundos' => 'Fundos',
            'lotes' => 'Lotes',
            'motivos' => 'Motivos',
            'registros' => 'Registros',
            'usuarios' => 'Usuarios',
            'roles' => 'Roles y Permisos',
        ];

        $actions = [
            'view' => 'Ver',
            'create' => 'Crear',
            'edit' => 'Editar',
            'delete' => 'Eliminar',
        ];

        $permissions = [];

        foreach ($resources as $resource => $resourceName) {
            foreach ($actions as $action => $actionName) {
                $permission = Permission::create([
                    'name' => "{$resource}.{$action}",
                    'description' => "{$actionName} {$resourceName}",
                    'resource' => $resource,
                    'action' => $action,
                ]);
                $permissions["{$resource}.{$action}"] = $permission;
            }

            // Agregar permiso especial de gestionar (manage)
            if (in_array($resource, ['campanias', 'materiales', 'fundos', 'lotes', 'motivos'])) {
                $permission = Permission::create([
                    'name' => "{$resource}.manage",
                    'description' => "Gestionar {$resourceName}",
                    'resource' => $resource,
                    'action' => 'manage',
                ]);
                $permissions["{$resource}.manage"] = $permission;
            }
        }

        // Agregar permisos especiales para registros
        $syncPermission = Permission::create([
            'name' => 'registros.sync',
            'description' => 'Sincronizar Registros',
            'resource' => 'registros',
            'action' => 'sync',
        ]);
        $permissions['registros.sync'] = $syncPermission;

        // Crear roles
        $adminRole = Role::create([
            'name' => 'Administrador',
            'description' => 'Acceso total al sistema',
        ]);

        $supervisorRole = Role::create([
            'name' => 'Supervisor',
            'description' => 'Puede gestionar registros y ver catálogos',
        ]);

        $operatorRole = Role::create([
            'name' => 'Operador',
            'description' => 'Puede crear y ver registros',
        ]);

        // Asignar permisos al Administrador (todos)
        $adminRole->permissions()->sync(Permission::all()->pluck('id'));

        // Asignar permisos al Supervisor
        $supervisorPermissions = [
            // Ver todos los catálogos
            'campanias.view',
            'materiales.view',
            'fundos.view',
            'lotes.view',
            'motivos.view',
            // Gestionar registros
            'registros.view',
            'registros.create',
            'registros.edit',
            'registros.delete',
            'registros.sync',
        ];
        
        $supervisorPermissionIds = Permission::whereIn('name', $supervisorPermissions)->pluck('id');
        $supervisorRole->permissions()->sync($supervisorPermissionIds);

        // Asignar permisos al Operador
        $operatorPermissions = [
            // Ver catálogos
            'campanias.view',
            'materiales.view',
            'fundos.view',
            'lotes.view',
            'motivos.view',
            // Ver y crear registros
            'registros.view',
            'registros.create',
        ];
        
        $operatorPermissionIds = Permission::whereIn('name', $operatorPermissions)->pluck('id');
        $operatorRole->permissions()->sync($operatorPermissionIds);

        $this->command->info('Roles y permisos creados exitosamente!');
        $this->command->info('- Administrador: ' . $adminRole->permissions->count() . ' permisos');
        $this->command->info('- Supervisor: ' . $supervisorRole->permissions->count() . ' permisos');
        $this->command->info('- Operador: ' . $operatorRole->permissions->count() . ' permisos');
    }
}
