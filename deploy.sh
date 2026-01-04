#!/bin/bash

# Script de Despliegue Automático para Inspecciones SST
# Guardar en: /var/www/inspeccionessst/deploy.sh
# Hacer ejecutable: chmod +x deploy.sh
# Uso: ./deploy.sh [branch]

# ===== CONFIGURACIÓN =====
PROJECT_DIR="/var/www/inspeccionessst"
BRANCH="${1:-main}"
DATE=$(date +%Y%m%d_%H%M%S)

echo "========================================="
echo "Despliegue Inspecciones SST"
echo "Branch: $BRANCH"
echo "Fecha: $DATE"
echo "========================================="

# Cambiar al directorio del proyecto
cd $PROJECT_DIR

# 1. Activar modo mantenimiento
echo "[1/12] Activando modo mantenimiento..."
php artisan down --message="Actualizando sistema, volveremos pronto" --retry=60
echo "✓ Modo mantenimiento activado"

# 2. Hacer backup antes de actualizar
echo "[2/12] Creando backup de seguridad..."
if [ -f "$PROJECT_DIR/backup.sh" ]; then
    bash $PROJECT_DIR/backup.sh
    echo "✓ Backup completado"
else
    echo "⚠ Script de backup no encontrado, continuando sin backup..."
fi

# 3. Actualizar código desde Git
echo "[3/12] Actualizando código desde Git..."
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH
if [ $? -eq 0 ]; then
    echo "✓ Código actualizado"
    COMMIT=$(git log -1 --pretty=format:"%h - %s")
    echo "  Último commit: $COMMIT"
else
    echo "✗ Error al actualizar código"
    php artisan up
    exit 1
fi

# 4. Actualizar dependencias de Composer
echo "[4/12] Actualizando dependencias de Composer..."
composer install --optimize-autoloader --no-dev --no-interaction
if [ $? -eq 0 ]; then
    echo "✓ Dependencias de Composer actualizadas"
else
    echo "✗ Error al actualizar Composer"
    php artisan up
    exit 1
fi

# 5. Ejecutar migraciones
echo "[5/12] Ejecutando migraciones de base de datos..."
php artisan migrate --force
if [ $? -eq 0 ]; then
    echo "✓ Migraciones ejecutadas"
else
    echo "⚠ Error en migraciones, revisa manualmente"
fi

# 6. Limpiar cachés
echo "[6/12] Limpiando cachés..."
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
echo "✓ Cachés limpiados"

# 7. Regenerar cachés optimizados
echo "[7/12] Regenerando cachés optimizados..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
echo "✓ Cachés regenerados"

# 8. Actualizar storage link
echo "[8/12] Verificando storage link..."
php artisan storage:link
echo "✓ Storage link verificado"

# 9. Compilar frontend (si está en el mismo servidor)
if [ -d "$PROJECT_DIR/frontend" ]; then
    echo "[9/12] Actualizando frontend..."
    cd frontend
    
    # Actualizar dependencias si package.json cambió
    if git diff HEAD~1 HEAD --name-only | grep -q "package.json"; then
        echo "  Actualizando dependencias de npm..."
        npm install
    fi
    
    # Compilar
    npm run build
    
    if [ $? -eq 0 ]; then
        echo "✓ Frontend actualizado"
    else
        echo "⚠ Error al compilar frontend"
    fi
    
    cd $PROJECT_DIR
else
    echo "[9/12] Frontend no encontrado en este servidor, omitiendo..."
fi

# 10. Reiniciar servicios
echo "[10/12] Reiniciando servicios..."

# PHP-FPM
sudo systemctl restart php8.2-fpm
if [ $? -eq 0 ]; then
    echo "✓ PHP-FPM reiniciado"
else
    echo "⚠ No se pudo reiniciar PHP-FPM"
fi

# Queue Worker (si existe)
if systemctl is-active --quiet inspeccionessst-worker; then
    sudo systemctl restart inspeccionessst-worker
    echo "✓ Queue worker reiniciado"
fi

# Nginx (reload, no restart para no cortar conexiones)
sudo nginx -t && sudo systemctl reload nginx
if [ $? -eq 0 ]; then
    echo "✓ Nginx recargado"
else
    echo "⚠ Error al recargar Nginx"
fi

# 11. Verificar estado del sistema
echo "[11/12] Verificando estado del sistema..."

# Verificar que el sitio responde
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://api.tudominio.com/api/health)
if [ "$HEALTH_CHECK" = "200" ]; then
    echo "✓ API respondiendo correctamente (HTTP 200)"
else
    echo "⚠ API respondiendo con código: $HEALTH_CHECK"
fi

# 12. Desactivar modo mantenimiento
echo "[12/12] Desactivando modo mantenimiento..."
php artisan up
echo "✓ Sistema en línea"

# Resumen
echo ""
echo "========================================="
echo "✓ DESPLIEGUE COMPLETADO EXITOSAMENTE"
echo "========================================="
echo "Fecha: $DATE"
echo "Branch: $BRANCH"
echo "Commit: $COMMIT"
echo "Health Check: HTTP $HEALTH_CHECK"
echo "========================================="

# Registrar en log
echo "$DATE - Despliegue completado - Branch: $BRANCH - Commit: $COMMIT" >> $PROJECT_DIR/deploy.log

# Opcional: Notificación
# curl -X POST https://api.tudominio.com/api/v1/admin/deployment-notification \
#   -H "Content-Type: application/json" \
#   -d "{\"status\":\"success\",\"date\":\"$DATE\",\"branch\":\"$BRANCH\",\"commit\":\"$COMMIT\"}"

exit 0
