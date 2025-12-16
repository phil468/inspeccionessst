# Script para instalar dependencias del frontend
# Ejecutar desde: c:\laragon\www\calibracion\frontend

Write-Host "Instalando dependencias necesarias para el proyecto..." -ForegroundColor Green

# Dependencias para offline-first
npm install dexie --save

# Capacitor plugins
npm install @capacitor/network --save
npm install @capacitor/storage --save
npm install @capacitor/app --save

# HTTP y utilidades
npm install @angular/common@latest --save

Write-Host ""
Write-Host "Dependencias instaladas exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Crear servicios (Auth, Sync, Storage)" -ForegroundColor White
Write-Host "2. Crear modelos/interfaces TypeScript" -ForegroundColor White
Write-Host "3. Crear páginas principales" -ForegroundColor White
Write-Host "4. Configurar routing" -ForegroundColor White
