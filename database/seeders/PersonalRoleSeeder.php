<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;

class PersonalRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear permiso si no existe
        $perm = Permission::firstOrCreate(
            ['name' => 'mis-inspecciones.view'],
            ['description' => 'Ver mis inspecciones', 'resource' => 'mis-inspecciones', 'action' => 'view']
            );

        // Crear rol 'Personal' si no existe y asignarle el permiso
        $role = Role::firstOrCreate(['name' => 'Personal']);
        if (!$role->hasPermission($perm->name)) {
            $role->givePermissionTo($perm->name);
        }

        // Agregar permiso a rol 'Administrador' si no lo tiene
        $adminRole = Role::firstOrCreate(['name' => 'Administrador']);
        if (!$adminRole->hasPermission($perm->name)) {
            $adminRole->givePermissionTo($perm->name);
        }

        // Agregar permiso a rol 'Supervisor' si no lo tiene
        $supervisorRole = Role::firstOrCreate(['name' => 'Supervisor']);
        if (!$supervisorRole->hasPermission($perm->name)) {
            $supervisorRole->givePermissionTo($perm->name);
        }

        // Agregar permiso a rol 'Operador' si no lo tiene
        $operadorRole = Role::firstOrCreate(['name' => 'Operador']);
        if (!$operadorRole->hasPermission($perm->name)) {
            $operadorRole->givePermissionTo($perm->name);
        }
    }
}
