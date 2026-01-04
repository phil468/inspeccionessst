# Configuración de Push Notifications

Esta guía describe cómo configurar las notificaciones push usando Firebase Cloud Messaging (FCM) para la aplicación de inspecciones SST.

## 1. Configuración de Firebase

### 1.1. Crear Proyecto Firebase

1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Hacer clic en "Agregar proyecto"
3. Nombre del proyecto: `inspeccionessst` (o el que prefieras)
4. Aceptar los términos y crear el proyecto

### 1.2. Obtener Server Key (Backend)

1. En Firebase Console, ir a **Configuración del proyecto** (ícono de engranaje)
2. Ir a la pestaña **Cloud Messaging**
3. En la sección **Cloud Messaging API (Legacy)**, copiar el **Server Key**
4. Agregar al archivo `.env` del backend:

```env
FCM_SERVER_KEY=tu_server_key_aqui
```

> **Nota**: Si no ves la API legacy, necesitas habilitarla en Google Cloud Console

### 1.3. Configurar Android

1. En Firebase Console, agregar una aplicación Android
2. Package name: `com.inspeccionessst.app` (o el que uses en `capacitor.config.ts`)
3. Descargar el archivo `google-services.json`
4. Colocar en: `frontend/android/app/google-services.json`

### 1.4. Configurar iOS

1. En Firebase Console, agregar una aplicación iOS
2. Bundle ID: `com.inspeccionessst.app` (o el que uses en `capacitor.config.ts`)
3. Descargar el archivo `GoogleService-Info.plist`
4. Colocar en: `frontend/ios/App/App/GoogleService-Info.plist`

## 2. Configuración de Capacitor

### 2.1. Verificar capacitor.config.ts

El archivo `frontend/capacitor.config.ts` debe tener:

```typescript
import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
    appId: "com.inspeccionessst.app",
    appName: "Inspecciones SST",
    webDir: "www",
    server: {
        androidScheme: "https",
    },
    plugins: {
        PushNotifications: {
            presentationOptions: ["badge", "sound", "alert"],
        },
    },
};

export default config;
```

### 2.2. Sincronizar con plataformas nativas

```bash
cd frontend
npx cap sync
```

## 3. Configuración de Permisos

### 3.1. Android (AndroidManifest.xml)

El archivo `frontend/android/app/src/main/AndroidManifest.xml` debe incluir:

```xml
<!-- Firebase Cloud Messaging -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<application>
    <!-- ... otros elementos ... -->

    <!-- Firebase Cloud Messaging Service -->
    <service
        android:name="com.google.firebase.messaging.FirebaseMessagingService"
        android:exported="false">
        <intent-filter>
            <action android:name="com.google.firebase.MESSAGING_EVENT" />
        </intent-filter>
    </service>
</application>
```

### 3.2. iOS (Info.plist)

El archivo `frontend/ios/App/App/Info.plist` debe incluir:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
</array>
```

## 4. Verificación de la Instalación

### 4.1. Backend

Verificar que el servicio esté cargado correctamente:

```bash
php artisan tinker
```

```php
$service = app(App\Services\PushNotificationService::class);
$service->sendToToken('test_token', 'Test', 'Mensaje de prueba');
```

### 4.2. Frontend

1. Ejecutar la aplicación en un dispositivo real (no funciona en emulador iOS)
2. Verificar los logs del navegador/dispositivo
3. Buscar mensajes de inicialización del servicio
4. El token debe aparecer en la consola

### 4.3. Prueba de Notificación

Usar el endpoint de prueba:

```bash
curl -X POST http://localhost:8000/api/push-notifications/test \
  -H "Authorization: Bearer tu_token_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Prueba",
    "body": "Mensaje de prueba"
  }'
```

## 5. Flujo de Notificaciones

### 5.1. Registro del Token

1. Usuario inicia sesión en la app
2. `app.component.ts` llama a `initializePushNotifications()`
3. `PushNotificationService` solicita permisos
4. Al concederse, obtiene el token FCM
5. Token se envía al backend via POST `/api/push-notifications/register`
6. Backend almacena en tabla `push_notification_tokens`

### 5.2. Envío de Notificaciones

1. Inspección se marca como completada
2. `NotificationService` agrupa resultados por personal
3. Para cada personal:
    - Envía email con detalles
    - Busca usuario asociado via `personal_id`
    - Si existe usuario, envía push notification
    - Push llega a todos los dispositivos activos del usuario

### 5.3. Recepción en la App

**Foreground (app abierta):**

-   Se muestra un toast/alert local
-   No se muestra notificación del sistema

**Background (app cerrada/minimizada):**

-   Se muestra notificación del sistema
-   Al hacer tap, se abre la app
-   Se navega a `/tabs/inspecciones/detalle/{id}`

## 6. Limpieza de Tokens

Los tokens inactivos se pueden limpiar manualmente o con un cron job:

```php
// Eliminar tokens no usados en 30 días
$service = app(App\Services\PushNotificationService::class);
$deleted = $service->cleanInactiveTokens(30);
```

Para automatizar, agregar a `app/Console/Kernel.php`:

```php
protected function schedule(Schedule $schedule)
{
    // Limpiar tokens inactivos cada semana
    $schedule->call(function () {
        app(App\Services\PushNotificationService::class)->cleanInactiveTokens(30);
    })->weekly();
}
```

## 7. Troubleshooting

### Token no se registra

**Problema**: No aparece en logs "Token registrado exitosamente"

**Soluciones**:

-   Verificar que el dispositivo tenga internet
-   Verificar permisos de notificaciones en configuración del dispositivo
-   Revisar logs nativos (Xcode/Android Studio)
-   Confirmar que `google-services.json` / `GoogleService-Info.plist` estén correctos

### Notificaciones no llegan

**Problema**: Token registrado pero no llegan notificaciones

**Soluciones**:

-   Verificar que `FCM_SERVER_KEY` esté en `.env`
-   Verificar logs del backend: `storage/logs/laravel.log`
-   Probar con el endpoint `/api/push-notifications/test`
-   Verificar que el token esté activo: GET `/api/push-notifications/tokens`

### Error 401 Unauthorized en FCM

**Problema**: FCM responde con 401

**Soluciones**:

-   Verificar que el Server Key sea correcto
-   Asegurarse de estar usando la API Legacy (no la nueva)
-   Regenerar el Server Key en Firebase Console

### App no navega al hacer tap

**Problema**: Notificación llega pero no navega a inspección

**Soluciones**:

-   Verificar que `data.inspeccion_id` esté en el payload
-   Revisar método `handleNotificationTap()` en `push-notification.service.ts`
-   Confirmar que la ruta exista en el router de Angular

## 8. Consideraciones de Producción

### Seguridad

-   ✅ Nunca exponer el Server Key en el frontend
-   ✅ Validar que el usuario autenticado pueda recibir notificaciones
-   ✅ Implementar rate limiting en endpoints de push

### Escalabilidad

-   Para >10,000 usuarios, considerar usar Firebase Cloud Functions
-   Para notificaciones masivas, usar Topic Subscriptions
-   Implementar queue jobs para envío asíncrono

### Monitoreo

-   Registrar métricas de tokens registrados/activos
-   Monitorear tasa de entrega de notificaciones
-   Alertar si FCM devuelve muchos errores

## 9. Referencias

-   [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
-   [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
-   [FCM HTTP Protocol](https://firebase.google.com/docs/cloud-messaging/http-server-ref)
