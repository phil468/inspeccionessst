# 🔍 Cómo Verificar que el Auto-Sync Funciona

## ✅ Cambios Realizados

### 1. **app.component.ts** - Inicializa auto-sync al cargar la app

```typescript
ngOnInit() {
  this.initializeAutoSync();
}
```

### 2. **sync.service.ts** - Logs detallados

-   ⏰ Cada 5 minutos ejecuta el intervalo
-   ✅ Muestra si sincroniza o no
-   🔄 Logs de cada paso de sincronización

### 3. **auth.service.ts** - Observable de estado

-   `authState$`: Emite `true` cuando autenticado, `false` cuando logout

---

## 🧪 Cómo Verificar

### **Opción 1: Consola del Navegador (Recomendado)**

1. **Abre la app** y haz login

2. **Abre DevTools** (`F12`) → Pestaña **Console**

3. **Deberías ver inmediatamente:**

    ```
    🚀 Usuario autenticado - Iniciando auto-sync
    ✅ Auto-sync iniciado (cada 5 minutos)
    ⏱️ Próxima sincronización en 5 minutos
    ```

4. **Espera 5 minutos** (o modifica el intervalo temporalmente)

5. **Cada 5 minutos verás:**
    ```
    ⏰ [3:17:00 PM] Auto-sync ejecutándose...
    ✅ Condiciones OK - Sincronizando
    🔄 [3:17:00 PM] Iniciando sincronización completa...
    📤 Sincronizando registros pendientes...
    📥 Descargando catálogos...
    ✅ Sincronización completa - Pendientes: 0
    ```

### **Opción 2: Reducir Intervalo (Para Pruebas Rápidas)**

Temporalmente, cambia en `environment.ts`:

```typescript
// ANTES
export const environment = {
    sync: {
        autoSyncInterval: 300000, // 5 minutos
    },
};

// PARA PRUEBAS (1 minuto)
export const environment = {
    sync: {
        autoSyncInterval: 60000, // 1 minuto
    },
};
```

**⚠️ IMPORTANTE:** Volver a 5 minutos después de probar.

### **Opción 3: Forzar Sincronización Manual**

En DevTools Console:

```javascript
// Obtener el servicio
const app = document.querySelector("app-root");
const syncService = app._applicationRef.injector.get("SyncService");

// Forzar sync ahora
await syncService.forceSyncNow();
```

### **Opción 4: Monitorear Estado en Tiempo Real**

En cualquier componente, suscríbete:

```typescript
this.syncService.syncStatus$.subscribe((status) => {
    console.log("📊 Estado Sync:", {
        sincronizando: status.syncing,
        ultimaSync: status.lastSync,
        pendientes: status.pendingCount,
        error: status.error,
    });
});
```

---

## 📊 Logs Esperados

### **Al Iniciar App (Login)**

```
🚀 Iniciando sincronización automática...
🚀 Usuario autenticado - Iniciando auto-sync
✅ Auto-sync iniciado (cada 5 minutos)
⏱️ Próxima sincronización en 5 minutos
```

### **Cada 5 Minutos (Con Internet y Autenticado)**

```
⏰ [3:17:00 PM] Auto-sync ejecutándose...
✅ Condiciones OK - Sincronizando
🔄 [3:17:00 PM] Iniciando sincronización completa...
📤 Sincronizando registros pendientes...
📥 Descargando catálogos...
✅ Sincronización completa - Pendientes: 2
```

### **Si No Hay Internet**

```
⏰ [3:22:00 PM] Auto-sync ejecutándose...
❌ No sincroniza - Online: false, Auth: true
```

### **Si No Está Autenticado**

```
⏰ [3:27:00 PM] Auto-sync ejecutándose...
❌ No sincroniza - Online: true, Auth: false
```

### **Al Hacer Logout**

```
🛑 Usuario no autenticado - Deteniendo auto-sync
Auto-sync detenido
```

---

## 🔍 Verificación Visual en la App

### **Indicadores en registro-lista.page.html:**

```html
<ion-chip color="success" *ngIf="syncStatus.lastSync">
    <ion-icon name="time-outline"></ion-icon>
    <ion-label>
        Última sync: {{ syncStatus.lastSync | date:'shortTime' }}
    </ion-label>
</ion-chip>
```

Verás la hora actualizarse cada 5 minutos.

---

## ⚙️ Configuración Actual

| Parámetro         | Valor     | Ubicación          |
| ----------------- | --------- | ------------------ |
| Intervalo         | 5 minutos | `environment.ts`   |
| Auto-inicio       | ✅ Sí     | `app.component.ts` |
| Requiere Auth     | ✅ Sí     | `sync.service.ts`  |
| Requiere Internet | ✅ Sí     | `sync.service.ts`  |

---

## 🐛 Troubleshooting

### **No veo logs**

1. Verifica que estés en la pestaña **Console** de DevTools
2. Quita filtros de logs (botón "Clear console filters")
3. Recarga la app (`Ctrl+R`)

### **No se ejecuta cada 5 minutos**

1. Verifica en Console que dice "Auto-sync iniciado"
2. Si no aparece, revisa que estés autenticado
3. Comprueba `authService.isAuthenticated` en Console:
    ```javascript
    const authService = app._applicationRef.injector.get("AuthService");
    console.log("Autenticado:", authService.isAuthenticated);
    ```

### **Se ejecuta pero no sincroniza**

1. Verifica que tengas internet
2. Verifica que estés autenticado
3. Revisa los logs que muestran la razón:
    ```
    ❌ No sincroniza - Online: false, Auth: true
    ```

---

## 📱 Funcionamiento Independiente de Páginas

**✅ SÍ, funciona independientemente de la página:**

-   El auto-sync se inicia en `app.component.ts` (raíz de la app)
-   El intervalo corre en el servicio (singleton)
-   No importa en qué página estés
-   Funciona incluso si cambias de página
-   Funciona en background (mientras la app esté abierta)

**⚠️ SE DETIENE SI:**

-   Cierras la app completamente
-   Haces logout
-   Matas el proceso del navegador/app

**🔄 SE REINICIA SI:**

-   Vuelves a abrir la app (si ya estabas autenticado)
-   Haces login nuevamente

---

## 🎯 Test Completo

1. ✅ Abre la app → Deberías ver "Auto-sync iniciado"
2. ✅ Navega a diferentes páginas → El intervalo sigue corriendo
3. ✅ Espera 5 minutos → Verás el log "Auto-sync ejecutándose"
4. ✅ Desconecta internet → Log dice "Online: false"
5. ✅ Reconecta internet → Próximo intervalo sincroniza
6. ✅ Haz logout → Log dice "Deteniendo auto-sync"
7. ✅ Haz login → Log dice "Iniciando auto-sync"

---

## 📝 Resumen

| ✅ Implementado | Descripción                                                      |
| --------------- | ---------------------------------------------------------------- |
| Auto-inicio     | Se inicia automáticamente al abrir la app (si estás autenticado) |
| Intervalo       | Ejecuta cada 5 minutos                                           |
| Logs            | Detallados en Console para debugging                             |
| Independiente   | Funciona en cualquier página                                     |
| Condicional     | Solo sincroniza si hay internet Y estás autenticado              |
| Observable      | Puedes suscribirte a cambios de estado                           |
| Manual          | Puedes forzar sync con botón                                     |

---

¡Ahora el auto-sync funciona correctamente! 🎉
