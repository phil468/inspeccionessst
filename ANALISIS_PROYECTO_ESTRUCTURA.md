# Analisis del Proyecto Inspecciones SST

Fecha de analisis: 18-05-2026

## 1) Que hace este proyecto

Este sistema implementa una plataforma de inspecciones SST (Seguridad y Salud en el Trabajo) con enfoque offline-first.

Objetivos funcionales principales:

- Gestionar inspecciones con resultados, evidencias fotograficas y seguimiento.
- Operar sin conexion y sincronizar despues con el backend.
- Administrar catalogos operativos (campanias, fundos, empresas, areas, cargos, personal).
- Controlar acceso por roles y permisos.
- Enviar notificaciones por email y push a usuarios relacionados con inspecciones.

## 2) Arquitectura general

Arquitectura en dos capas:

- Backend API: Laravel 10 + Sanctum + Socialite Microsoft OAuth.
- Frontend App: Ionic 8 + Angular 20 + Capacitor + Dexie (IndexedDB).

Patron clave:

- Offline-first real: el frontend guarda primero localmente (IndexedDB), marca estado de sincronizacion y luego sube/corrige contra API cuando hay red.

## 3) Estructura del repositorio

### Raiz del proyecto

- `app/`: logica principal backend Laravel.
- `routes/`: rutas API y web.
- `database/`: migraciones y seeders.
- `frontend/`: app Ionic/Angular.
- `docs` y `*.md`: guias tecnicas, despliegue y funcionales.

### Backend (Laravel)

Carpetas y componentes mas relevantes:

- `app/Http/Controllers/Api/`
    - Controladores de autenticacion, sincronizacion, inspecciones, catalogos, usuarios/roles y push.
    - Ejemplos: `AuthController`, `SyncController`, `InspeccionController`, `PushNotificationController`, `FotoApprovalController`.

- `app/Models/`
    - Modelos de dominio para inspecciones SST y catalogos.
    - Incluye pivotes/relaciones para inspeccion-areas, inspectores, responsables, resultados y tokens push.

- `app/Services/`
    - Servicios de negocio y de integracion:
        - `NotificationService`
        - `PushNotificationService`
        - `PersonalSyncService`
        - `ExternalApiAuthService`

- `routes/api.php`
    - Versionado `v1`.
    - Rutas publicas: login credenciales + OAuth Microsoft callback.
    - Rutas protegidas con `auth:sanctum` para CRUD, sync, upload, notificaciones y administracion.

- `database/migrations/`
    - Evolucion amplia del dominio (usuarios, roles/permisos, registros, inspecciones, resultados, foto approval, push tokens, logs de notificaciones).

### Frontend (Ionic + Angular)

Carpetas y piezas clave:

- `frontend/src/app/app.routes.ts`
    - Rutas con lazy loading por pagina.
    - Modulos/paginas: login, inspecciones, personal, usuarios, roles, empresas, areas, cargos, registros, mantenimiento.

- `frontend/src/app/services/`
    - `auth.service.ts`: sesion, token, permisos, roles.
    - `api.service.ts`: cliente HTTP a endpoints backend.
    - `database.service.ts`: esquema Dexie/IndexedDB y acceso local.
    - `sync.service.ts`: sincronizacion offline/online y estado de pendientes.
    - `network.service.ts`: estado de conectividad.
    - `push-notification.service.ts`: registro y manejo de push via Capacitor.

- `frontend/src/app/models/`
    - Tipos de dominio para inspecciones, resultados, pivotes y registros.

- `frontend/src/app/pages/`
    - UI operacional: listas, formularios, detalle y flujos de inspecciones por rol.

## 4) Flujo tecnico principal

1. Usuario inicia sesion (credenciales o Microsoft OAuth).
2. Frontend persiste token/usuario y habilita guards por autenticacion y permisos.
3. Datos de trabajo se cargan primero desde IndexedDB (respuesta rapida).
4. Si hay conectividad, `sync.service` sincroniza cambios pendientes con endpoints `sync/*`.
5. El backend valida, persiste y devuelve estado de sincronizacion.
6. En eventos de inspeccion, se disparan notificaciones (email/push) segun responsables/roles.

## 5) Seguridad y control de acceso

- Autenticacion API con Laravel Sanctum.
- OAuth Microsoft soportado para login corporativo.
- Middleware de permisos por modulo/accion en rutas protegidas.
- Frontend aplica control adicional con guards y chequeo de permisos en menu/paginas.

## 6) Soporte offline-first

Implementacion observada:

- IndexedDB con Dexie como almacenamiento local principal.
- Entidades con `local_id`, `synced` y timestamps para control de estado.
- Sincronizacion bidireccional para registros e inspecciones.
- Manejo de conflictos y estado de conectividad en UI.

## 7) Notificaciones y aprobaciones

- Push notifications con FCM (registro y desactivacion de tokens por usuario/dispositivo).
- Endpoints dedicados en `push-notifications/*`.
- Flujo de aprobacion de fotos inicial/final en resultados de inspeccion.

## 8) Tecnologias detectadas

Backend:

- PHP 8.1
- Laravel 10
- Sanctum
- Socialite + proveedor Microsoft

Frontend:

- Angular 20
- Ionic 8
- Capacitor 7
- Dexie 4
- RxJS 7

## 9) Observaciones importantes

- El repositorio contiene documentacion historica de "calibracion" y documentacion actual de "inspecciones SST".
- El codigo activo (rutas, modelos y frontend) confirma que el foco actual es Inspecciones SST con capacidades offline-first y notificaciones.
- Hay una base madura para operacion en campo con baja conectividad.

## 10) Conclusion

El proyecto es una plataforma empresarial completa para inspecciones SST, con backend robusto en Laravel y frontend movil/web en Ionic-Angular, optimizada para uso offline, sincronizacion progresiva, control de permisos y trazabilidad mediante notificaciones y aprobaciones.
