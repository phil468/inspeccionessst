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
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('role_permission')->delete();
        DB::table('user_role')->delete();
        Permission::truncate();
        Role::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Crear permisos para cada recurso
        $resources = [
            'campanias' => 'Campañas',
            'fundos' => 'Fundos',
            'empresas' => 'Empresas',
            'areas' => 'Áreas',
            'registros' => 'Registros',
            'inspecciones' => 'Inspecciones',
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
            if (in_array($resource, ['campanias', 'fundos', 'empresas', 'areas'])) {
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

        // Agregar permisos especiales para inspecciones
        $syncInspeccionesPermission = Permission::create([
            'name' => 'inspecciones.sync',
            'description' => 'Sincronizar Inspecciones',
            'resource' => 'inspecciones',
            'action' => 'sync',
        ]);
        $permissions['inspecciones.sync'] = $syncInspeccionesPermission;

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
            'fundos.view',
            'empresas.view',
            'areas.view',
            // Gestionar registros
            'registros.view',
            'registros.create',
            'registros.edit',
            'registros.delete',
            'registros.sync',
            // Gestionar inspecciones
            'inspecciones.view',
            'inspecciones.create',
            'inspecciones.edit',
            'inspecciones.delete',
            'inspecciones.sync',
        ];
        
        $supervisorPermissionIds = Permission::whereIn('name', $supervisorPermissions)->pluck('id');
        $supervisorRole->permissions()->sync($supervisorPermissionIds);

        // Asignar permisos al Operador
        $operatorPermissions = [
            // Ver catálogos
            'campanias.view',
            'fundos.view',
            'empresas.view',
            'areas.view',
            // Ver y crear registros
            'registros.view',
            'registros.create',
            // Ver y crear inspecciones
            'inspecciones.view',
            'inspecciones.create',
        ];
        
        $operatorPermissionIds = Permission::whereIn('name', $operatorPermissions)->pluck('id');
        $operatorRole->permissions()->sync($operatorPermissionIds);

        $this->command->info('Roles y permisos creados exitosamente!');
        $this->command->info('- Administrador: ' . $adminRole->permissions->count() . ' permisos');
        $this->command->info('- Supervisor: ' . $supervisorRole->permissions->count() . ' permisos');
        $this->command->info('- Operador: ' . $operatorRole->permissions->count() . ' permisos');
    }
}
