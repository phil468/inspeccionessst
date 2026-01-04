# 🚀 Guía de Despliegue a Producción - Inspecciones SST

## 📋 Pre-requisitos

### Servidor Requerido

- **PHP**: 8.2 o superior
- **MySQL**: 8.0 o superior
- **Node.js**: 20.19+
- **Composer**: 2.x
- **Servidor web**: Apache o Nginx
- **SSL**: Certificado SSL válido
- **Redis**: (Opcional pero recomendado para cache)

---

## 1️⃣ BACKEND (Laravel API)

### Paso 1: Preparar el servidor

```bash
# Instalar dependencias del sistema (Ubuntu/Debian)
sudo apt update
sudo apt install php8.2 php8.2-fpm php8.2-mysql php8.2-mbstring php8.2-xml php8.2-curl php8.2-zip php8.2-gd php8.2-intl
sudo apt install mysql-server nginx composer redis-server
```

### Paso 2: Subir el código

```bash
# En tu servidor
cd /var/www/
git clone https://github.com/tu-usuario/inspeccionessst.git
cd inspeccionessst
```

### Paso 3: Configurar el .env de producción

```bash
cp .env.example .env
nano .env
```

**Configuración de producción (.env):**

```env
APP_NAME="Inspecciones SST"
APP_ENV=production
APP_KEY=  # Se generará con php artisan key:generate
APP_DEBUG=false  # ⚠️ IMPORTANTE: false en producción
APP_URL=https://api.tudominio.com

FRONTEND_URL=https://app.tudominio.com

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=inspeccionessst_prod
DB_USERNAME=tu_usuario_mysql
DB_PASSWORD=tu_contraseña_segura

BROADCAST_DRIVER=log
CACHE_DRIVER=redis
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database
SESSION_DRIVER=redis
SESSION_LIFETIME=120

# Redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Mail (configurar para notificaciones reales)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tu-email@gmail.com
MAIL_PASSWORD=tu-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@tudominio.com
MAIL_FROM_NAME="${APP_NAME}"

# Sanctum
SANCTUM_STATEFUL_DOMAINS=app.tudominio.com
SESSION_DOMAIN=.tudominio.com

# CORS
CORS_ALLOWED_ORIGINS=https://app.tudominio.com
```

### Paso 4: Instalar dependencias y configurar

```bash
cd /var/www/inspeccionessst

##tal vez sea necesario:
sudo chown -R john.delacruz:john.delacruz /var/www/inspeccionessst

git config --global --add safe.directory /var/www/inspeccionessst

# Instalar dependencias de Composer (sin dev)
composer install --optimize-autoloader --no-dev

# Generar clave de aplicación
php artisan key:generate

# Crear base de datos
mysql -u root -p
CREATE DATABASE inspeccionessst_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'inspeccionessst_user'@'localhost' IDENTIFIED BY 'contraseña_segura';
GRANT ALL PRIVILEGES ON inspeccionessst_prod.* TO 'inspeccionessst_user'@'localhost';
FLUSH PRIVILEGES;
exit;

# Ejecutar migraciones
php artisan migrate --force

# Ejecutar seeders (roles, permisos, datos iniciales)
php artisan db:seed --force

# Crear enlace simbólico para storage
php artisan storage:link

# Optimizar para producción
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

### Paso 5: Configurar permisos

```bash
# Dar permisos correctos
sudo chown -R www-data:www-data /var/www/inspeccionessst
sudo chmod -R 755 /var/www/inspeccionessst
sudo chmod -R 775 /var/www/inspeccionessst/storage
sudo chmod -R 775 /var/www/inspeccionessst/bootstrap/cache
```

### Paso 6: Configurar Nginx

Crear archivo `/etc/nginx/sites-available/inspeccionessst-api`:

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    listen 80;
    listen [::]:80;
    server_name api.tudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.tudominio.com;
    root /var/www/inspeccionessst/public;

    # SSL
    ssl_certificate /etc/letsencrypt/live/api.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.tudominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    index index.php;
    charset utf-8;

    # Rate limiting
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        try_files $uri $uri/ /index.php?$query_string;
    }

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
        
        # Timeout para operaciones largas (sincronización)
        fastcgi_read_timeout 300;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Proteger archivos sensibles
    location ~ /(\.env|\.git|composer\.json|composer\.lock|package\.json) {
        deny all;
        return 404;
    }

    # Logs
    access_log /var/log/nginx/inspeccionessst-api-access.log;
    error_log /var/log/nginx/inspeccionessst-api-error.log;
}
```

Activar el sitio:

```bash
sudo ln -s /etc/nginx/sites-available/inspeccionessst-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Paso 7: Configurar SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d api.tudominio.com

# Renovación automática (ya configurada por defecto)
sudo certbot renew --dry-run
```

### Paso 8: Configurar Queue Worker (opcional pero recomendado)

Crear archivo `/etc/systemd/system/inspeccionessst-worker.service`:

```ini
[Unit]
Description=Inspecciones SST Queue Worker
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/inspeccionessst
ExecStart=/usr/bin/php /var/www/inspeccionessst/artisan queue:work --sleep=3 --tries=3 --max-time=3600
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Activar el servicio:

```bash
sudo systemctl enable inspeccionessst-worker
sudo systemctl start inspeccionessst-worker
sudo systemctl status inspeccionessst-worker
```

---

## 2️⃣ FRONTEND (Ionic/Angular)

### Paso 1: Actualizar environment de producción

Editar `frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.tudominio.com/api/v1',
  appName: 'Inspecciones SST',
  version: '1.0.0',
  api: {
    timeout: 30000,
    retryAttempts: 3,
  },
  sync: {
    autoSyncInterval: 5 * 60 * 1000, // 5 minutos
    enableAutoSync: true,
    maxRetries: 3,
  },
  storage: {
    dbName: 'inspeccionessst_db',
    dbVersion: 1,
  },
};
```

### Paso 2: Compilar para producción

```bash
cd frontend

# Instalar dependencias
npm install

# Build optimizado para producción
npm run build

# Verificar que se generó correctamente
ls -la www/
```

### Paso 3: Desplegar el frontend

**Opción A: Mismo servidor con Nginx**

Crear archivo `/etc/nginx/sites-available/inspeccionessst-frontend`:

```nginx
server {
    listen 80;
    server_name app.tudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.tudominio.com;
    root /var/www/inspeccionessst/frontend/www;

    # SSL
    ssl_certificate /etc/letsencrypt/live/app.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.tudominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    index index.html;
    charset utf-8;

    # Servir archivos estáticos
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Service Worker (sin cache)
    location /service-worker.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }

    # Logs
    access_log /var/log/nginx/inspeccionessst-app-access.log;
    error_log /var/log/nginx/inspeccionessst-app-error.log;
}
```

Activar:

```bash
sudo ln -s /etc/nginx/sites-available/inspeccionessst-frontend /etc/nginx/sites-enabled/
sudo certbot --nginx -d app.tudominio.com
sudo nginx -t
sudo systemctl reload nginx
```

**Opción B: Netlify/Vercel (más simple)**

1. Crear cuenta en [Netlify](https://netlify.com) o [Vercel](https://vercel.com)
2. Conectar repositorio
3. Configurar:
   - Build command: `cd frontend && npm run build`
   - Publish directory: `frontend/www`
4. Agregar variables de entorno si es necesario
5. Deploy automático en cada push

---

## 3️⃣ APP MÓVIL (Android)

### Preparación para Play Store

#### 1. Actualizar configuración

Editar `frontend/capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'pe.tuempresa.inspeccionessst',
  appName: 'Inspecciones SST',
  webDir: 'www',
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#5a89a3',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
```

#### 2. Crear keystore para firma (solo primera vez)

```powershell
# En Windows
cd c:\laragon\www\inspeccionessst\frontend\android

# Crear keystore
keytool -genkey -v -keystore inspeccionessst-release.keystore -alias inspeccionessst -keyalg RSA -keysize 2048 -validity 10000

# Guardar keystore en lugar SEGURO (no subir a Git)
# Anotar: alias, passwords, etc.
```

#### 3. Configurar firma en Gradle

Crear/editar `frontend/android/keystore.properties`:

```properties
storePassword=tu-store-password
keyPassword=tu-key-password
keyAlias=inspeccionessst
storeFile=../inspeccionessst-release.keystore
```

⚠️ **IMPORTANTE**: Agregar a `.gitignore`:
```
keystore.properties
*.keystore
*.jks
```

Editar `frontend/android/app/build.gradle`:

```gradle
android {
    ...
    
    signingConfigs {
        release {
            def keystorePropertiesFile = rootProject.file("keystore.properties")
            def keystoreProperties = new Properties()
            if (keystorePropertiesFile.exists()) {
                keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### 4. Compilar APK/AAB firmado

```powershell
cd c:\laragon\www\inspeccionessst\frontend

# Asegurar que el build está actualizado
npm run build

# Sincronizar con Android
npx cap sync android

# Compilar AAB para Play Store (recomendado)
cd android
.\gradlew.bat bundleRelease

# O compilar APK firmado
.\gradlew.bat assembleRelease

# Archivos generados:
# AAB: android/app/build/outputs/bundle/release/app-release.aab
# APK: android/app/build/outputs/apk/release/app-release.apk
```

#### 5. Subir a Google Play Console

1. Ir a [Google Play Console](https://play.google.com/console)
2. Crear nueva aplicación
3. Completar información:
   - Título: "Inspecciones SST"
   - Descripción corta y larga
   - Capturas de pantalla (mínimo 2)
   - Ícono de alta resolución (512x512)
   - Gráfico destacado
4. Configurar ficha de la aplicación
5. Producción → Crear nueva versión
6. Subir el AAB
7. Revisar y enviar para revisión

---

## 4️⃣ SEGURIDAD Y OPTIMIZACIÓN

### ✅ Checklist de Seguridad Backend

```bash
# 1. Verificar configuración
grep -E "APP_DEBUG|APP_ENV" .env

# 2. Permisos correctos
sudo find storage bootstrap/cache -type d -exec chmod 775 {} \;
sudo find storage bootstrap/cache -type f -exec chmod 664 {} \;

# 3. Ocultar versión de PHP
sudo nano /etc/php/8.2/fpm/php.ini
# Cambiar: expose_php = Off

# 4. Configurar firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable

# 5. Fail2ban para protección SSH
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### Optimización de Base de Datos

```sql
-- Índices importantes (ya deberían estar en migraciones)
USE inspeccionessst_prod;

-- Verificar índices
SHOW INDEX FROM inspecciones;
SHOW INDEX FROM resultados_inspeccion;
SHOW INDEX FROM personal;

-- Optimizar tablas regularmente
OPTIMIZE TABLE inspecciones;
OPTIMIZE TABLE resultados_inspeccion;
OPTIMIZE TABLE personal;
```

### Configuración PHP-FPM para producción

Editar `/etc/php/8.2/fpm/pool.d/www.conf`:

```ini
pm = dynamic
pm.max_children = 50
pm.start_servers = 10
pm.min_spare_servers = 5
pm.max_spare_servers = 20
pm.max_requests = 500
```

Reiniciar:
```bash
sudo systemctl restart php8.2-fpm
```

---

## 5️⃣ BACKUPS AUTOMÁTICOS

### Script de Backup

Crear `/var/www/inspeccionessst/backup.sh`:

```bash
#!/bin/bash

# Configuración
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/inspeccionessst"
DB_NAME="inspeccionessst_prod"
DB_USER="inspeccionessst_user"
DB_PASS="contraseña_segura"
RETENTION_DAYS=30

# Crear directorios
mkdir -p $BACKUP_DIR/db
mkdir -p $BACKUP_DIR/files

# Backup de Base de Datos
echo "Backup de base de datos..."
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db/db_$DATE.sql.gz

# Backup de archivos (fotos, PDFs)
echo "Backup de archivos..."
tar -czf $BACKUP_DIR/files/storage_$DATE.tar.gz /var/www/inspeccionessst/storage/app

# Eliminar backups antiguos
echo "Limpiando backups antiguos..."
find $BACKUP_DIR/db/ -name "db_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR/files/ -name "storage_*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Log
echo "Backup completado: $DATE" >> $BACKUP_DIR/backup.log

# Opcional: Subir a S3/Cloud Storage
# aws s3 sync $BACKUP_DIR s3://tu-bucket/inspeccionessst/
```

Hacer ejecutable y programar con cron:

```bash
chmod +x /var/www/inspeccionessst/backup.sh

# Editar crontab
sudo crontab -e

# Agregar: Backup diario a las 2 AM
0 2 * * * /var/www/inspeccionessst/backup.sh
```

---

## 6️⃣ ACTUALIZACIÓN Y MANTENIMIENTO

### Script de Actualización

Crear `/var/www/inspeccionessst/deploy.sh`:

```bash
#!/bin/bash

cd /var/www/inspeccionessst

echo "=== Iniciando despliegue ==="

# Modo mantenimiento
php artisan down

# Actualizar código
git pull origin main

# Backend
echo "Actualizando backend..."
composer install --optimize-autoloader --no-dev
php artisan migrate --force
php artisan cache:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Frontend (si está en el mismo servidor)
echo "Actualizando frontend..."
cd frontend
npm install
npm run build
cd ..

# Reiniciar servicios
sudo systemctl restart php8.2-fpm
sudo systemctl restart inspeccionessst-worker

# Salir de mantenimiento
php artisan up

echo "=== Despliegue completado ==="
```

---

## 7️⃣ MONITOREO

### Logs importantes

```bash
# Laravel
tail -f /var/www/inspeccionessst/storage/logs/laravel.log

# Nginx
tail -f /var/log/nginx/inspeccionessst-api-error.log
tail -f /var/log/nginx/inspeccionessst-app-error.log

# PHP-FPM
tail -f /var/log/php8.2-fpm.log

# MySQL (errores lentos)
tail -f /var/log/mysql/slow-query.log
```

### Herramientas recomendadas

- **Sentry**: Monitoreo de errores en tiempo real
- **Laravel Telescope**: Debug en desarrollo
- **New Relic / Datadog**: Performance monitoring
- **UptimeRobot**: Monitoreo de disponibilidad (gratis)
- **Google Analytics**: Analítica de uso

---

## 8️⃣ CONFIGURACIÓN CORS

Verificar `backend/config/cors.php`:

```php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'https://app.tudominio.com',
        // NO incluir localhost en producción
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

---

## 📝 CHECKLIST FINAL ANTES DE PRODUCCIÓN

### Backend
- [ ] `APP_DEBUG=false`
- [ ] `APP_ENV=production`
- [ ] SSL/HTTPS activo y funcionando
- [ ] Contraseñas seguras en `.env`
- [ ] CORS configurado correctamente
- [ ] Migraciones ejecutadas
- [ ] Seeders de datos iniciales ejecutados
- [ ] Storage link creado
- [ ] Permisos correctos en archivos
- [ ] Cachés de configuración generados
- [ ] Queue worker configurado (si se usa)
- [ ] Backups automáticos configurados
- [ ] Logs monitorizados

### Frontend
- [ ] `production: true` en environment
- [ ] URL de API de producción configurada
- [ ] Build de producción generado
- [ ] Service Worker configurado
- [ ] PWA manifest correcto
- [ ] Sin console.log en producción

### App Móvil
- [ ] Keystore generado y guardado seguro
- [ ] Firma configurada en Gradle
- [ ] AAB/APK generado
- [ ] Probado en dispositivos reales
- [ ] Permisos de la app correctos
- [ ] Íconos y splash screen configurados
- [ ] Versión incrementada en build.gradle

### Seguridad
- [ ] Firewall configurado
- [ ] Fail2ban activo
- [ ] Rate limiting configurado
- [ ] Headers de seguridad configurados
- [ ] Archivos sensibles protegidos
- [ ] Usuarios de BD sin privilegios innecesarios

### Monitoring
- [ ] Herramienta de monitoreo configurada
- [ ] Alertas de errores configuradas
- [ ] Logs rotando correctamente
- [ ] Uptime monitoring activo

---

## 🆘 TROUBLESHOOTING

### Error 500 en API

```bash
# Ver logs detallados
tail -100 storage/logs/laravel.log

# Verificar permisos
sudo chown -R www-data:www-data storage bootstrap/cache

# Limpiar cachés
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### CORS Errors

```bash
# Verificar config
php artisan config:show cors

# Limpiar y regenerar
php artisan config:clear
php artisan config:cache
```

### Base de datos lenta

```sql
-- Ver queries lentas
SHOW PROCESSLIST;

-- Ver índices de una tabla
SHOW INDEX FROM inspecciones;

-- Optimizar
OPTIMIZE TABLE inspecciones;
```

### App móvil no sincroniza

1. Verificar conexión a internet en el dispositivo
2. Verificar URL del API en environment.prod.ts
3. Verificar CORS en el servidor
4. Ver logs en Chrome DevTools (Android) o Safari (iOS)
5. Verificar IndexedDB en DevTools → Application

---

## 📞 CONTACTO Y SOPORTE

- **Documentación**: `/docs` en el repositorio
- **Issues**: GitHub Issues para reportar bugs
- **Email**: soporte@tudominio.com

---

**¡Listo para producción! 🎉**

---

## 📊 MÉTRICAS DE ÉXITO

Después del despliegue, monitorear:

- **Uptime**: Debe ser > 99.9%
- **Tiempo de respuesta API**: < 500ms promedio
- **Errores 5xx**: < 0.1%
- **Tiempo de carga frontend**: < 3s
- **Tasa de sincronización exitosa**: > 95%
- **Crashes en app móvil**: < 1%

---

## 🔄 VERSIONAMIENTO

Usar [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Cambios incompatibles con versiones anteriores
- **MINOR** (1.1.0): Nueva funcionalidad compatible
- **PATCH** (1.0.1): Correcciones de bugs

Actualizar en:
- `package.json` (frontend)
- `composer.json` (backend)
- `build.gradle` → `versionName` y `versionCode` (Android)
