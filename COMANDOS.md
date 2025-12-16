# 🛠️ Guía de Comandos - Sistema de Calibración

## 📋 Comandos de Base de Datos

### Migraciones

```bash
# Ejecutar migraciones pendientes
php artisan migrate

# Ejecutar migraciones en ambiente de producción (sin confirmación)
php artisan migrate --force

# Revertir última migración
php artisan migrate:rollback

# Revertir todas las migraciones
php artisan migrate:reset

# Refrescar BD (eliminar y recrear)
php artisan migrate:fresh

# Refrescar BD y ejecutar seeders
php artisan migrate:fresh --seed

# Ver estado de migraciones
php artisan migrate:status
```

### Seeders

```bash
# Ejecutar todos los seeders
php artisan db:seed

# Ejecutar seeder específico
php artisan db:seed --class=RolesAndPermissionsSeeder
php artisan db:seed --class=CatalogosSeeder

# Ejecutar seeders en producción (sin confirmación)
php artisan db:seed --force
```

## 👥 Gestión de Usuarios

### Comando user:manage

```bash
# Listar todos los usuarios
php artisan user:manage list

# Activar usuario por email
php artisan user:manage activate --email=juan@empresa.com

# Activar usuario por ID
php artisan user:manage activate --id=1

# Desactivar usuario
php artisan user:manage deactivate --email=juan@empresa.com

# Asignar rol a usuario
php artisan user:manage assign-role --email=juan@empresa.com --role=Supervisor

# Remover rol de usuario
php artisan user:manage remove-role --id=1 --role=Operador
```

### Ejemplos prácticos

```bash
# Ver todos los usuarios y sus roles
php artisan user:manage list

# Hacer que un usuario sea Administrador
php artisan user:manage assign-role --email=admin@empresa.com --role=Administrador

# Desactivar usuario problemático
php artisan user:manage deactivate --email=usuario@empresa.com
```

## 🔧 Comandos de Desarrollo

### Servidor de desarrollo

```bash
# Iniciar servidor (puerto 8000)
php artisan serve

# Iniciar en puerto específico
php artisan serve --port=8080

# Iniciar en host específico
php artisan serve --host=0.0.0.0 --port=8000
```

### Cache y optimización

```bash
# Limpiar caché de aplicación
php artisan cache:clear

# Limpiar caché de configuración
php artisan config:clear

# Limpiar caché de rutas
php artisan route:clear

# Limpiar caché de vistas
php artisan view:clear

# Limpiar todo el caché
php artisan optimize:clear

# Generar caché de configuración (producción)
php artisan config:cache

# Generar caché de rutas (producción)
php artisan route:cache

# Optimizar para producción
php artisan optimize
```

### Llaves y seguridad

```bash
# Generar APP_KEY
php artisan key:generate

# Generar clave de encriptación
php artisan key:generate --show
```

## 🔍 Comandos de Inspección

### Rutas

```bash
# Listar todas las rutas
php artisan route:list

# Listar rutas de API
php artisan route:list --path=api

# Listar rutas con método específico
php artisan route:list --method=GET

# Buscar ruta específica
php artisan route:list --name=registros
```

### Modelos y migraciones

```bash
# Ver información de modelo
php artisan model:show User

# Ver información de tabla
php artisan db:table users

# Ver información de BD
php artisan db:show
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
php artisan test

# Ejecutar tests con cobertura
php artisan test --coverage

# Ejecutar test específico
php artisan test --filter=UserTest

# Ejecutar tests en paralelo
php artisan test --parallel
```

## 📦 Composer

```bash
# Instalar dependencias
composer install

# Instalar sin dependencias de desarrollo
composer install --no-dev

# Actualizar dependencias
composer update

# Actualizar autoload
composer dump-autoload

# Validar composer.json
composer validate
```

## 🔐 Laravel Sanctum

```bash
# Publicar configuración de Sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

# Limpiar tokens expirados (si se configuró expiración)
php artisan sanctum:prune-expired
```

## 📊 Comandos personalizados del proyecto

### Gestión de usuarios

```bash
# Listar usuarios con roles
php artisan user:manage list

# Ejemplo: Crear usuario administrador
# 1. El usuario debe loguearse primero con Microsoft OAuth
# 2. Luego asignarle el rol desde consola:
php artisan user:manage assign-role --email=admin@vanguardfresh.pe --role=Administrador
```

## 🚀 Comandos para Producción

### Deployment checklist

```bash
# 1. Actualizar código
git pull origin main

# 2. Instalar dependencias (sin dev)
composer install --no-dev --optimize-autoloader

# 3. Ejecutar migraciones
php artisan migrate --force

# 4. Limpiar cachés
php artisan optimize:clear

# 5. Generar cachés
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 6. Optimizar
php artisan optimize

# 7. Reiniciar workers (si usas queue)
php artisan queue:restart
```

### Mantenimiento

```bash
# Activar modo mantenimiento
php artisan down

# Activar con mensaje personalizado
php artisan down --message="Sistema en mantenimiento" --retry=60

# Desactivar modo mantenimiento
php artisan up
```

## 🔄 Comandos de Queue (para futuro)

```bash
# Iniciar worker
php artisan queue:work

# Iniciar worker con reinicio automático
php artisan queue:work --tries=3

# Ver trabajos fallidos
php artisan queue:failed

# Reintentar trabajo fallido
php artisan queue:retry 1

# Limpiar trabajos fallidos
php artisan queue:flush
```

## 📝 Comandos de Logs

```bash
# Ver logs en tiempo real
tail -f storage/logs/laravel.log

# Limpiar logs antiguos (manualmente)
# Eliminar archivos en storage/logs/

# Ver últimas 100 líneas de log
tail -n 100 storage/logs/laravel.log
```

## 💡 Tips y Trucos

### Alias útiles (PowerShell)

Agrega a tu perfil de PowerShell:

```powershell
# Editar perfil
notepad $PROFILE

# Agregar estos alias:
function pa { php artisan $args }
function pas { php artisan serve $args }
function pam { php artisan migrate $args }
function pamfs { php artisan migrate:fresh --seed }

# Ahora puedes usar:
pa migrate
pas
pamfs
```

### Secuencia de desarrollo común

```bash
# Cuando trabajas en una nueva feature:
php artisan make:migration create_nueva_tabla --create=nueva_tabla
php artisan make:model NuevoModelo
php artisan make:controller Api/NuevoController --api
php artisan make:seeder NuevoSeeder

# Después de crear todo:
php artisan migrate
php artisan db:seed --class=NuevoSeeder
php artisan route:list --path=api
```

### Verificación rápida del sistema

```bash
# Ver estado general
php artisan about

# Verificar rutas API
php artisan route:list --path=api/v1

# Verificar migraciones
php artisan migrate:status

# Verificar permisos (dentro de tinker)
php artisan tinker
>>> \App\Models\Role::with('permissions')->get()
>>> \App\Models\User::with('roles')->find(1)
```

## 🔧 Troubleshooting

### Errores comunes y soluciones

```bash
# Error: "No application encryption key has been specified"
php artisan key:generate

# Error: "Class not found"
composer dump-autoload

# Error: "SQLSTATE[HY000] [2002] Connection refused"
# Verificar que MySQL esté corriendo y credenciales en .env

# Error: "419 Page Expired"
php artisan config:clear
php artisan cache:clear

# Permisos en storage y bootstrap/cache (Linux/Mac)
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

## 📖 Recursos

-   [Documentación Laravel](https://laravel.com/docs/10.x)
-   [Documentación Sanctum](https://laravel.com/docs/10.x/sanctum)
-   [Documentación Socialite](https://laravel.com/docs/10.x/socialite)
-   [Documentación Ionic](https://ionicframework.com/docs)
