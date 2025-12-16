<?php

namespace App\Constants;

class Roles
{
    const ADMINISTRADOR = 'Administrador';
    const SUPERVISOR = 'Supervisor';
    const OPERADOR = 'Operador';

    /**
     * Obtener todos los roles
     */
    public static function all(): array
    {
        return [
            self::ADMINISTRADOR,
            self::SUPERVISOR,
            self::OPERADOR,
        ];
    }

    /**
     * Verificar si es un rol del sistema
     */
    public static function isSystemRole(string $role): bool
    {
        return in_array($role, self::all());
    }

    /**
     * Obtener permisos por rol
     */
    public static function getPermissions(string $role): array
    {
        switch ($role) {
            case self::ADMINISTRADOR:
                return Permissions::all();
            
            case self::SUPERVISOR:
                return [
                    Permissions::REGISTROS_CREATE,
                    Permissions::REGISTROS_READ,
                    Permissions::REGISTROS_UPDATE,
                    Permissions::CAMPANIAS_MANAGE,
                    Permissions::MATERIALES_MANAGE,
                    Permissions::FUNDOS_MANAGE,
                    Permissions::LOTES_MANAGE,
                    Permissions::MOTIVOS_MANAGE,
                    Permissions::SYNC_EXECUTE,
                ];
            
            case self::OPERADOR:
                return [
                    Permissions::REGISTROS_CREATE,
                    Permissions::REGISTROS_READ,
                    Permissions::REGISTROS_UPDATE,
                    Permissions::SYNC_EXECUTE,
                ];
            
            default:
                return [];
        }
    }
}
