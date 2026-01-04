<?php

namespace App\Services;

use App\Models\User;
use App\Models\Personal;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class UserCreationService
{
    /**
     * Crear o actualizar usuario desde personal
     */
    public function createOrUpdateFromPersonal(Personal $personal): ?User
    {
        // Validar que tenga correo empresarial
        if (empty($personal->correo_empresa)) {
            Log::warning("Personal #{$personal->id} no tiene correo_empresa");
            return null;
        }

        // Buscar usuario existente por email
        $user = User::where('email', $personal->correo_empresa)->first();

        if ($user) {
            // Si existe, actualizar información
            $user->update([
                'name' => $personal->name ?: $personal->nombres . ' ' . $personal->apellido_paterno,
                'personal_id' => $personal->id,
            ]);

            Log::info("Usuario actualizado: {$user->email}");
        } else {
            // Crear nuevo usuario
            $user = User::create([
                'name' => $personal->name ?: $personal->nombres . ' ' . $personal->apellido_paterno,
                'email' => $personal->correo_empresa,
                'password' => Hash::make(Str::random(16)), // Password aleatorio (debe cambiarlo)
                'personal_id' => $personal->id,
                'email_verified_at' => now(), // Auto-verificado
            ]);

            // Asignar rol "Personal"
            $rolPersonal = Role::where('name', 'Personal')->first();
            if ($rolPersonal) {
                $user->roles()->attach($rolPersonal->id);
            }

            Log::info("Usuario creado: {$user->email}");
        }

        return $user;
    }

    /**
     * Crear usuarios para todo el personal con correo_empresa
     */
    public function createUsersForAllPersonal(): array
    {
        $personal = Personal::whereNotNull('correo_empresa')
            ->where('correo_empresa', '!=', '')
            ->get();

        $created = 0;
        $updated = 0;
        $skipped = 0;

        foreach ($personal as $p) {
            $existingUser = User::where('email', $p->correo_empresa)->exists();
            
            $user = $this->createOrUpdateFromPersonal($p);
            
            if ($user) {
                if ($existingUser) {
                    $updated++;
                } else {
                    $created++;
                }
            } else {
                $skipped++;
            }
        }

        return [
            'created' => $created,
            'updated' => $updated,
            'skipped' => $skipped,
            'total' => $personal->count(),
        ];
    }

    /**
     * Enviar email de bienvenida con link para cambiar contraseña
     */
    public function sendWelcomeEmail(User $user): void
    {
        // TODO: Implementar envío de email con token para resetear password
        // Puede usar la funcionalidad nativa de Laravel: Password::sendResetLink()
        Log::info("Email de bienvenida para: {$user->email}");
    }
}
