# 📱 Sistema de Calibración Offline-First

Sistema de registro de calibración agrícola con capacidades offline-first, desarrollado con Laravel 10 + Ionic 7/Angular.

## 🎯 Características Principales

-   **Offline-First**: Funciona completamente sin conexión a internet
-   **Sincronización Inteligente**: Sincronización automática y manual de datos
-   **Autenticación Microsoft**: Login con cuenta corporativa Microsoft
-   **Sistema de Permisos**: Control granular de acceso por roles
-   **API RESTful**: Backend Laravel con Sanctum
-   **Multi-plataforma**: Web, iOS y Android con Ionic/Capacitor

## 📚 Documentación

-   [📖 Guía de Instalación](INSTALACION.md)
-   [🔐 API de Autenticación](AUTH_API.md)
-   [📡 API Backend](BACKEND_API.md)
-   [💬 Contexto del Proyecto](CONTEXTO_CONVERSACION.md)

## 🚀 Inicio Rápido

### Requisitos Previos

-   PHP 8.1+
-   Composer
-   MySQL 5.7+
-   Node.js 18+
-   Ionic CLI

### Instalación Backend

```bash
# Clonar repositorio
cd c:\laragon\www\calibracion

# Instalar dependencias
composer install

# Configurar entorno
cp .env.example .env
php artisan key:generate

# Crear base de datos 'calibracion' en MySQL

# Ejecutar migraciones y seeders
php artisan migrate --seed

# Iniciar servidor
php artisan serve
```

### Instalación Frontend

```bash
cd c:\laragon\www\calibracion\frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
ionic serve
```

## 🏗️ Arquitectura

### Backend (Laravel 10)

-   **Modelos**: 8 modelos con relaciones Eloquent
-   **Controllers**: 8 controllers API RESTful
-   **Autenticación**: Microsoft OAuth + Laravel Sanctum
-   **Base de Datos**: MySQL con 11 tablas

### Frontend (Ionic 7 + Angular)

-   **Arquitectura**: Standalone Components
-   **Storage**: IndexedDB con Dexie.js
-   **State Management**: RxJS + BehaviorSubject
-   **Networking**: Capacitor Network API

## 📊 Modelos de Datos

-   **Campania**: Campañas agrícolas
-   **Material**: Materiales e insumos
-   **Fundo**: Fundos/predios
-   **Lote**: Lotes por fundo
-   **Motivo**: Motivos de consumo
-   **Registro**: Registros de calibración (offline-first)
-   **Role**: Roles de usuario
-   **Permission**: Permisos granulares
-   **User**: Usuarios del sistema

## 🔐 Autenticación

El sistema utiliza **Microsoft OAuth 2.0** para autenticación y **Laravel Sanctum** para gestión de tokens API.

### Flujo de Login

1. Usuario solicita URL de Microsoft OAuth
2. Redirige a Microsoft para autenticarse
3. Callback con código de autorización
4. Backend crea/actualiza usuario y emite token
5. Frontend guarda token para peticiones posteriores

Ver [AUTH_API.md](AUTH_API.md) para detalles completos.

## 🛡️ Sistema de Permisos

### Roles Predefinidos

-   **Administrador**: Acceso completo
-   **Supervisor**: Gestión de catálogos y registros
-   **Operador**: Creación y visualización de registros propios

### Permisos Granulares

-   `registros.*` (create, read, update, delete)
-   `campanias.manage`, `materiales.manage`, `fundos.manage`, `lotes.manage`, `motivos.manage`
-   `sync.execute`
-   `users.manage`, `roles.manage`

## 🔄 Sincronización Offline

### Características

-   **UUID local**: Cada registro tiene un `local_id` único
-   **Flag de sincronización**: Campo `synced` indica estado
-   **Sincronización masiva**: Envío de múltiples registros en una petición
-   **Descarga de catálogos**: Obtención de datos maestros para uso offline
-   **Resolución de conflictos**: Prevención de duplicados por `local_id`

### Endpoints de Sincronización

```
POST   /api/v1/sync/registros      # Subir registros offline
GET    /api/v1/sync/catalogos      # Descargar catálogos
GET    /api/v1/sync/registros      # Descargar registros del servidor
GET    /api/v1/sync/status         # Estado de sincronización
```

## 📡 API Endpoints

### Autenticación

-   `GET /api/v1/auth/microsoft` - Login con Microsoft
-   `GET /api/v1/auth/microsoft/callback` - Callback OAuth
-   `POST /api/v1/auth/logout` - Cerrar sesión
-   `GET /api/v1/auth/me` - Usuario actual

### Catálogos (CRUD)

-   `/api/v1/campanias`
-   `/api/v1/materiales`
-   `/api/v1/fundos`
-   `/api/v1/lotes`
-   `/api/v1/motivos`

### Registros

-   `GET /api/v1/registros` - Listar
-   `POST /api/v1/registros` - Crear
-   `GET /api/v1/registros/{id}` - Ver
-   `PUT /api/v1/registros/{id}` - Actualizar
-   `DELETE /api/v1/registros/{id}` - Eliminar
-   `GET /api/v1/registros/estadisticas` - Estadísticas

Ver [BACKEND_API.md](BACKEND_API.md) para documentación completa.

## 🛠️ Tecnologías

### Backend

-   Laravel 10
-   Laravel Sanctum (API tokens)
-   Laravel Socialite + SocialiteProviders/Microsoft
-   MySQL 5.7+
-   PHP 8.1+

### Frontend

-   Ionic 7
-   Angular 20 (Standalone Components)
-   Capacitor 5
-   Dexie.js (IndexedDB)
-   TypeScript 5

## 📝 Variables de Entorno

```env
# Aplicación
APP_NAME="Calibración"
APP_URL=http://localhost:8000

# Base de Datos
DB_DATABASE=calibracion
DB_USERNAME=root
DB_PASSWORD=

# Microsoft OAuth
MICROSOFT_CLIENT_ID=tu_client_id
MICROSOFT_CLIENT_SECRET=tu_client_secret
MICROSOFT_REDIRECT_URI=http://localhost:8000/api/v1/auth/microsoft/callback

# Frontend
FRONTEND_URL=http://localhost:8100

# Sanctum
SANCTUM_STATEFUL_DOMAINS=localhost:8100,localhost:4200
SESSION_DOMAIN=localhost
```

## 🧪 Testing

```bash
# Tests backend
php artisan test

# Tests frontend
cd frontend
npm run test
```

## 📦 Comandos Útiles

```bash
# Backend
php artisan migrate:fresh --seed  # Resetear BD con datos
php artisan db:seed               # Solo ejecutar seeders
php artisan serve                 # Iniciar servidor

# Frontend
ionic serve                       # Servidor desarrollo
ionic build                       # Compilar producción
npx cap sync                      # Sincronizar con Capacitor
npx cap open android             # Abrir Android Studio
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Proyecto privado - Vanguard Fresh

## 👥 Equipo

-   **Desarrollo**: Equipo de Desarrollo Vanguard Fresh
-   **Contacto**: dev@vanguardfresh.pe

## 📅 Estado del Proyecto

**Versión**: 1.0.0  
**Última actualización**: 27 de Noviembre 2025  
**Estado**: ✅ Backend y Frontend completados - Listo para testing

### Completado ✅

-   [x] Migraciones de base de datos
-   [x] Modelos con relaciones
-   [x] Controllers API
-   [x] Autenticación Microsoft OAuth
-   [x] Sistema de permisos
-   [x] Sincronización offline
-   [x] Seeders de datos iniciales
-   [x] Frontend Ionic/Angular
-   [x] Servicios de sincronización
-   [x] Storage offline (IndexedDB con Dexie)
-   [x] Páginas de la aplicación (Login, Home, Registro Form, Registro Lista)
-   [x] Guards y interceptors
-   [x] Routing configurado

### Pendiente ⏳

-   [ ] Tests unitarios
-   [ ] Tests de integración
-   [ ] Testing end-to-end completo
-   [ ] Documentación de usuario
-   [ ] Despliegue en producción
