<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Crear permisos
        $permissions = [
            // Registros
            ['name' => 'registros.create', 'description' => 'Crear registros', 'resource' => 'registros', 'action' => 'create'],
            ['name' => 'registros.read', 'description' => 'Ver registros', 'resource' => 'registros', 'action' => 'read'],
            ['name' => 'registros.update', 'description' => 'Editar registros', 'resource' => 'registros', 'action' => 'update'],
            ['name' => 'registros.delete', 'description' => 'Eliminar registros', 'resource' => 'registros', 'action' => 'delete'],
            
            // Campañas
            ['name' => 'campanias.manage', 'description' => 'Gestionar campañas', 'resource' => 'catalogos', 'action' => 'manage'],
            
            // Materiales
            ['name' => 'materiales.manage', 'description' => 'Gestionar materiales', 'resource' => 'catalogos', 'action' => 'manage'],
            
            // Fundos
            ['name' => 'fundos.manage', 'description' => 'Gestionar fundos', 'resource' => 'catalogos', 'action' => 'manage'],
            
            // Lotes
            ['name' => 'lotes.manage', 'description' => 'Gestionar lotes', 'resource' => 'catalogos', 'action' => 'manage'],
            
            // Motivos
            ['name' => 'motivos.manage', 'description' => 'Gestionar motivos', 'resource' => 'catalogos', 'action' => 'manage'],
            
            // Sincronización
            ['name' => 'sync.execute', 'description' => 'Ejecutar sincronización', 'resource' => 'sync', 'action' => 'execute'],
            
            // Administración
            ['name' => 'users.manage', 'description' => 'Gestionar usuarios', 'resource' => 'admin', 'action' => 'manage'],
            ['name' => 'roles.manage', 'description' => 'Gestionar roles', 'resource' => 'admin', 'action' => 'manage'],
        ];

        foreach ($permissions as $permissionData) {
            Permission::firstOrCreate(
                ['name' => $permissionData['name']],
                $permissionData
            );
        }

        // Crear roles
        $adminRole = Role::firstOrCreate(
            ['name' => 'Administrador'],
            ['description' => 'Acceso completo al sistema']
        );

        $supervisorRole = Role::firstOrCreate(
            ['name' => 'Supervisor'],
            ['description' => 'Puede gestionar catálogos y ver todos los registros']
        );

        $operadorRole = Role::firstOrCreate(
            ['name' => 'Operador'],
            ['description' => 'Puede crear y ver sus propios registros']
        );

        // Asignar todos los permisos al Administrador
        $allPermissions = Permission::all();
        $adminRole->permissions()->sync($allPermissions->pluck('id'));

        // Asignar permisos al Supervisor
        $supervisorPermissions = Permission::whereIn('name', [
            'registros.create',
            'registros.read',
            'registros.update',
            'campanias.manage',
            'materiales.manage',
            'fundos.manage',
            'lotes.manage',
            'motivos.manage',
            'sync.execute',
        ])->get();
        $supervisorRole->permissions()->sync($supervisorPermissions->pluck('id'));

        // Asignar permisos al Operador
        $operadorPermissions = Permission::whereIn('name', [
            'registros.create',
            'registros.read',
            'registros.update',
            'sync.execute',
        ])->get();
        $operadorRole->permissions()->sync($operadorPermissions->pluck('id'));

        $this->command->info('Roles y permisos creados exitosamente');
    }
}
