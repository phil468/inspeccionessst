<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;
use App\Models\Role;
use App\Constants\Permissions;

class PermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear todos los permisos
        $permissions = Permissions::all();
        
        foreach ($permissions as $permissionName) {
            // Extraer resource y action del nombre (formato: resource.action)
            $parts = explode('.', $permissionName);
            $resource = $parts[0] ?? '';
            $action = $parts[1] ?? '';
            
            Permission::firstOrCreate(
                ['name' => $permissionName],
                [
                    'description' => Permissions::getDescription($permissionName),
                    'resource' => $resource,
                    'action' => $action,
                ]
            );
        }

        $this->command->info('Permisos creados correctamente.');

        // Asignar permisos al rol Admin (si existe)
        $adminRole = Role::where('name', 'administrador')->first();
        if ($adminRole) {
            $allPermissionIds = Permission::pluck('id')->toArray();
            $adminRole->permissions()->sync($allPermissionIds);
            $this->command->info('Permisos asignados al rol Administrador.');
        }

        // Asignar permisos básicos al rol Técnico de Campo (si existe)
        $tecnicoRole = Role::where('name', 'tecnico_campo')->first();
        if ($tecnicoRole) {
            $tecnicoPermissions = Permission::whereIn('name', [
                Permissions::REGISTROS_VIEW,
                Permissions::REGISTROS_CREATE,
                Permissions::REGISTROS_UPDATE,
                Permissions::CAMPANIAS_VIEW,
                Permissions::MATERIALES_VIEW,
                Permissions::FUNDOS_VIEW,
                Permissions::LOTES_VIEW,
                Permissions::MOTIVOS_VIEW,
                Permissions::SYNC_EXECUTE,
            ])->pluck('id')->toArray();
            
            $tecnicoRole->permissions()->sync($tecnicoPermissions);
            $this->command->info('Permisos asignados al rol Técnico de Campo.');
        }

        // Asignar permisos al rol Supervisor (si existe)
        $supervisorRole = Role::where('name', 'supervisor')->first();
        if ($supervisorRole) {
            $supervisorPermissions = Permission::whereIn('name', [
                Permissions::REGISTROS_VIEW,
                Permissions::REGISTROS_CREATE,
                Permissions::REGISTROS_UPDATE,
                Permissions::REGISTROS_DELETE,
                Permissions::CAMPANIAS_VIEW,
                Permissions::CAMPANIAS_CREATE,
                Permissions::CAMPANIAS_UPDATE,
                Permissions::MATERIALES_VIEW,
                Permissions::MATERIALES_CREATE,
                Permissions::MATERIALES_UPDATE,
                Permissions::FUNDOS_VIEW,
                Permissions::FUNDOS_CREATE,
                Permissions::FUNDOS_UPDATE,
                Permissions::LOTES_VIEW,
                Permissions::LOTES_CREATE,
                Permissions::LOTES_UPDATE,
                Permissions::MOTIVOS_VIEW,
                Permissions::MOTIVOS_CREATE,
                Permissions::MOTIVOS_UPDATE,
                Permissions::SYNC_EXECUTE,
            ])->pluck('id')->toArray();
            
            $supervisorRole->permissions()->sync($supervisorPermissions);
            $this->command->info('Permisos asignados al rol Supervisor.');
        }
    }
}
