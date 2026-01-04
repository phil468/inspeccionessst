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
            
            // Personal
            ['name' => 'personal.view', 'description' => 'Ver personal', 'resource' => 'personal', 'action' => 'view'],
            ['name' => 'personal.manage', 'description' => 'Gestionar personal', 'resource' => 'personal', 'action' => 'manage'],
            ['name' => 'personal.sync', 'description' => 'Sincronizar personal desde API', 'resource' => 'personal', 'action' => 'sync'],
            
            // Cargos
            ['name' => 'cargos.view', 'description' => 'Ver cargos', 'resource' => 'cargos', 'action' => 'view'],
            ['name' => 'cargos.manage', 'description' => 'Gestionar cargos', 'resource' => 'cargos', 'action' => 'manage'],
            
            // Empresas
            ['name' => 'empresas.view', 'description' => 'Ver empresas', 'resource' => 'empresas', 'action' => 'view'],
            ['name' => 'empresas.manage', 'description' => 'Gestionar empresas', 'resource' => 'empresas', 'action' => 'manage'],
            
            // Áreas
            ['name' => 'areas.view', 'description' => 'Ver áreas', 'resource' => 'areas', 'action' => 'view'],
            ['name' => 'areas.manage', 'description' => 'Gestionar áreas', 'resource' => 'areas', 'action' => 'manage'],
            
            // Inspecciones
            ['name' => 'inspecciones.view', 'description' => 'Ver inspecciones', 'resource' => 'inspecciones', 'action' => 'view'],
            ['name' => 'inspecciones.create', 'description' => 'Crear inspecciones', 'resource' => 'inspecciones', 'action' => 'create'],
            ['name' => 'inspecciones.update', 'description' => 'Editar inspecciones', 'resource' => 'inspecciones', 'action' => 'update'],
            ['name' => 'inspecciones.delete', 'description' => 'Eliminar inspecciones', 'resource' => 'inspecciones', 'action' => 'delete'],
            ['name' => 'inspecciones.manage', 'description' => 'Gestionar inspecciones', 'resource' => 'inspecciones', 'action' => 'manage'],
            
            // Administración
            ['name' => 'usuarios.view', 'description' => 'Ver usuarios', 'resource' => 'admin', 'action' => 'view'],
            ['name' => 'users.manage', 'description' => 'Gestionar usuarios', 'resource' => 'admin', 'action' => 'manage'],
            ['name' => 'roles.view', 'description' => 'Ver roles', 'resource' => 'admin', 'action' => 'view'],
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
            'inspecciones.view',
            'inspecciones.create',
            'inspecciones.update',
            'personal.view',
            'cargos.view',
            'empresas.view',
            'areas.view',
        ])->get();
        $supervisorRole->permissions()->sync($supervisorPermissions->pluck('id'));

        // Asignar permisos al Operador
        $operadorPermissions = Permission::whereIn('name', [
            'registros.create',
            'registros.read',
            'registros.update',
            'sync.execute',
            'inspecciones.view',
            'inspecciones.create',
            'inspecciones.update',
        ])->get();
        $operadorRole->permissions()->sync($operadorPermissions->pluck('id'));

        $this->command->info('Roles y permisos creados exitosamente');
    }
}
