<?php

namespace App\Constants;

class Permissions
{
    // Registros
    const REGISTROS_VIEW = 'registros.view';
    const REGISTROS_CREATE = 'registros.create';
    const REGISTROS_UPDATE = 'registros.update';
    const REGISTROS_DELETE = 'registros.delete';

    // Campañas
    const CAMPANIAS_VIEW = 'campanias.view';
    const CAMPANIAS_CREATE = 'campanias.create';
    const CAMPANIAS_UPDATE = 'campanias.update';
    const CAMPANIAS_DELETE = 'campanias.delete';

    // Materiales
    const MATERIALES_VIEW = 'materiales.view';
    const MATERIALES_CREATE = 'materiales.create';
    const MATERIALES_UPDATE = 'materiales.update';
    const MATERIALES_DELETE = 'materiales.delete';

    // Fundos
    const FUNDOS_VIEW = 'fundos.view';
    const FUNDOS_CREATE = 'fundos.create';
    const FUNDOS_UPDATE = 'fundos.update';
    const FUNDOS_DELETE = 'fundos.delete';

    // Lotes
    const LOTES_VIEW = 'lotes.view';
    const LOTES_CREATE = 'lotes.create';
    const LOTES_UPDATE = 'lotes.update';
    const LOTES_DELETE = 'lotes.delete';

    // Motivos
    const MOTIVOS_VIEW = 'motivos.view';
    const MOTIVOS_CREATE = 'motivos.create';
    const MOTIVOS_UPDATE = 'motivos.update';
    const MOTIVOS_DELETE = 'motivos.delete';

    // Sincronización
    const SYNC_EXECUTE = 'sync.execute';

    // Usuarios
    const USERS_VIEW = 'users.view';
    const USERS_CREATE = 'users.create';
    const USERS_UPDATE = 'users.update';
    const USERS_DELETE = 'users.delete';

    // Roles
    const ROLES_VIEW = 'roles.view';
    const ROLES_CREATE = 'roles.create';
    const ROLES_UPDATE = 'roles.update';
    const ROLES_DELETE = 'roles.delete';

    /**
     * Obtener todos los permisos
     */
    public static function all(): array
    {
        return [
            // Registros
            self::REGISTROS_VIEW,
            self::REGISTROS_CREATE,
            self::REGISTROS_UPDATE,
            self::REGISTROS_DELETE,
            
            // Campañas
            self::CAMPANIAS_VIEW,
            self::CAMPANIAS_CREATE,
            self::CAMPANIAS_UPDATE,
            self::CAMPANIAS_DELETE,
            
            // Materiales
            self::MATERIALES_VIEW,
            self::MATERIALES_CREATE,
            self::MATERIALES_UPDATE,
            self::MATERIALES_DELETE,
            
            // Fundos
            self::FUNDOS_VIEW,
            self::FUNDOS_CREATE,
            self::FUNDOS_UPDATE,
            self::FUNDOS_DELETE,
            
            // Lotes
            self::LOTES_VIEW,
            self::LOTES_CREATE,
            self::LOTES_UPDATE,
            self::LOTES_DELETE,
            
            // Motivos
            self::MOTIVOS_VIEW,
            self::MOTIVOS_CREATE,
            self::MOTIVOS_UPDATE,
            self::MOTIVOS_DELETE,
            
            // Sincronización
            self::SYNC_EXECUTE,
            
            // Usuarios
            self::USERS_VIEW,
            self::USERS_CREATE,
            self::USERS_UPDATE,
            self::USERS_DELETE,
            
            // Roles
            self::ROLES_VIEW,
            self::ROLES_CREATE,
            self::ROLES_UPDATE,
            self::ROLES_DELETE,
        ];
    }

    /**
     * Obtener permisos por grupo
     */
    public static function byGroup(string $group): array
    {
        $groups = [
            'registros' => [
                self::REGISTROS_VIEW,
                self::REGISTROS_CREATE,
                self::REGISTROS_UPDATE,
                self::REGISTROS_DELETE,
            ],
            'campanias' => [
                self::CAMPANIAS_VIEW,
                self::CAMPANIAS_CREATE,
                self::CAMPANIAS_UPDATE,
                self::CAMPANIAS_DELETE,
            ],
            'materiales' => [
                self::MATERIALES_VIEW,
                self::MATERIALES_CREATE,
                self::MATERIALES_UPDATE,
                self::MATERIALES_DELETE,
            ],
            'fundos' => [
                self::FUNDOS_VIEW,
                self::FUNDOS_CREATE,
                self::FUNDOS_UPDATE,
                self::FUNDOS_DELETE,
            ],
            'lotes' => [
                self::LOTES_VIEW,
                self::LOTES_CREATE,
                self::LOTES_UPDATE,
                self::LOTES_DELETE,
            ],
            'motivos' => [
                self::MOTIVOS_VIEW,
                self::MOTIVOS_CREATE,
                self::MOTIVOS_UPDATE,
                self::MOTIVOS_DELETE,
            ],
            'sync' => [
                self::SYNC_EXECUTE,
            ],
            'users' => [
                self::USERS_VIEW,
                self::USERS_CREATE,
                self::USERS_UPDATE,
                self::USERS_DELETE,
            ],
            'roles' => [
                self::ROLES_VIEW,
                self::ROLES_CREATE,
                self::ROLES_UPDATE,
                self::ROLES_DELETE,
            ],
        ];

        return $groups[$group] ?? [];
    }

    /**
     * Obtener descripción de un permiso
     */
    public static function getDescription(string $permission): string
    {
        $descriptions = [
            // Registros
            self::REGISTROS_VIEW => 'Ver registros de calibración',
            self::REGISTROS_CREATE => 'Crear registros de calibración',
            self::REGISTROS_UPDATE => 'Actualizar registros de calibración',
            self::REGISTROS_DELETE => 'Eliminar registros de calibración',
            
            // Campañas
            self::CAMPANIAS_VIEW => 'Ver campañas',
            self::CAMPANIAS_CREATE => 'Crear campañas',
            self::CAMPANIAS_UPDATE => 'Actualizar campañas',
            self::CAMPANIAS_DELETE => 'Eliminar campañas',
            
            // Materiales
            self::MATERIALES_VIEW => 'Ver materiales',
            self::MATERIALES_CREATE => 'Crear materiales',
            self::MATERIALES_UPDATE => 'Actualizar materiales',
            self::MATERIALES_DELETE => 'Eliminar materiales',
            
            // Fundos
            self::FUNDOS_VIEW => 'Ver fundos',
            self::FUNDOS_CREATE => 'Crear fundos',
            self::FUNDOS_UPDATE => 'Actualizar fundos',
            self::FUNDOS_DELETE => 'Eliminar fundos',
            
            // Lotes
            self::LOTES_VIEW => 'Ver lotes',
            self::LOTES_CREATE => 'Crear lotes',
            self::LOTES_UPDATE => 'Actualizar lotes',
            self::LOTES_DELETE => 'Eliminar lotes',
            
            // Motivos
            self::MOTIVOS_VIEW => 'Ver motivos',
            self::MOTIVOS_CREATE => 'Crear motivos',
            self::MOTIVOS_UPDATE => 'Actualizar motivos',
            self::MOTIVOS_DELETE => 'Eliminar motivos',
            
            // Sincronización
            self::SYNC_EXECUTE => 'Ejecutar sincronización',
            
            // Usuarios
            self::USERS_VIEW => 'Ver usuarios',
            self::USERS_CREATE => 'Crear usuarios',
            self::USERS_UPDATE => 'Actualizar usuarios',
            self::USERS_DELETE => 'Eliminar usuarios',
            
            // Roles
            self::ROLES_VIEW => 'Ver roles',
            self::ROLES_CREATE => 'Crear roles',
            self::ROLES_UPDATE => 'Actualizar roles',
            self::ROLES_DELETE => 'Eliminar roles',
        ];

        return $descriptions[$permission] ?? $permission;
    }
}
