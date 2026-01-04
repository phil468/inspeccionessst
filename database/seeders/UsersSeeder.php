<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        // Crear usuario administrador inicial
        $user = User::firstOrCreate(
            ['email' => 'john.delacruz@vanguardfresh.pe'],
            [
                'name' => 'John De La Cruz',
                'microsoft_id' => '65691ac6-4480-4618-a4c7-e99f7fc6d6cf',
                'avatar' => null,
                'activo' => 1,
                'email_verified_at' => null,
                'password' => '$2y$12$N2IBEYDqQmtIJ0Nw1/nSs.P39PBvV6BQ9s6u6bJ49kw4PiRl6je1W',
                'remember_token' => null,
            ]
        );

        // Asignar rol de Administrador (id: 1)
        $adminRole = Role::find(1);
        if ($adminRole && !$user->roles()->where('role_id', $adminRole->id)->exists()) {
            $user->roles()->attach($adminRole->id);
        }

        $this->command->info('Usuario administrador creado exitosamente');
    }
}
