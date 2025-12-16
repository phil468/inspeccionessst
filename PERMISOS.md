# Sistema de Permisos

## Estructura de Permisos

El sistema utiliza permisos granulares con el formato: `{recurso}.{acción}`

### Acciones Disponibles

-   `view` - Ver/Listar recursos
-   `create` - Crear nuevos recursos
-   `update` - Actualizar recursos existentes
-   `delete` - Eliminar recursos

### Recursos del Sistema

#### 1. Registros de Calibración

-   `registros.view`
-   `registros.create`
-   `registros.update`
-   `registros.delete`

#### 2. Campañas

-   `campanias.view`
-   `campanias.create`
-   `campanias.update`
-   `campanias.delete`

#### 3. Materiales

-   `materiales.view`
-   `materiales.create`
-   `materiales.update`
-   `materiales.delete`

#### 4. Fundos

-   `fundos.view`
-   `fundos.create`
-   `fundos.update`
-   `fundos.delete`

#### 5. Lotes

-   `lotes.view`
-   `lotes.create`
-   `lotes.update`
-   `lotes.delete`

#### 6. Motivos

-   `motivos.view`
-   `motivos.create`
-   `motivos.update`
-   `motivos.delete`

#### 7. Usuarios

-   `users.view`
-   `users.create`
-   `users.update`
-   `users.delete`

#### 8. Roles

-   `roles.view`
-   `roles.create`
-   `roles.update`
-   `roles.delete`

#### 9. Sincronización

-   `sync.execute`

## Roles Predefinidos

### Admin

-   **Permisos**: Todos los permisos del sistema
-   **Descripción**: Acceso total al sistema

### Supervisor

-   **Permisos**:
    -   Todos los permisos de Registros (view, create, update, delete)
    -   Todos los permisos de Catálogos excepto delete (view, create, update)
    -   Sincronización (execute)
-   **Descripción**: Gestión completa de registros y catálogos

### Técnico de Campo

-   **Permisos**:
    -   Registros: view, create, update
    -   Catálogos: view (solo lectura)
    -   Sincronización: execute
-   **Descripción**: Creación y edición de registros, consulta de catálogos

## Uso en Backend (Laravel)

### 1. En Controladores

```php
use App\Constants\Permissions;

// Verificar permiso único
if (!auth()->user()->hasPermission(Permissions::REGISTROS_CREATE)) {
    abort(403, 'No autorizado');
}

// Verificar múltiples permisos (cualquiera)
if (!auth()->user()->hasAnyPermission([
    Permissions::REGISTROS_UPDATE,
    Permissions::REGISTROS_DELETE
])) {
    abort(403, 'No autorizado');
}

// Verificar múltiples permisos (todos)
if (!auth()->user()->hasAllPermissions([
    Permissions::REGISTROS_VIEW,
    Permissions::REGISTROS_CREATE
])) {
    abort(403, 'No autorizado');
}
```

### 2. En Middleware

```php
// routes/api.php
Route::middleware(['auth:sanctum', 'permission:' . Permissions::REGISTROS_CREATE])
    ->post('/registros', [RegistroController::class, 'store']);
```

### 3. En Políticas (Policies)

```php
public function update(User $user, Registro $registro)
{
    return $user->hasPermission(Permissions::REGISTROS_UPDATE);
}
```

## Uso en Frontend (Angular/Ionic)

### 1. En Componentes TypeScript

```typescript
import { AuthService } from "./services/auth.service";

export class MyComponent {
    constructor(private authService: AuthService) {}

    canCreate(): boolean {
        return this.authService.hasPermission("campanias.create");
    }

    canEdit(): boolean {
        return this.authService.hasPermission("campanias.update");
    }

    canDelete(): boolean {
        return this.authService.hasPermission("campanias.delete");
    }
}
```

### 2. En Templates HTML

```html
<!-- Mostrar botón solo si tiene permiso -->
<ion-button
    *ngIf="authService.hasPermission('campanias.create')"
    (click)="crear()"
>
    Crear Campaña
</ion-button>

<!-- Deshabilitar botón según permiso -->
<ion-button [disabled]="!authService.hasPermission('campanias.update')">
    Editar
</ion-button>

<!-- Múltiples permisos -->
<div
    *ngIf="authService.hasPermission('campanias.update') || authService.hasPermission('campanias.delete')"
>
    <ion-item-options side="end">
        <ion-item-option *ngIf="authService.hasPermission('campanias.update')"
            >Editar</ion-item-option
        >
        <ion-item-option *ngIf="authService.hasPermission('campanias.delete')"
            >Eliminar</ion-item-option
        >
    </ion-item-options>
</div>
```

### 3. En Guards

```typescript
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const permissionGuard = (requiredPermission: string) => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.hasPermission(requiredPermission)) {
      return true;
    } else {
      router.navigate(['/unauthorized']);
      return false;
    }
  };
};

// Uso en rutas
{
  path: 'campanias/nuevo',
  component: CampaniasFormPage,
  canActivate: [permissionGuard('campanias.create')]
}
```

## Comandos Útiles

### Ejecutar Seeders

```bash
# Ejecutar todos los seeders
php artisan db:seed

# Ejecutar solo PermissionsSeeder
php artisan db:seed --class=PermissionsSeeder

# Refrescar base de datos y ejecutar seeders
php artisan migrate:fresh --seed
```

### Verificar Permisos de un Usuario

```bash
php artisan tinker

# En tinker:
$user = App\Models\User::find(1);
$user->permissions; // Ver permisos directos
$user->getAllPermissions(); // Ver todos los permisos (incluye roles)
$user->hasPermission('campanias.create'); // Verificar permiso específico
```

## Mejores Prácticas

1. **Siempre usar constantes**: Usar `Permissions::CAMPANIAS_CREATE` en lugar de strings hardcodeados
2. **Validar en backend**: Nunca confiar solo en validaciones del frontend
3. **Permisos granulares**: Preferir permisos específicos sobre permisos genéricos
4. **Documentar cambios**: Actualizar este documento al agregar nuevos permisos
5. **Sincronizar backend y frontend**: Mantener los mismos nombres de permisos en ambos lados

## Agregar Nuevos Permisos

### 1. Actualizar `app/Constants/Permissions.php`

```php
// Agregar constantes
const NUEVO_RECURSO_VIEW = 'nuevo_recurso.view';
const NUEVO_RECURSO_CREATE = 'nuevo_recurso.create';
const NUEVO_RECURSO_UPDATE = 'nuevo_recurso.update';
const NUEVO_RECURSO_DELETE = 'nuevo_recurso.delete';

// Agregar al método all()
self::NUEVO_RECURSO_VIEW,
self::NUEVO_RECURSO_CREATE,
self::NUEVO_RECURSO_UPDATE,
self::NUEVO_RECURSO_DELETE,

// Agregar al método byGroup()
'nuevo_recurso' => [
    self::NUEVO_RECURSO_VIEW,
    self::NUEVO_RECURSO_CREATE,
    self::NUEVO_RECURSO_UPDATE,
    self::NUEVO_RECURSO_DELETE,
],

// Agregar al método getDescription()
self::NUEVO_RECURSO_VIEW => 'Ver nuevo recurso',
// ... etc
```

### 2. Ejecutar PermissionsSeeder

```bash
php artisan db:seed --class=PermissionsSeeder
```

### 3. Asignar a Roles

Editar `database/seeders/PermissionsSeeder.php` y agregar los nuevos permisos a los roles correspondientes.

## Troubleshooting

### Error: "Permission not found"

-   Ejecutar `php artisan db:seed --class=PermissionsSeeder`

### Usuario no tiene permisos esperados

-   Verificar que el rol tenga asignados los permisos: `$role->permissions`
-   Verificar que el usuario tenga el rol: `$user->roles`

### Frontend muestra opciones sin permisos

-   Verificar que el token incluya los permisos en el payload
-   Verificar que `AuthService.hasPermission()` esté funcionando correctamente
