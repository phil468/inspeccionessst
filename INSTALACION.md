# Guía de Instalación - Aplicación de Calibración

## 📋 Proyecto Creado

**Backend:** Laravel 10 con Sanctum y Socialite  
**Frontend:** Ionic 7 + Angular (Standalone Components)  
**Arquitectura:** Offline-First con sincronización híbrida

---

## ✅ Pasos Completados

### Backend:

-   ✅ Proyecto Laravel creado en `c:\laragon\www\calibracion`
-   ✅ Instalado: `laravel/socialite`, `socialiteproviders/microsoft`, `laravel/sanctum`
-   ✅ **11 Migraciones creadas y ejecutadas**
-   ✅ **8 Modelos** con relaciones Eloquent
-   ✅ **10 Controllers API** (CRUD + Auth + Sync + Admin)
-   ✅ **Autenticación Microsoft OAuth + Sanctum**
-   ✅ **Sistema de roles y permisos** (3 roles, 12 permisos)
-   ✅ **Middlewares** de autorización (permission, role)
-   ✅ **Seeders** ejecutados (roles, permisos, catálogos)
-   ✅ **Helpers y comandos** de gestión
-   ✅ **Documentación completa** (6 archivos MD)

### Frontend:

-   ✅ Proyecto Ionic creado en `c:\laragon\www\calibracion\frontend`
-   ✅ **Configuración environment.ts** (apiUrl, sync, storage)
-   ✅ **Modelos TypeScript** creados (User, Catalogo, Registro, API)
-   ✅ **5 Servicios** creados:
    -   `DatabaseService` (Dexie.js para IndexedDB)
    -   `ApiService` (HTTP calls al backend)
    -   `AuthService` (gestión de autenticación)
    -   `StorageService` (CRUD local con Dexie)
    -   `SyncService` (sincronización offline-first)
-   ✅ **AuthInterceptor** (agregar token automáticamente)
-   ✅ **AuthGuard** (protección de rutas)
-   ✅ **PermissionGuard** (control de permisos granular)
-   ✅ **Páginas creadas:**
    -   `LoginPage` (autenticación Microsoft OAuth)
    -   `HomePage` (dashboard con navegación y estado de sync)
    -   `RegistroFormPage` (formulario de nuevo registro)
    -   `RegistroListaPage` (historial con búsqueda y sincronización)
-   ✅ **Routing configurado** en app.routes.ts con guards
-   ⏳ Instalar dependencias npm (dexie, @capacitor/network, uuid)
-   ⏳ Configurar providers en app.config.ts
-   ⏳ Probar flujo completo end-to-end

---

## 🚀 Pasos Pendientes

### 1. Configurar Base de Datos (si no está creada)

Crear base de datos MySQL:

### 1. Configurar Base de Datos (si no está creada)

Crear base de datos MySQL:

```sql
CREATE DATABASE calibracion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configurar Variables de Entorno Backend

Edita `c:\laragon\www\calibracion\.env`:

```env
APP_NAME="Calibración"
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=calibracion
DB_USERNAME=root
DB_PASSWORD=

# Microsoft OAuth (usa las mismas credenciales de jabas_parihuelas)
MICROSOFT_CLIENT_ID=tu_client_id
MICROSOFT_CLIENT_SECRET=tu_client_secret
MICROSOFT_REDIRECT_URI=http://localhost:8000/api/v1/auth/microsoft/callback

FRONTEND_URL=http://localhost:8100

SANCTUM_STATEFUL_DOMAINS=localhost:8100
SESSION_DOMAIN=localhost
```

### 3. Crear Base de Datos

```sql
-- En MySQL (phpMyAdmin o consola)
CREATE DATABASE calibracion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Ejecutar Migraciones

```powershell
cd c:\laragon\www\calibracion
php artisan migrate
```

### 5. Configurar CORS

Edita `config/cors.php`:

```php
'paths' => ['api/*', 'sanctum/csrf-cookie', 'api/v1/*'],
'supports_credentials' => true,
```

### 6. Publicar Configuración de Sanctum

```powershell
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

---

## 📂 Estructura del Proyecto

```
calibracion/
├── backend/                  # Laravel API
│   ├── app/
│   │   ├── Models/          # Modelos (por crear)
│   │   ├── Http/
│   │   │   └── Controllers/
│   │   │       └── Api/     # Controladores API (por crear)
│   │   └── Services/        # Servicios (por crear)
│   ├── database/
│   │   └── migrations/      # ✅ 11 migraciones creadas
│   └── routes/
│       └── api.php          # Rutas API (por configurar)
│
└── frontend/                 # Ionic Angular
    ├── src/
    │   ├── app/
    │   │   ├── pages/       # Páginas (por crear)
    │   │   ├── services/    # Servicios (por crear)
    │   │   └── guards/      # Guards (por crear)
    │   └── environments/    # Variables de entorno
    └── capacitor.config.ts  # Configuración Capacitor
```

---

## 🎯 Próximos Pasos de Desarrollo

### Fase 1: Backend API (En progreso)

-   [ ] Crear modelos con relaciones
-   [ ] Crear controllers con CRUD
-   [ ] Crear AuthController (copiar de jabas_parihuelas)
-   [ ] Crear SyncController para sincronización offline
-   [ ] Configurar rutas API versionadas

### Fase 2: Frontend Base ✅ COMPLETADA

-   ✅ Instalar dependencias offline (Dexie.js, @capacitor/network)
-   ✅ Configurar environment.ts
-   ✅ Crear servicio de autenticación (AuthService)
-   ✅ Crear servicio de sincronización (SyncService)
-   ✅ Crear servicio de storage local (StorageService)
-   ✅ Crear servicio de base de datos (DatabaseService)
-   ✅ Crear servicio de API (ApiService)
-   ✅ Crear interceptor HTTP (AuthInterceptor)
-   ✅ Crear guard de autenticación (AuthGuard)

### Fase 3: Páginas Principales ✅ COMPLETADA

-   ✅ Login page (Microsoft OAuth con redirección)
-   ✅ Home/Dashboard (navegación, info usuario, estado sync)
-   ✅ Formulario de registro (RegistroFormPage con validación)
-   ✅ Lista de historial (RegistroListaPage con búsqueda y refresh)
-   ✅ Configuración de routing con guards

### Fase 4: Instalación de Dependencias (PENDIENTE)

-   [ ] Instalar Dexie.js: `npm install dexie`
-   [ ] Instalar @capacitor/network: `npm install @capacitor/network`
-   [ ] Instalar uuid: `npm install uuid @types/uuid`
-   [ ] Configurar providers en app.config.ts
-   [ ] Probar conexión con backend Laravel

### Fase 5: Sistema de Permisos ✅ COMPLETADA

-   ✅ Middleware de permisos (backend)
-   ✅ Guards en Angular (AuthGuard, PermissionGuard)
-   ✅ Validación en componentes con hasPermission()
-   [ ] Directivas para ocultar/mostrar según permisos (opcional)

### Fase 5: Offline-First (EN PROGRESO)

-   ✅ IndexedDB schema (DatabaseService con Dexie)
-   ✅ Queue de sincronización (SyncService)
-   ✅ Indicadores de estado de red (chips en UI)
-   ✅ Guardado local con UUID (local_id)
-   [ ] Resolución de conflictos (timestamp comparison)
-   [ ] Background sync con @capacitor/network
-   [ ] Testing de escenarios offline/online

---

## 🔧 Comandos Útiles

```powershell
# Backend
cd c:\laragon\www\calibracion
php artisan serve                    # Iniciar servidor (localhost:8000)
php artisan migrate                  # Ejecutar migraciones
php artisan db:seed                  # Ejecutar seeders
php artisan make:model NombreModelo  # Crear modelo
php artisan make:controller Api/NombreController --api

# Frontend
cd c:\laragon\www\calibracion\frontend
ionic serve                          # Servidor desarrollo (localhost:8100)
ionic build                          # Compilar para producción
npx cap sync                         # Sincronizar con Capacitor
npx cap open android                 # Abrir en Android Studio
```

---

## 📊 Esquema de Sincronización Offline-First

### Flujo de Datos:

```
┌─────────────────┐
│   Usuario       │
│   crea/edita    │
│   registro      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  IndexedDB (Local)      │
│  • Almacena registro    │
│  • Marca como pending   │
│  • Genera UUID local    │
└────────┬────────────────┘
         │
         ▼
    ┌────────┐
    │ Online?│
    └───┬─┬──┘
   No   │ │   Sí
        │ │
        │ └──────────────┐
        │                ▼
        │    ┌───────────────────────┐
        │    │ POST a /api/v1/sync   │
        │    │ • Envía registros     │
        │    │ • Recibe IDs servidor │
        │    └──────────┬────────────┘
        │               │
        │               ▼
        │    ┌───────────────────────┐
        │    │ Actualiza IndexedDB   │
        │    │ • Marca como synced   │
        │    │ • Guarda server_id    │
        │    └───────────────────────┘
        │
        └──────> Queda en cola
                 (sync automático
                 cuando haya red)
```

### Campos Críticos para Sincronización:

```typescript
interface Registro {
    id?: number; // ID del servidor (null si no sincronizado)
    local_id: string; // UUID generado localmente
    synced: boolean; // true si ya está en el servidor
    synced_at?: Date; // Timestamp de sincronización
    updated_at: Date; // Para detectar conflictos
    // ... campos del registro
}
```

---

## 🎨 Diseño de la Interfaz

Según las capturas proporcionadas:

### Home Page:

-   Card: "CREAR REGISTRO" → `/registro-form`
-   Card: "HISTORIAL" → `/registro-lista`
-   Card: "FORMATO DE CALIBRACIÓN" (futuro)
-   Card: "VALIDACIÓN CON LA CALCULADORA" (futuro)

### Formulario de Registro:

-   Select: Campaña
-   Select searchable: Material
-   Input number: Cantidad
-   Select: Fundo
-   Select: Lote
-   Select: Motivo
-   Input number: Número Tractor
-   Textarea: Observaciones
-   Botón: "Grabar"

### Historial:

-   Buscador
-   Lista de registros agrupados por fecha
-   Cada item muestra: Material, Cantidad, Fecha
-   Click → Ver detalle

---

## 📝 Notas Importantes

1. **Sincronización Híbrida:**

    - Manual: Botón en toolbar "Sincronizar"
    - Automática: Cada 5 minutos si hay red
    - Background: Al abrir la app

2. **Permisos Granulares:**

    - `registros.create`, `registros.read`, `registros.update`, `registros.delete`
    - `campanias.manage`, `materiales.manage`, `fundos.manage`, etc.
    - `sync.execute` para poder sincronizar

3. **Reutilizar de jabas_parihuelas:**
    - AuthController completo
    - AuthService (frontend)
    - Login page
    - Configuración de Microsoft OAuth

---

**Estado Actual:** ✅ Backend completo, Frontend páginas principales creadas

**Siguiente Paso:** Instalar dependencias npm (ver DEPENDENCIAS_PENDIENTES.md) y probar flujo completo
