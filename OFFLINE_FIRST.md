# 📱 Sistema Offline-First

## 📋 ¿Cómo funciona?

El sistema **offline-first** está diseñado para que tu aplicación funcione perfectamente **con o sin conexión a internet**. Los datos se almacenan localmente primero y se sincronizan con el servidor cuando hay conexión.

---

## 🔄 Flujo de Trabajo

### 1️⃣ **Carga Inicial de Datos**

```
Usuario abre la app
        ↓
Cargar datos desde IndexedDB inmediatamente (RÁPIDO) ⚡
        ↓
Mostrar datos al usuario
        ↓
¿Hay internet?
    ├─ SÍ → Actualizar desde API en segundo plano
    │        ├─ Guardar en IndexedDB
    │        └─ Actualizar UI con datos frescos
    └─ NO → Usar solo datos locales (offline)
```

### 2️⃣ **Creación/Edición de Datos**

```
Usuario crea/edita registro
        ↓
Guardar en IndexedDB localmente (SIEMPRE)
        ↓
¿Hay internet?
    ├─ SÍ → Enviar a API inmediatamente
    │        ├─ Si falla: marcar como pendiente
    │        └─ Si OK: marcar como sincronizado
    └─ NO → Marcar como pendiente de sincronización
        ↓
Cuando vuelva internet → Sincronizar automáticamente
```

---

## 🗄️ Almacenamiento Local (IndexedDB)

### Tablas Almacenadas

| Tabla        | Descripción              | Campos Clave                    |
| ------------ | ------------------------ | ------------------------------- |
| `campanias`  | Campañas agrícolas       | id, nombre, descripcion, activo |
| `materiales` | Materiales calibrados    | id, codigo, nombre, activo      |
| `fundos`     | Fundos/predios           | id, nombre, ubicacion, activo   |
| `lotes`      | Lotes por fundo          | id, fundo_id, codigo, activo    |
| `motivos`    | Motivos de calibración   | id, nombre, activo              |
| `registros`  | Registros de calibración | local_id, synced, user_id       |

### Ubicación de los Datos

Los datos se almacenan en **IndexedDB del navegador**:

-   **Base de datos**: `calibracion_db`
-   **Versión**: 1
-   **Persistente**: Sí (los datos persisten entre sesiones)

Puedes inspeccionar los datos en:

-   **Chrome/Edge DevTools**: `F12` → Application → Storage → IndexedDB → `calibracion_db`
-   **Firefox DevTools**: `F12` → Storage → IndexedDB → `calibracion_db`

---

## 📂 Arquitectura de Servicios

### 🔧 **DatabaseService**

```typescript
// Maneja la conexión directa con IndexedDB usando Dexie
db.campanias.toArray()    // Obtener todas las campañas
db.registros.add(...)      // Agregar registro
```

### 💾 **StorageService**

```typescript
// Capa de abstracción sobre DatabaseService
getCampanias(); // Obtener campañas
updateCampanias(data); // Actualizar caché de campañas
saveCatalogos(catalogos); // Guardar todos los catálogos
```

### 🔄 **SyncService**

```typescript
// Maneja la sincronización con el servidor
syncAll(); // Sincronizar todo
downloadCatalogos(); // Descargar catálogos del servidor
syncRegistros(); // Enviar registros pendientes
```

### 🌐 **NetworkService**

```typescript
// Detecta el estado de conexión
getCurrentStatus(); // ¿Hay internet?
isOnline$; // Observable de estado de red
```

---

## 🎯 Implementación en Páginas CRUD

Todas las páginas de mantenimiento siguen este patrón:

```typescript
async loadCampanias() {
  this.loading = true;
  try {
    // 1️⃣ OFFLINE-FIRST: Cargar desde IndexedDB primero
    this.campanias = await this.storageService.getCampanias();
    this.campaniasFiltradas = this.campanias;
    // ✅ Usuario ve datos inmediatamente

    // 2️⃣ Si hay internet, actualizar en segundo plano
    const isOnline = await this.networkService.getCurrentStatus();
    if (isOnline) {
      try {
        const response = await this.apiService.get('/campanias');
        if (response.data) {
          // Actualizar IndexedDB con datos frescos
          await this.storageService.updateCampanias(response.data);

          // Actualizar UI
          this.campanias = response.data;
          this.campaniasFiltradas = this.campanias;
          // ✅ Usuario ve datos actualizados del servidor
        }
      } catch (apiError) {
        // ⚠️ Error de API, pero el usuario ya tiene datos locales
        console.warn('Usando datos locales:', apiError);
      }
    }
  } catch (error) {
    // ❌ Error crítico
    this.showToast('Error al cargar campañas', 'danger');
  } finally {
    this.loading = false;
  }
}
```

---

## 🔍 Ventajas del Offline-First

### ✅ **Para el Usuario**

1. **Velocidad**: Los datos se muestran instantáneamente desde IndexedDB
2. **Funciona sin internet**: Puede trabajar en campo sin cobertura
3. **No pierde datos**: Todo se guarda localmente y se sincroniza después
4. **UX fluida**: No ve errores por falta de conexión

### ✅ **Para el Desarrollador**

1. **Resiliente**: La app no se rompe sin internet
2. **Cacheable**: Reduce carga en el servidor
3. **Sincronización automática**: SyncService maneja todo
4. **Fácil debugging**: Puedes ver los datos en DevTools

---

## 🧪 Pruebas del Sistema

### Escenario 1: Primera vez (sin datos locales)

```bash
1. Usuario abre la app por primera vez
2. IndexedDB está vacío
3. Si hay internet → descarga catálogos
4. Guarda en IndexedDB
5. Usuario ve los datos
```

### Escenario 2: Con datos locales (offline)

```bash
1. Usuario abre la app sin internet
2. Carga datos desde IndexedDB (última sincronización)
3. Usuario ve datos (aunque no sean los más recientes)
4. Puede crear/editar registros
5. Se marcan como pendientes de sincronización
```

### Escenario 3: Con datos locales (online)

```bash
1. Usuario abre la app con internet
2. Muestra datos de IndexedDB inmediatamente
3. En segundo plano, hace fetch a la API
4. Actualiza IndexedDB con datos frescos
5. Actualiza la UI con los datos nuevos
```

### Escenario 4: Pérdida de conexión durante uso

```bash
1. Usuario está usando la app con internet
2. Pierde la conexión
3. NetworkService detecta el cambio
4. Nuevos registros se guardan solo en IndexedDB
5. Cuando vuelva internet → SyncService sincroniza automáticamente
```

---

## 🛠️ Comandos de Sincronización

### Verificar Estado de Sincronización

```typescript
// En DevTools Console
const syncService = app.injector.get(SyncService);

// Ver registros pendientes
await syncService.getPendingCount();

// Forzar sincronización
await syncService.forceSyncNow();

// Obtener estado local
await syncService.getLocalStatus();
```

### Limpiar Datos Locales

```typescript
const storageService = app.injector.get(StorageService);

// Limpiar todo
await storageService.clearAll();

// Verificar si hay catálogos
await storageService.hasCatalogos();
```

---

## 📊 Monitoreo en Tiempo Real

### Estado de Red

```typescript
// En cualquier componente
this.networkService.isOnline$.subscribe((online) => {
    console.log("Estado de red:", online ? "Online" : "Offline");
});
```

### Estado de Sincronización

```typescript
this.syncService.syncStatus$.subscribe((status) => {
    console.log("Pendientes:", status.pendingCount);
    console.log("Última sync:", status.lastSync);
    console.log("Sincronizando:", status.syncing);
});
```

---

## ⚙️ Configuración

### environment.ts

```typescript
export const environment = {
    storage: {
        dbName: "calibracion_db",
        dbVersion: 1,
    },
    sync: {
        autoSyncInterval: 300000, // 5 minutos
    },
};
```

---

## 🐛 Debugging

### Ver datos en IndexedDB

1. Abrir DevTools (`F12`)
2. Ir a **Application** → **Storage** → **IndexedDB**
3. Expandir `calibracion_db`
4. Ver tablas: campanias, materiales, fundos, lotes, motivos, registros

### Logs importantes

```typescript
// Activar en Chrome DevTools
localStorage.setItem("debug", "true");

// Los servicios loggean:
// ✅ "Campanias cargadas desde IndexedDB"
// 🌐 "Actualizando desde API..."
// ⚠️  "Error al actualizar desde API, usando datos locales"
// 🔄 "Sincronizando registros pendientes..."
```

---

## 🎓 Resumen

| Aspecto            | Descripción                      |
| ------------------ | -------------------------------- |
| **Almacenamiento** | IndexedDB (Dexie)                |
| **Estrategia**     | Cache-first, Network-fallback    |
| **Sincronización** | Automática cada 5 min + manual   |
| **Detección red**  | Capacitor Network API            |
| **Estado offline** | Totalmente funcional             |
| **Persistencia**   | Permanente (hasta limpiar caché) |

---

## 📝 Próximos Pasos

-   [x] Implementar offline-first en páginas CRUD
-   [x] Agregar métodos de actualización específicos
-   [x] Integrar NetworkService
-   [ ] Agregar indicador visual de estado de sincronización
-   [ ] Implementar cola de sincronización con reintentos
-   [ ] Agregar manejo de conflictos de sincronización

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs en DevTools Console
2. Inspecciona IndexedDB en DevTools
3. Verifica `syncStatus$` y `isOnline$`
4. Ejecuta `forceSyncNow()` si hay problemas
