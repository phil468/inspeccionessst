# ✅ Checklist de Implementación - Push Notifications

## Estado Actual: DESARROLLO COMPLETO

---

## 📋 Backend - COMPLETADO ✅

-   [x] Migración `push_notification_tokens` ejecutada
-   [x] Migración campos de aprobación en `resultados_inspeccion` ejecutada
-   [x] Modelo `PushNotificationToken` creado
-   [x] Servicio `PushNotificationService` creado
-   [x] Controlador `PushNotificationController` creado
-   [x] Controlador `FotoApprovalController` creado
-   [x] Rutas API agregadas (7 endpoints)
-   [x] `NotificationService` integrado con push
-   [x] Modelo `ResultadoInspeccion` actualizado

---

## 📋 Frontend - COMPLETADO ✅

-   [x] Paquete `@capacitor/push-notifications` instalado
-   [x] Servicio `PushNotificationService` creado
-   [x] Servicio `InspeccionService` creado
-   [x] `app.component.ts` integrado con push service
-   [x] UI de aprobación de fotos en `inspeccion-form.page.html`
-   [x] Lógica de aprobación en `inspeccion-form.page.ts`
-   [x] Modelo `inspeccion.model.ts` actualizado

---

## 📋 Configuración Firebase - PENDIENTE ⏳

### Paso 1: Crear Proyecto Firebase

-   [ ] Ir a [Firebase Console](https://console.firebase.google.com/)
-   [ ] Crear nuevo proyecto con nombre: `inspeccionessst`
-   [ ] Habilitar Google Analytics (opcional)

### Paso 2: Obtener Server Key (Backend)

-   [ ] En Firebase Console → Configuración del proyecto ⚙️
-   [ ] Ir a pestaña **Cloud Messaging**
-   [ ] Si no ves Cloud Messaging API (Legacy), habilitarla en Google Cloud Console
-   [ ] Copiar el **Server Key**
-   [ ] Agregar a `c:\laragon\www\inspeccionessst\.env`:
    ```env
    FCM_SERVER_KEY=AAAA...tu_key_completa_aqui
    ```

### Paso 3: Configurar Android

-   [ ] En Firebase Console → Agregar app → Android
-   [ ] Package name: verificar en `frontend/capacitor.config.ts` (probablemente `com.inspeccionessst.app`)
-   [ ] Descargar `google-services.json`
-   [ ] Colocar en: `frontend/android/app/google-services.json`

### Paso 4: Configurar iOS

-   [ ] En Firebase Console → Agregar app → iOS
-   [ ] Bundle ID: mismo que package name (verificar en `capacitor.config.ts`)
-   [ ] Descargar `GoogleService-Info.plist`
-   [ ] Colocar en: `frontend/ios/App/App/GoogleService-Info.plist`
-   [ ] Subir APNs Certificate en Firebase Console (solo iOS)

### Paso 5: Sincronizar Capacitor

```bash
cd c:\laragon\www\inspeccionessst\frontend
npx cap sync
```

---

## 📋 Testing - PENDIENTE ⏳

### Backend Tests

-   [ ] Verificar que Laravel cargue el servicio:

    ```bash
    cd c:\laragon\www\inspeccionessst
    php artisan tinker
    ```

    ```php
    $service = app(App\Services\PushNotificationService::class);
    // Debe devolver instancia sin errores
    ```

-   [ ] Probar endpoint de test (requiere usuario autenticado):
    ```bash
    # Obtener token de autenticación primero
    # Luego:
    curl -X POST http://localhost:8000/api/push-notifications/test \
      -H "Authorization: Bearer TU_TOKEN_AQUI" \
      -H "Content-Type: application/json" \
      -d '{"title":"Prueba","body":"Test"}'
    ```

### Frontend Tests

-   [ ] Compilar aplicación:

    ```bash
    cd frontend
    npm run build
    npx cap copy
    ```

-   [ ] Probar en dispositivo Android:

    ```bash
    npx cap open android
    ```

    -   En Android Studio, ejecutar en dispositivo real
    -   Verificar logs: "Push Notifications initialized"
    -   Verificar que aparezca popup de permisos

-   [ ] Probar en dispositivo iOS:
    ```bash
    npx cap open ios
    ```
    -   En Xcode, seleccionar equipo de desarrollo
    -   Ejecutar en dispositivo real (NO emulador)
    -   Verificar logs: "Push registration success"

### Pruebas de Flujo Completo

-   [ ] **Registro de Token**:

    1. Abrir app en dispositivo
    2. Iniciar sesión
    3. Verificar en backend que token se registró:
        ```sql
        SELECT * FROM push_notification_tokens WHERE user_id = X;
        ```

-   [ ] **Notificación Foreground**:

    1. Tener app abierta
    2. En backend, completar una inspección
    3. Verificar que aparezca toast en app

-   [ ] **Notificación Background**:

    1. Minimizar/cerrar app
    2. Completar inspección desde otro dispositivo
    3. Verificar que llegue notificación del sistema
    4. Hacer tap → debe abrir app y navegar a inspección

-   [ ] **Aprobación de Fotos**:

    1. Iniciar sesión como inspector
    2. Abrir inspección con fotos cargadas
    3. Verificar que aparezcan botones de aprobar/rechazar
    4. Aprobar una foto inicial
    5. Verificar que estado cambie a "Aprobada ✓"

-   [ ] **Carga de Foto Final**:
    1. Iniciar sesión como responsable de levantamiento
    2. Abrir inspección
    3. Verificar que aparezca botón de cámara para foto final
    4. Cargar foto
    5. Verificar que se guarde correctamente

---

## 📋 Verificación de Logs

### Backend Logs

```bash
cd c:\laragon\www\inspeccionessst
tail -f storage/logs/laravel.log
```

Buscar mensajes:

-   `Notificación enviada a: email@example.com`
-   `Push notification sent to user`
-   Errores de FCM (401, 400, etc.)

### Frontend Logs

**Android (Logcat)**:

```bash
adb logcat | grep -i "capacitor\|push"
```

**iOS (Xcode Console)**:

-   Filtrar por "Push" o "Capacitor"

**Browser DevTools**:

-   Console → Buscar "Push Notifications"

---

## 📋 Troubleshooting

### ❌ Token no se registra

**Síntomas**: No aparece "Token registrado exitosamente" en logs

**Verificar**:

-   [ ] Dispositivo tiene internet
-   [ ] Permisos de notificaciones concedidos
-   [ ] `google-services.json` / `GoogleService-Info.plist` en lugar correcto
-   [ ] `npx cap sync` ejecutado después de agregar archivos

### ❌ Notificaciones no llegan

**Síntomas**: Token registrado pero no llegan notificaciones

**Verificar**:

-   [ ] `FCM_SERVER_KEY` en `.env` backend
-   [ ] Server Key es correcto (copiar de nuevo si es necesario)
-   [ ] Token está activo en BD: `SELECT * FROM push_notification_tokens WHERE active = 1`
-   [ ] Logs del backend no muestran errores 401/403

### ❌ Error "FCM_SERVER_KEY not configured"

**Solución**:

```bash
# Agregar a .env
FCM_SERVER_KEY=tu_server_key_aqui

# Limpiar caché
php artisan config:clear
php artisan cache:clear
```

### ❌ App no navega al hacer tap

**Verificar**:

-   [ ] Payload incluye `data.inspeccion_id`
-   [ ] Ruta existe en router: `/tabs/inspecciones/detalle/:id`
-   [ ] Método `handleNotificationTap()` se ejecuta (agregar console.log)

---

## 📋 Seguridad

-   [ ] **Nunca** exponer `FCM_SERVER_KEY` en frontend
-   [ ] Validar que usuario autenticado pueda registrar tokens
-   [ ] Implementar rate limiting en endpoints de push:
    ```php
    Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
        Route::post('/push-notifications/register', ...);
    });
    ```
-   [ ] Limpiar tokens inactivos periódicamente:
    ```php
    // En app/Console/Kernel.php
    $schedule->call(function () {
        app(App\Services\PushNotificationService::class)->cleanInactiveTokens(30);
    })->weekly();
    ```

---

## 📋 Optimizaciones Futuras (Opcional)

-   [ ] Implementar Queue Jobs para envío asíncrono
-   [ ] Agregar retry logic si FCM falla
-   [ ] Usar Topic Subscriptions para grupos
-   [ ] Dashboard de métricas de notificaciones
-   [ ] Notificaciones programadas
-   [ ] Segmentación por rol/empresa/área

---

## 🎯 Criterios de Éxito

### Funcionalidad Mínima

-   ✅ Usuario puede aprobar/rechazar fotos si es inspector
-   ✅ Usuario puede subir foto final si es responsable/inspector
-   ✅ Token se registra al iniciar sesión
-   ✅ Notificación llega al completar inspección
-   ✅ App navega a inspección al hacer tap

### Funcionalidad Completa

-   ✅ Todo lo anterior +
-   ⏳ Notificaciones llegan en iOS y Android
-   ⏳ FCM configurado correctamente
-   ⏳ Deep linking funciona en background/foreground
-   ⏳ Tokens inactivos se limpian automáticamente

---

## 📚 Documentación de Referencia

-   **Configuración detallada**: `CONFIGURACION_PUSH_NOTIFICATIONS.md`
-   **Resumen de implementación**: `RESUMEN_PUSH_NOTIFICATIONS.md`
-   **Capacitor Push**: https://capacitorjs.com/docs/apis/push-notifications
-   **FCM Documentation**: https://firebase.google.com/docs/cloud-messaging

---

## ✨ Estado Final

```
┌─────────────────────────────────────────────────┐
│  DESARROLLO COMPLETO ✅                         │
│  CONFIGURACIÓN DE FIREBASE PENDIENTE ⏳         │
│  TESTING EN DISPOSITIVOS PENDIENTE ⏳           │
└─────────────────────────────────────────────────┘
```

**Próximo paso**: Configurar Firebase siguiendo la sección "Configuración Firebase" de este checklist.
