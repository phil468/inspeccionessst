# Pasos para Probar la Aplicación

## 1. Verificar Backend Laravel

### Iniciar Servidor Backend

```powershell
cd c:\laragon\www\calibracion
php artisan serve
```

Debería ver:

```
Starting Laravel development server: http://127.0.0.1:8000
```

### Verificar Base de Datos

```powershell
# Asegurarse de que las migraciones estén ejecutadas
php artisan migrate

# Ejecutar seeders para tener datos de prueba
php artisan db:seed --class=RolesAndPermissionsSeeder
php artisan db:seed --class=CatalogosSeeder
```

### Crear Usuario de Prueba (Opcional)

```powershell
php artisan user:manage create --email=tu@email.com --name="Tu Nombre" --role=Administrador
```

---

## 2. Iniciar Frontend Ionic

### En otra terminal PowerShell:

```powershell
cd c:\laragon\www\calibracion\frontend
ionic serve
```

Debería abrir automáticamente en `http://localhost:8100`

---

## 3. Flujo de Testing

### A. Login con Microsoft OAuth

1. Navegar a `http://localhost:8100`
2. Debería redirigir automáticamente a `/login`
3. Hacer clic en "Iniciar sesión con Microsoft"
4. Se abrirá ventana de Microsoft para autenticación
5. Después de autorizar, redirige a callback
6. El token se guarda en localStorage
7. Redirige a `/home`

### B. Dashboard (HomePage)

1. Verificar que muestre tu nombre de usuario
2. Ver estado de sincronización (inicialmente 0/0/0)
3. Ver cards de navegación:
   - "CREAR REGISTRO" (si tienes permiso `registros.create`)
   - "HISTORIAL" (si tienes permiso `registros.view`)

### C. Crear Registro

1. Clic en "CREAR REGISTRO"
2. Esperar a que carguen los catálogos desde IndexedDB
   - Si están vacíos, se descargan automáticamente del backend
3. Llenar el formulario:
   - Seleccionar Campaña
   - Buscar y seleccionar Material
   - Ingresar Cantidad (número decimal)
   - Ingresar Número de Tractor
   - Seleccionar Fundo
   - Seleccionar Lote
   - Seleccionar Motivo
   - Observaciones (opcional)
4. Clic en "Guardar Registro"
5. Debería:
   - Guardar en IndexedDB con UUID local
   - Si hay conexión, sincronizar automáticamente
   - Mostrar toast de éxito
   - Navegar a `/registro-lista`

### D. Ver Historial

1. Ver lista de registros agrupados por fecha
2. Verificar estado de sincronización (iconos verde/amarillo)
3. Probar búsqueda: escribir número de tractor
4. Pull-to-refresh para sincronizar

### E. Testing Offline

1. Abrir DevTools (F12)
2. Ir a Network tab → Cambiar a "Offline"
3. Crear nuevo registro
   - Debería guardar localmente
   - Icono amarillo (pendiente de sync)
4. Cambiar a "Online"
5. Pull-to-refresh en historial
6. Verificar que el icono cambie a verde (sincronizado)

---

## 4. Verificación en Base de Datos

### Ver registros en MySQL:

```sql
SELECT
  r.id,
  r.local_id,
  r.cantidad,
  r.numero_tractor,
  r.synced,
  u.name AS usuario,
  c.nombre AS campania,
  m.nombre AS material,
  r.created_at
FROM registros r
LEFT JOIN users u ON r.user_id = u.id
LEFT JOIN campanias c ON r.campania_id = c.id
LEFT JOIN materiales m ON r.material_id = m.id
ORDER BY r.created_at DESC
LIMIT 10;
```

---

## 5. Posibles Errores y Soluciones

### Error: "Network request failed"

**Causa:** Backend no está corriendo
**Solución:**

```powershell
cd c:\laragon\www\calibracion
php artisan serve
```

### Error: CORS

**Causa:** Laravel bloqueando requests desde localhost:8100
**Verificar:** `config/cors.php`

```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['http://localhost:8100'],
'supports_credentials' => true,
```

### Error: "Cannot find module 'dexie'"

**Ya solucionado** - Dexie ya está instalado en package.json

### Error: Token inválido (401)

**Causa:** Token expirado o sesión limpiada
**Solución:** Hacer logout y volver a hacer login

### Error: No aparecen catálogos en formulario

**Causa:** Base de datos vacía
**Solución:**

```powershell
php artisan db:seed --class=CatalogosSeeder
```

---

## 6. Checklist de Funcionalidades

- [ ] Login con Microsoft OAuth funciona
- [ ] Redirección automática después de login
- [ ] Dashboard muestra información del usuario
- [ ] Estado de sincronización se actualiza
- [ ] Catálogos se descargan automáticamente
- [ ] Formulario guarda registros localmente
- [ ] Registros se sincronizan cuando hay conexión
- [ ] Historial muestra registros agrupados por fecha
- [ ] Búsqueda funciona correctamente
- [ ] Pull-to-refresh sincroniza
- [ ] Indicadores de estado (online/offline) funcionan
- [ ] Iconos de sync (verde/amarillo) correctos
- [ ] Logout limpia sesión
- [ ] Navegación entre páginas fluida
- [ ] Guards protegen rutas correctamente

---

## 7. Comandos Útiles

### Backend

```powershell
# Ver logs en tiempo real
tail -f storage/logs/laravel.log

# Limpiar caché
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Ver rutas API
php artisan route:list --path=api

# Crear usuario
php artisan user:manage create
```

### Frontend

```powershell
# Build para producción
ionic build --prod

# Ver en navegador específico
ionic serve --browser=chrome

# Limpiar caché de Ionic
ionic cache clean

# Sincronizar con Capacitor
npx cap sync

# Abrir en Android Studio
npx cap open android
```

---

## 8. Debugging con DevTools

### localStorage

En la consola del navegador:

```javascript
// Ver token
localStorage.getItem("auth_token");

// Ver usuario
JSON.parse(localStorage.getItem("auth_user"));

// Limpiar sesión manualmente
localStorage.clear();
```

### IndexedDB

1. DevTools → Application tab
2. IndexedDB → calibracion_db
3. Ver tablas: registros, campanias, materiales, etc.

---

## 9. Próximos Pasos (Después de Testing)

- [ ] Implementar detección de red con @capacitor/network
- [ ] Agregar sincronización automática periódica
- [ ] Implementar resolución de conflictos
- [ ] Agregar página de detalles de registro
- [ ] Crear CRUDs para administración de catálogos
- [ ] Agregar exportación a Excel/PDF
- [ ] Implementar notificaciones push
- [ ] Agregar modo oscuro
- [ ] Optimizar rendimiento (virtual scroll, lazy loading)
- [ ] Testing E2E con Cypress o Playwright

---

**¡Listo para Probar!** 🚀

Si encuentras algún error, revisa la consola del navegador y los logs de Laravel para más detalles.
