# Plantilla: Aplicación Offline-First con Laravel + Ionic/Angular

## 📋 Índice

1. [Stack Tecnológico](#stack-tecnológico)
2. [Características Principales](#características-principales)
3. [Arquitectura General](#arquitectura-general)
4. [Configuración Inicial](#configuración-inicial)
5. [Patrones de Sincronización](#patrones-de-sincronización)
6. [Gestión de Conflictos](#gestión-de-conflictos)
7. [Sistema de Permisos](#sistema-de-permisos)
8. [Estructura de Archivos](#estructura-de-archivos)
9. [Checklist de Implementación](#checklist-de-implementación)

---

## Stack Tecnológico

### Backend

-   **Framework**: Laravel 10+
-   **Autenticación**: Laravel Sanctum + Microsoft OAuth
-   **Base de datos**: MySQL/PostgreSQL
-   **API**: RESTful con estructura JSON estándar

### Frontend

-   **Framework**: Ionic 8 + Angular 20
-   **Componentes**: Standalone Components
-   **Storage Local**: Dexie.js (IndexedDB wrapper)
-   **Network**: Capacitor Network API
-   **Estado**: RxJS (BehaviorSubject, Observable)

---

## Características Principales

### ✅ Offline-First

-   Funcionamiento completo sin conexión
-   Sincronización automática en background
-   Persistencia local con IndexedDB
-   Auto-sync cada 5 minutos cuando está online

### ✅ Gestión de Conflictos

-   Detección basada en timestamps (UTC)
-   "Newer timestamp wins" strategy
-   Notificaciones al usuario con detalles
-   Descarga automática de versión del servidor

### ✅ Sistema de Permisos

-   Control granular por módulo y acción
-   Roles con permisos asociados
-   Guards en rutas y botones
-   Sincronización de permisos con el backend

### ✅ Autenticación Segura

-   OAuth 2.0 con Microsoft
-   Tokens Bearer con Sanctum
-   Refresh automático
-   Manejo de sesión persistente

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Ionic/Angular)                 │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Services    │  │  Guards      │      │
│  │  - Lista     │  │  - Sync      │  │  - Auth      │      │
│  │  - Form      │  │  - Database  │  │  - Permisos  │      │
│  │  - Login     │  │  - Storage   │  └──────────────┘      │
│  └──────────────┘  │  - Network   │                         │
│                    │  - API       │                         │
│  ┌──────────────┐  └──────────────┘  ┌──────────────┐      │
│  │  IndexedDB   │                     │   Network    │      │
│  │  (Dexie)     │◄────────────────────┤   Monitor    │      │
│  └──────────────┘                     └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS/REST API
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Laravel)                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Controllers  │  │  Middleware  │  │   Models     │      │
│  │ - Sync       │  │  - Auth      │  │  - User      │      │
│  │ - API        │  │  - CORS      │  │  - Role      │      │
│  │ - Auth       │  └──────────────┘  │  - Registro  │      │
│  └──────────────┘                     └──────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │            Base de Datos (MySQL)                  │      │
│  │  - users, roles, permissions                      │      │
│  │  - registros (con local_id, synced, updated_at)  │      │
│  │  - catálogos (campanias, materiales, etc.)       │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuración Inicial

### 1. Backend Laravel

#### `config/app.php`

```php
'timezone' => 'UTC', // ⚠️ IMPORTANTE: Siempre UTC para sincronización
'locale' => 'es',
```

#### `config/cors.php`

```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['http://localhost:8100', 'capacitor://localhost'],
'supports_credentials' => true,
```

#### Migración base para registros

```php
Schema::create('registros', function (Blueprint $table) {
    $table->id();
    $table->uuid('local_id')->unique(); // UUID del cliente
    $table->foreignId('user_id')->constrained();
    // ... campos de negocio ...
    $table->boolean('synced')->default(false);
    $table->timestamp('synced_at')->nullable();
    $table->timestamps();

    $table->index(['local_id', 'synced']);
});
```

### 2. Frontend Ionic/Angular

#### `environment.ts`

```typescript
export const environment = {
    production: false,
    apiUrl: "http://localhost:8000/api",
    storage: {
        dbName: "mi-app-db",
        dbVersion: 1,
    },
    sync: {
        autoSyncInterval: 300000, // 5 minutos
    },
};
```

#### `database.service.ts` - Estructura IndexedDB

```typescript
this.version(1).stores({
    registros: "++id, local_id, user_id, synced, updated_at",
    // ... catálogos ...
});
```

---

## Patrones de Sincronización

### Flujo de Creación (Offline → Online)

```typescript
// 1. Usuario crea registro offline
const registro = {
    local_id: uuidv4(), // ✅ UUID único generado localmente
    ...formData,
    user_id: currentUser.id,
    synced: false, // ✅ Marca para sincronizar
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
};

// 2. Guardar en IndexedDB
await databaseService.saveRegistro(registro);

// 3. Auto-sync detecta pendientes
const pendientes = await db.registros
    .filter((r) => r.synced === false)
    .toArray();

// 4. Enviar al servidor
const response = await api.syncRegistros(pendientes);

// 5. Marcar como sincronizado
await db.registros.update(registro.id, {
    synced: true,
    synced_at: new Date().toISOString(),
});
```

### Flujo de Edición (con detección de conflictos)

```typescript
// 1. Usuario edita offline
const registroActualizado = {
  ...registroOriginal,
  ...formData,
  updated_at: new Date().toISOString(), // ✅ Timestamp de edición
  synced: false,
};

// 2. Backend compara timestamps
if ($clientTimestamp < $serverTimestamp) {
    // ❌ Conflicto: Cliente más antiguo
    return ['conflict' => true, ...];
}

// 3. Frontend maneja conflicto
syncService.conflicts$.subscribe(conflicts => {
  // Mostrar alerta al usuario
  // Descargar versión del servidor
});
```

---

## Gestión de Conflictos

### Backend: SyncController.php

```php
// Comparar timestamps en UTC
$updatedAtServidor = $existente->updated_at; // Carbon UTC
$updatedAtCliente = Carbon::parse($registroData['updated_at'])
    ->setTimezone('UTC');

if ($updatedAtCliente->lt($updatedAtServidor)) {
    // Rechazar actualización y reportar conflicto
    $resultados['errores'][] = [
        'local_id' => $localId,
        'server_id' => $existente->id,
        'conflict' => true,
        'message' => 'El registro en el servidor es más reciente',
        'server_updated_at' => $updatedAtServidor->toISOString(),
        'client_updated_at' => $updatedAtCliente->toISOString(),
    ];
}
```

### Frontend: SyncService.ts

```typescript
// Observable de conflictos
private conflictsSubject = new Subject<SyncConflict[]>();
public conflicts$ = this.conflictsSubject.asObservable();

// Detectar conflictos en respuesta
if (error.conflict) {
  conflicts.push({
    local_id: error.local_id,
    message: error.message,
    server_updated_at: error.server_updated_at,
    client_updated_at: error.client_updated_at,
  });

  // Descargar versión actualizada
  await downloadAndUpdateConflictedRegistro(error.local_id);
}

// Emitir para que UI lo maneje
this.conflictsSubject.next(conflicts);
```

### UI: AppComponent.ts

```typescript
// Escuchar conflictos globalmente
syncService.conflicts$.subscribe(async (conflicts) => {
    const alert = await alertController.create({
        header: "⚠️ Conflicto de Sincronización",
        message: `${conflicts.length} registro(s) fueron actualizados 
              por otro usuario. Se ha descargado la versión más reciente.`,
        buttons: ["Entendido"],
    });
    await alert.present();
});
```

---

## Sistema de Permisos

### Backend: Seeders

```php
// RolesPermissionsSeeder.php
$permissions = [
    // Registros
    'registros.view' => 'Ver registros',
    'registros.create' => 'Crear registros',
    'registros.edit' => 'Editar registros',
    'registros.delete' => 'Eliminar registros',

    // Administración
    'users.manage' => 'Gestionar usuarios',
    'roles.manage' => 'Gestionar roles',
];

// Roles predefinidos
$admin = Role::create(['name' => 'Administrador']);
$admin->permissions()->attach($allPermissions);

$operador = Role::create(['name' => 'Operador de Campo']);
$operador->permissions()->attach($registrosPermissions);
```

### Frontend: AuthService

```typescript
hasPermission(permission: string): boolean {
  const user = this.currentUserSubject.value;
  if (!user || !user.roles) return false;

  return user.roles.some((role: any) =>
    role.permissions?.some((p: any) => p.name === permission)
  );
}
```

### Guards y Directivas

```typescript
// En componentes
*ngIf="authService.hasPermission('registros.create')"

// En rutas
{
  path: 'admin',
  canActivate: [PermissionGuard],
  data: { permission: 'admin.access' }
}
```

---

## Estructura de Archivos

### Backend Laravel

```
app/
├── Http/
│   ├── Controllers/Api/
│   │   ├── SyncController.php      ← Sincronización bidireccional
│   │   ├── RegistroController.php  ← CRUD estándar
│   │   └── AuthController.php      ← OAuth + Sanctum
│   └── Middleware/
│       └── CheckPermission.php
├── Models/
│   ├── User.php                     ← Relación roles/permisos
│   ├── Registro.php                 ← local_id, synced
│   └── Role.php
database/
├── migrations/
│   ├── xxxx_create_registros_table.php
│   └── xxxx_create_roles_permissions.php
└── seeders/
    └── RolesPermissionsSeeder.php
```

### Frontend Ionic/Angular

```
src/app/
├── services/
│   ├── sync.service.ts          ← Auto-sync, conflictos
│   ├── database.service.ts      ← Dexie wrapper
│   ├── storage.service.ts       ← CRUD IndexedDB
│   ├── network.service.ts       ← Capacitor Network
│   ├── api.service.ts           ← HTTP calls
│   └── auth.service.ts          ← Autenticación
├── pages/
│   ├── registro-lista/          ← Lista con sync status
│   ├── registro-form/           ← Create/Edit offline
│   ├── login/
│   └── auth-callback/
├── guards/
│   ├── auth.guard.ts
│   └── permission.guard.ts
├── models/
│   ├── registro.model.ts
│   └── usuario.model.ts
└── app.component.ts             ← Listener de conflictos
```

---

## Checklist de Implementación

### Backend Setup

-   [ ] Configurar `timezone => 'UTC'` en `config/app.php`
-   [ ] Instalar Laravel Sanctum
-   [ ] Crear migraciones con `local_id`, `synced`, `synced_at`
-   [ ] Implementar SyncController con detección de conflictos
-   [ ] Crear seeder de roles y permisos
-   [ ] Configurar CORS para Capacitor
-   [ ] Agregar OAuth provider (Microsoft/Google/etc)

### Frontend Setup

-   [ ] Instalar Dexie.js: `npm install dexie`
-   [ ] Instalar Capacitor Network: `npm install @capacitor/network`
-   [ ] Configurar DatabaseService con tablas IndexedDB
-   [ ] Implementar SyncService con auto-sync
-   [ ] Crear StorageService para CRUD local
-   [ ] Agregar NetworkService con observables
-   [ ] Implementar AuthService con permisos
-   [ ] Configurar guards de autenticación y permisos

### Funcionalidades Offline

-   [ ] CRUD completo funciona sin conexión
-   [ ] Auto-sync cada 5 minutos cuando online
-   [ ] Indicadores visuales de estado de sync
-   [ ] Manejo de errores de red
-   [ ] Reintentos automáticos

### Gestión de Conflictos

-   [ ] Backend compara timestamps en UTC
-   [ ] Frontend recibe y procesa conflictos
-   [ ] UI muestra alertas al usuario
-   [ ] Descarga automática de versión del servidor
-   [ ] Logs detallados en consola

### Sistema de Permisos

-   [ ] Seeder con roles predefinidos
-   [ ] Middleware de permisos en backend
-   [ ] Guards en rutas frontend
-   [ ] Directivas \*ngIf para botones
-   [ ] Página de gestión de usuarios/roles

### Testing

-   [ ] Probar creación offline → online
-   [ ] Probar edición offline → conflicto
-   [ ] Probar sincronización con múltiples clientes
-   [ ] Probar pérdida de conexión durante operaciones
-   [ ] Verificar timestamps en UTC

---

## Mejores Prácticas

### 🔒 Seguridad

1. Siempre validar permisos en backend (nunca confiar en frontend)
2. Usar tokens Bearer con expiración
3. Sanitizar inputs antes de guardar
4. Implementar rate limiting en endpoints de sync

### ⚡ Performance

1. Usar `bulkPut()` para inserciones masivas en IndexedDB
2. Limitar auto-sync a registros pendientes solamente
3. Implementar paginación en descargas grandes
4. Usar lazy loading para módulos pesados

### 🎯 UX

1. Mostrar indicadores visuales de estado de sync (iconos, badges)
2. Permitir operaciones offline sin bloquear UI
3. Notificar conflictos de forma clara y no intrusiva
4. Confirmar antes de descartar cambios locales

### 🛠️ Mantenimiento

1. Versionear esquema de IndexedDB para migraciones
2. Logs estructurados con timestamps
3. Monitorear tasa de conflictos
4. Documentar decisiones de resolución de conflictos

---

## Ejemplo Completo: Crear Nuevo Módulo

### 1. Backend - Migración

```php
Schema::create('productos', function (Blueprint $table) {
    $table->id();
    $table->uuid('local_id')->unique();
    $table->foreignId('user_id')->constrained();
    $table->string('nombre');
    $table->decimal('precio', 10, 2);
    $table->boolean('synced')->default(false);
    $table->timestamp('synced_at')->nullable();
    $table->timestamps();
});
```

### 2. Backend - Modelo

```php
class Producto extends Model {
    protected $fillable = [
        'local_id', 'user_id', 'nombre', 'precio',
        'synced', 'synced_at'
    ];

    protected $casts = [
        'synced' => 'boolean',
        'synced_at' => 'datetime',
    ];
}
```

### 3. Frontend - Modelo

```typescript
export interface Producto {
    id?: number;
    local_id: string;
    nombre: string;
    precio: number;
    synced: boolean;
    created_at?: string;
    updated_at?: string;
}
```

### 4. Frontend - IndexedDB

```typescript
// database.service.ts
this.version(1).stores({
    productos: "++id, local_id, user_id, synced, updated_at",
});
```

### 5. Frontend - Service

```typescript
// producto.service.ts
async saveProducto(producto: Producto): Promise<void> {
  producto.local_id = producto.local_id || uuidv4();
  producto.synced = false;
  producto.updated_at = new Date().toISOString();

  await this.db.productos.put(producto);

  if (this.networkService.isOnline) {
    await this.syncService.syncProductos();
  }
}
```

---

## Recursos Adicionales

### Documentación

-   [Dexie.js](https://dexie.org/) - IndexedDB wrapper
-   [Capacitor Network](https://capacitorjs.com/docs/apis/network)
-   [Laravel Sanctum](https://laravel.com/docs/sanctum)
-   [Ionic Framework](https://ionicframework.com/docs)

### Consideraciones Futuras

-   **Sync incremental**: Solo descargar cambios desde última sincronización
-   **Compresión**: Comprimir payloads grandes con gzip
-   **WebSockets**: Notificaciones push de cambios en tiempo real
-   **Versionado de API**: `/api/v1/`, `/api/v2/` para cambios breaking
-   **Soft deletes**: Marcar como eliminado en lugar de borrar físicamente

---

## Licencia y Créditos

Esta plantilla implementa patrones industry-standard para aplicaciones offline-first:

-   Conflict-free Replicated Data Types (CRDT) principles
-   Event sourcing patterns
-   Optimistic UI updates
-   Last-write-wins conflict resolution

**Autor**: Sistema de Calibración Agrícola - Diciembre 2025

---

## Soporte

Para consultas sobre esta arquitectura:

1. Revisar logs de sincronización en consola del navegador
2. Verificar timestamps en UTC en base de datos
3. Confirmar que IndexedDB tiene datos locales
4. Validar permisos del usuario actual

**Happy Coding! 🚀**
