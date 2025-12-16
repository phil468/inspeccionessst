<?php

namespace App\Helpers;

class PermissionHelper
{
    /**
     * Grupos de permisos disponibles
     */
    public const GROUPS = [
        'registros' => 'Registros de Calibración',
        'catalogos' => 'Catálogos',
        'sync' => 'Sincronización',
        'admin' => 'Administración',
    ];

    /**
     * Permisos disponibles por grupo
     */
    public const PERMISSIONS = [
        'registros' => [
            'registros.create' => 'Crear registros',
            'registros.read' => 'Ver registros',
            'registros.update' => 'Editar registros',
            'registros.delete' => 'Eliminar registros',
        ],
        'catalogos' => [
            'campanias.manage' => 'Gestionar campañas',
            'materiales.manage' => 'Gestionar materiales',
            'fundos.manage' => 'Gestionar fundos',
            'lotes.manage' => 'Gestionar lotes',
            'motivos.manage' => 'Gestionar motivos',
        ],
        'sync' => [
            'sync.execute' => 'Ejecutar sincronización',
        ],
        'admin' => [
            'users.manage' => 'Gestionar usuarios',
            'roles.manage' => 'Gestionar roles',
        ],
    ];

    /**
     * Obtener todos los permisos agrupados
     */
    public static function getAllPermissions()
    {
        return self::PERMISSIONS;
    }

    /**
     * Obtener permisos de un grupo específico
     */
    public static function getPermissionsByGroup($group)
    {
        return self::PERMISSIONS[$group] ?? [];
    }

    /**
     * Obtener nombre del grupo
     */
    public static function getGroupName($group)
    {
        return self::GROUPS[$group] ?? $group;
    }

    /**
     * Validar si un permiso existe
     */
    public static function exists($permission)
    {
        foreach (self::PERMISSIONS as $permissions) {
            if (isset($permissions[$permission])) {
                return true;
            }
        }
        return false;
    }
}
