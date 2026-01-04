#!/bin/bash

# Script de Backup Automático para Inspecciones SST
# Guardar en: /var/www/inspeccionessst/backup.sh
# Hacer ejecutable: chmod +x backup.sh

# ===== CONFIGURACIÓN =====
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/inspeccionessst"
PROJECT_DIR="/var/www/inspeccionessst"

# Base de datos
DB_NAME="inspeccionessst_prod"
DB_USER="inspeccionessst_user"
DB_PASS="tu_contraseña_aqui"

# Retención (días)
RETENTION_DAYS=30

# ===== SCRIPT =====
echo "========================================="
echo "Backup Inspecciones SST - $DATE"
echo "========================================="

# Crear directorios si no existen
mkdir -p $BACKUP_DIR/db
mkdir -p $BACKUP_DIR/files
mkdir -p $BACKUP_DIR/logs

# 1. Backup de Base de Datos
echo "[1/4] Respaldando base de datos..."
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db/db_$DATE.sql.gz
if [ $? -eq 0 ]; then
    echo "✓ Base de datos respaldada"
    DB_SIZE=$(du -h $BACKUP_DIR/db/db_$DATE.sql.gz | cut -f1)
    echo "  Tamaño: $DB_SIZE"
else
    echo "✗ Error al respaldar base de datos"
    exit 1
fi

# 2. Backup de archivos (storage)
echo "[2/4] Respaldando archivos..."
tar -czf $BACKUP_DIR/files/storage_$DATE.tar.gz -C $PROJECT_DIR storage/app
if [ $? -eq 0 ]; then
    echo "✓ Archivos respaldados"
    FILES_SIZE=$(du -h $BACKUP_DIR/files/storage_$DATE.tar.gz | cut -f1)
    echo "  Tamaño: $FILES_SIZE"
else
    echo "✗ Error al respaldar archivos"
fi

# 3. Backup de configuración
echo "[3/4] Respaldando configuración..."
cp $PROJECT_DIR/.env $BACKUP_DIR/logs/env_$DATE.backup

# 4. Eliminar backups antiguos
echo "[4/4] Limpiando backups antiguos (> $RETENTION_DAYS días)..."
DELETED_DB=$(find $BACKUP_DIR/db/ -name "db_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
DELETED_FILES=$(find $BACKUP_DIR/files/ -name "storage_*.tar.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
DELETED_LOGS=$(find $BACKUP_DIR/logs/ -name "env_*.backup" -mtime +$RETENTION_DAYS -delete -print | wc -l)

echo "✓ Eliminados: $DELETED_DB backups de BD, $DELETED_FILES de archivos, $DELETED_LOGS configs"

# Resumen
echo ""
echo "========================================="
echo "Backup completado exitosamente"
echo "Fecha: $DATE"
echo "========================================="
echo "BD: $DB_SIZE"
echo "Archivos: $FILES_SIZE"
echo "Ubicación: $BACKUP_DIR"
echo "========================================="

# Registrar en log
echo "$DATE - Backup completado - BD: $DB_SIZE, Files: $FILES_SIZE" >> $BACKUP_DIR/backup.log

# Opcional: Subir a cloud storage (descomentar si usas)
# echo "Subiendo a AWS S3..."
# aws s3 sync $BACKUP_DIR s3://tu-bucket/inspeccionessst/backups/

# Opcional: Enviar notificación (descomentar si usas)
# curl -X POST https://api.tudominio.com/api/v1/admin/backup-notification \
#   -H "Content-Type: application/json" \
#   -d "{\"status\":\"success\",\"date\":\"$DATE\",\"db_size\":\"$DB_SIZE\",\"files_size\":\"$FILES_SIZE\"}"

echo "✓ Backup completado"
exit 0
