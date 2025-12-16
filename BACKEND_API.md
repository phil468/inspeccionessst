# API Backend - Sistema de Calibración

## 📚 Modelos Creados

### Modelos de Catálogos

-   **Campania**: Campañas agrícolas por año
-   **Material**: Materiales e insumos
-   **Fundo**: Fundos/predios agrícolas
-   **Lote**: Lotes dentro de cada fundo
-   **Motivo**: Motivos de consumo

### Modelos del Sistema

-   **User**: Usuarios (extendido con Microsoft OAuth)
-   **Role**: Roles de usuario
-   **Permission**: Permisos granulares
-   **Registro**: Registros de consumo (con soporte offline-first)

## 🎯 Controllers API Creados

### Catálogos (CRUD Completo)

1. **CampaniaController** - `/api/v1/campanias`
2. **MaterialController** - `/api/v1/materiales`
3. **FundoController** - `/api/v1/fundos`
4. **LoteController** - `/api/v1/lotes`
5. **MotivoController** - `/api/v1/motivos`

### Registros

6. **RegistroController** - `/api/v1/registros`
    - CRUD completo
    - Filtros por fecha, estado de sincronización
    - Estadísticas del usuario

### Sincronización

7. **SyncController** - `/api/v1/sync`
    - Sincronización masiva de registros offline
    - Descarga de catálogos
    - Descarga de registros del servidor
    - Verificación de estado

## 🔐 Rutas API

### Rutas Públicas

```
GET    /api/v1/auth/microsoft           # Obtener URL para login con Microsoft
GET    /api/v1/auth/microsoft/callback  # Callback de Microsoft OAuth
```

### Rutas Protegidas (requieren token Sanctum)

#### Usuario

```
GET    /api/v1/user                     # Obtener usuario autenticado con roles/permisos
GET    /api/v1/auth/me                  # Obtener usuario autenticado (alternativa)
POST   /api/v1/auth/logout              # Cerrar sesión (revocar token actual)
POST   /api/v1/auth/logout-all          # Cerrar todas las sesiones
POST   /api/v1/auth/check-permission    # Verificar si tiene un permiso específico
```

#### Sincronización

```
POST   /api/v1/sync/registros           # Subir registros offline al servidor
GET    /api/v1/sync/catalogos           # Descargar catálogos para uso offline
GET    /api/v1/sync/registros           # Descargar registros del servidor
GET    /api/v1/sync/status              # Verificar estado de sincronización
```

#### Campañas

```
GET    /api/v1/campanias                # Listar campañas
POST   /api/v1/campanias                # Crear campaña
GET    /api/v1/campanias/{id}           # Ver campaña
PUT    /api/v1/campanias/{id}           # Actualizar campaña
DELETE /api/v1/campanias/{id}           # Eliminar campaña
```

#### Materiales

```
GET    /api/v1/materiales               # Listar materiales
POST   /api/v1/materiales               # Crear material
GET    /api/v1/materiales/{id}          # Ver material
PUT    /api/v1/materiales/{id}          # Actualizar material
DELETE /api/v1/materiales/{id}          # Eliminar material
```

#### Fundos

```
GET    /api/v1/fundos                   # Listar fundos
POST   /api/v1/fundos                   # Crear fundo
GET    /api/v1/fundos/{id}              # Ver fundo con lotes
PUT    /api/v1/fundos/{id}              # Actualizar fundo
DELETE /api/v1/fundos/{id}              # Eliminar fundo
```

#### Lotes

```
GET    /api/v1/lotes                    # Listar lotes
POST   /api/v1/lotes                    # Crear lote
GET    /api/v1/lotes/{id}               # Ver lote
PUT    /api/v1/lotes/{id}               # Actualizar lote
DELETE /api/v1/lotes/{id}               # Eliminar lote
```

#### Motivos

```
GET    /api/v1/motivos                  # Listar motivos
POST   /api/v1/motivos                  # Crear motivo
GET    /api/v1/motivos/{id}             # Ver motivo
PUT    /api/v1/motivos/{id}             # Actualizar motivo
DELETE /api/v1/motivos/{id}             # Eliminar motivo
```

#### Registros

```
GET    /api/v1/registros                # Listar registros del usuario
POST   /api/v1/registros                # Crear registro
GET    /api/v1/registros/estadisticas   # Obtener estadísticas
GET    /api/v1/registros/{id}           # Ver registro
PUT    /api/v1/registros/{id}           # Actualizar registro
DELETE /api/v1/registros/{id}           # Eliminar registro
```

## 📊 Seeders Creados

### RolesAndPermissionsSeeder

Crea roles y permisos del sistema:

**Roles:**

-   Administrador (acceso completo)
-   Supervisor (gestiona catálogos y ve todos los registros)
-   Operador (crea y ve sus propios registros)

**Permisos:**

-   `registros.*` (create, read, update, delete)
-   `campanias.manage`
-   `materiales.manage`
-   `fundos.manage`
-   `lotes.manage`
-   `motivos.manage`
-   `sync.execute`
-   `users.manage`
-   `roles.manage`

### CatalogosSeeder

Crea datos iniciales para los catálogos:

-   2 Campañas
-   5 Materiales
-   3 Fundos (cada uno con 5 lotes)
-   5 Motivos

## 🚀 Características de Sincronización Offline

### Campos Especiales en Registros

-   `local_id`: UUID generado en el cliente para identificación única
-   `synced`: Booleano que indica si está sincronizado
-   `synced_at`: Timestamp de sincronización

### Flujo de Sincronización

1. **Cliente crea registro offline:**

    - Genera `local_id` (UUID)
    - Marca `synced = false`
    - Almacena en IndexedDB

2. **Cliente sincroniza con servidor:**

    - Envía array de registros a `/api/v1/sync/registros`
    - Servidor valida y crea registros
    - Servidor responde con IDs del servidor
    - Cliente actualiza IndexedDB con `server_id` y `synced = true`

3. **Descarga de catálogos:**
    - Cliente llama `/api/v1/sync/catalogos`
    - Recibe campañas, materiales, fundos (con lotes) y motivos
    - Almacena en IndexedDB para uso offline

## 📝 Ejemplos de Uso

### Crear Registro (Online)

```json
POST /api/v1/registros
{
  "campania_id": 1,
  "material_id": 1,
  "fundo_id": 1,
  "lote_id": 1,
  "motivo_id": 1,
  "cantidad": 150.5,
  "numero_tractor": "T-001",
  "observaciones": "Aplicación normal",
  "fecha_registro": "2025-11-26T10:30:00"
}
```

### Sincronizar Registros Offline

```json
POST /api/v1/sync/registros
{
  "registros": [
    {
      "local_id": "550e8400-e29b-41d4-a716-446655440000",
      "campania_id": 1,
      "material_id": 2,
      "fundo_id": 1,
      "lote_id": 3,
      "motivo_id": 1,
      "cantidad": 200,
      "numero_tractor": "T-002",
      "observaciones": "Creado offline",
      "fecha_registro": "2025-11-26T08:00:00",
      "created_at": "2025-11-26T08:00:00",
      "updated_at": "2025-11-26T08:00:00"
    }
  ]
}
```

### Descargar Catálogos

```json
GET /api/v1/sync/catalogos

Response:
{
  "success": true,
  "data": {
    "campanias": [...],
    "materiales": [...],
    "fundos": [...],
    "motivos": [...]
  },
  "timestamp": "2025-11-26T10:00:00Z"
}
```

## 🔧 Próximos Pasos

1. ~~**Crear AuthController**~~ ✅ **Completado**

    - ✅ Login con Microsoft OAuth
    - ✅ Gestión de tokens Sanctum
    - ✅ Logout y verificación de permisos

2. ~~**Middleware de Permisos**~~ ✅ **Completado**

    - ✅ Middleware `permission:nombre_permiso`
    - ✅ Middleware `role:nombre_rol`
    - ✅ Rutas protegidas por permisos

3. **Frontend Ionic**

    - Servicios de autenticación
    - Servicios de sincronización
    - Storage con Dexie.js
    - Páginas de la aplicación

4. **Testing**
    - Tests unitarios de modelos
    - Tests de integración de API
    - Tests de sincronización offline

## 📦 Comandos Útiles

```powershell
# Ejecutar migraciones
php artisan migrate

# Ejecutar seeders
php artisan db:seed

# Ejecutar seeder específico
php artisan db:seed --class=RolesAndPermissionsSeeder
php artisan db:seed --class=CatalogosSeeder

# Refrescar BD con seeders
php artisan migrate:fresh --seed

# Iniciar servidor
php artisan serve
```

## 🎯 Estado Actual

✅ **Completado:**

-   8 Modelos con relaciones
-   7 Controllers API + AuthController
-   Rutas API versionadas (`/api/v1/`)
-   Seeders de datos iniciales
-   Sistema de roles y permisos
-   Lógica de sincronización offline-first
-   **Autenticación Microsoft OAuth + Sanctum**
-   **Middlewares de permisos y roles**

⏳ **Pendiente:**

-   Frontend Ionic
-   Testing
