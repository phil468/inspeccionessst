# Script de Build y Deploy para Android
# Para Windows PowerShell

param(
    [Parameter(Mandatory = $false)]
    [ValidateSet('debug', 'release')]
    [string]$BuildType = 'debug',
    
    [Parameter(Mandatory = $false)]
    [switch]$Install,
    
    [Parameter(Mandatory = $false)]
    [string]$Device
)

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Build Android - Inspecciones SST" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = "c:\laragon\www\inspeccionessst\frontend"
$AndroidDir = "$ProjectRoot\android"

# Verificar que estamos en el directorio correcto
if (-not (Test-Path $ProjectRoot)) {
    Write-Host "✗ Error: No se encontró el proyecto en $ProjectRoot" -ForegroundColor Red
    exit 1
}

Set-Location $ProjectRoot

# 1. Build del frontend
Write-Host "[1/4] Compilando frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Error al compilar frontend" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Frontend compilado" -ForegroundColor Green

# 2. Sincronizar con Capacitor
Write-Host "[2/4] Sincronizando con Android..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Error al sincronizar con Android" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Sincronizado con Android" -ForegroundColor Green

# 3. Build de Android
Set-Location $AndroidDir

if ($BuildType -eq 'release') {
    Write-Host "[3/4] Compilando APK/AAB de Release..." -ForegroundColor Yellow
    
    # Verificar que existe keystore
    if (-not (Test-Path "keystore.properties")) {
        Write-Host "⚠ No se encontró keystore.properties" -ForegroundColor Yellow
        Write-Host "  El APK será generado sin firmar" -ForegroundColor Yellow
    }
    
    # Compilar AAB (para Play Store)
    Write-Host "  Generando AAB..." -ForegroundColor Cyan
    .\gradlew.bat bundleRelease
    
    if ($LASTEXITCODE -eq 0) {
        $AabPath = "$AndroidDir\app\build\outputs\bundle\release\app-release.aab"
        if (Test-Path $AabPath) {
            $AabSize = [math]::Round((Get-Item $AabPath).Length / 1MB, 2)
            Write-Host "✓ AAB generado: $AabSize MB" -ForegroundColor Green
            Write-Host "  Ubicación: $AabPath" -ForegroundColor Gray
        }
    }
    
    # Compilar APK (para distribución directa)
    Write-Host "  Generando APK..." -ForegroundColor Cyan
    .\gradlew.bat assembleRelease
    
    if ($LASTEXITCODE -eq 0) {
        $ApkPath = "$AndroidDir\app\build\outputs\apk\release\app-release.apk"
        if (Test-Path $ApkPath) {
            $ApkSize = [math]::Round((Get-Item $ApkPath).Length / 1MB, 2)
            Write-Host "✓ APK generado: $ApkSize MB" -ForegroundColor Green
            Write-Host "  Ubicación: $ApkPath" -ForegroundColor Gray
        }
    }
    else {
        Write-Host "✗ Error al compilar release" -ForegroundColor Red
        exit 1
    }
    
}
else {
    Write-Host "[3/4] Compilando APK de Debug..." -ForegroundColor Yellow
    .\gradlew.bat assembleDebug
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Error al compilar debug" -ForegroundColor Red
        exit 1
    }
    
    $ApkPath = "$AndroidDir\app\build\outputs\apk\debug\app-debug.apk"
    if (Test-Path $ApkPath) {
        $ApkSize = [math]::Round((Get-Item $ApkPath).Length / 1MB, 2)
        Write-Host "✓ APK Debug generado: $ApkSize MB" -ForegroundColor Green
        Write-Host "  Ubicación: $ApkPath" -ForegroundColor Gray
    }
}

# 4. Instalar en dispositivo (opcional)
if ($Install) {
    Write-Host "[4/4] Instalando en dispositivo..." -ForegroundColor Yellow
    
    # Verificar adb
    try {
        $AdbPath = (Get-Command adb -ErrorAction Stop).Source
    }
    catch {
        Write-Host "✗ ADB no encontrado. Instala Android SDK Platform Tools" -ForegroundColor Red
        exit 1
    }
    
    # Listar dispositivos
    $Devices = adb devices | Select-String -Pattern "device$"
    
    if ($Devices.Count -eq 0) {
        Write-Host "✗ No se encontraron dispositivos conectados" -ForegroundColor Red
        Write-Host "  Conecta un dispositivo por USB o inicia un emulador" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "  Dispositivos disponibles:" -ForegroundColor Cyan
    adb devices
    
    # Instalar APK
    if ($BuildType -eq 'release') {
        $InstallApk = "$AndroidDir\app\build\outputs\apk\release\app-release.apk"
    }
    else {
        $InstallApk = "$AndroidDir\app\build\outputs\apk\debug\app-debug.apk"
    }
    
    if ($Device) {
        Write-Host "  Instalando en dispositivo: $Device" -ForegroundColor Cyan
        adb -s $Device install -r $InstallApk
    }
    else {
        Write-Host "  Instalando en primer dispositivo..." -ForegroundColor Cyan
        adb install -r $InstallApk
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ App instalada exitosamente" -ForegroundColor Green
        
        # Opcional: Iniciar la app
        Write-Host "  Iniciando app..." -ForegroundColor Cyan
        adb shell am start -n pe.tuempresa.inspeccionessst/.MainActivity
    }
    else {
        Write-Host "⚠ Error al instalar app" -ForegroundColor Yellow
    }
}
else {
    Write-Host "[4/4] Omitiendo instalación (usa -Install para instalar)" -ForegroundColor Gray
}

# Resumen
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "✓ BUILD COMPLETADO" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Tipo: $BuildType" -ForegroundColor White
Write-Host "Ubicación: $AndroidDir\app\build\outputs\" -ForegroundColor White
Write-Host ""

if ($BuildType -eq 'release') {
    Write-Host "📦 Archivos generados:" -ForegroundColor Yellow
    Write-Host "  • AAB (Play Store): app\build\outputs\bundle\release\app-release.aab" -ForegroundColor White
    Write-Host "  • APK (Directo):    app\build\outputs\apk\release\app-release.apk" -ForegroundColor White
}
else {
    Write-Host "📦 APK Debug: app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor White
}

Write-Host ""
Write-Host "Uso:" -ForegroundColor Cyan
Write-Host "  Debug:   .\build-android.ps1 -BuildType debug" -ForegroundColor Gray
Write-Host "  Release: .\build-android.ps1 -BuildType release" -ForegroundColor Gray
Write-Host "  Install: .\build-android.ps1 -BuildType debug -Install" -ForegroundColor Gray
Write-Host "=========================================" -ForegroundColor Cyan

Set-Location $ProjectRoot
