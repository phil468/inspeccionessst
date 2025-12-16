# Menú Lateral con Tabs y Permisos - Guía de Uso

## ✅ Implementación Completa

Se ha implementado un sistema de navegación con **tabs en la parte inferior** y un **menú lateral** que se abre desde la pestaña "Más", con validación de permisos.

## 🎯 Características Implementadas

### 1. **Tabs de Navegación Inferior**

Ubicados en la parte inferior de la pantalla (cuando estás autenticado):

- **Inicio** 🏠 - Navega a la página principal
- **Nuevo** ➕ - Crea un nuevo registro de calibración
- **Registros** 📋 - Lista de registros existentes
- **Más** ☰ - Abre el menú lateral

### 2. **Menú Lateral**

Se abre desde el lado derecho al presionar "Más":

#### Información de Usuario

- Muestra avatar (icono de persona)
- Nombre del usuario actual
- Email del usuario

#### Opciones de Navegación

- **Inicio** - Página principal
- **Registros** - Lista de registros
- **Mantenimiento** (submenu con accordion)
  - Campañas (solo si tiene permiso `campanias.view`)
  - Materiales (solo si tiene permiso `materiales.view`)
  - Fundos (solo si tiene permiso `fundos.view`)
  - Lotes (solo si tiene permiso `lotes.view`)
  - Motivos (solo si tiene permiso `motivos.view`)
- **Cerrar Sesión** (botón rojo al final)

### 3. **Validación de Permisos**

Cada ítem del menú verifica si el usuario tiene el permiso necesario:

```typescript
// Solo se muestra si el usuario tiene el permiso
*ngIf="hasPermission('campanias.view')"
```

Los ítems sin permisos requeridos se muestran a todos los usuarios autenticados.

## 📁 Archivos Modificados/Creados

### Nuevos Archivos:

1. **`frontend/src/app/pages/tabs/tabs.page.ts`**
   - Componente de tabs con método `openMenu()`
2. **`frontend/src/app/pages/tabs/tabs.page.html`**
   - Template con 4 tabs: Inicio, Nuevo, Registros, Más
3. **`frontend/src/app/pages/tabs/tabs.page.scss`**

   - Estilos para la barra de tabs

4. **`frontend/src/app/components/menu/menu.component.ts`**
   - Lógica del menú lateral
   - Validación de permisos
   - Navegación y cierre de sesión
5. **`frontend/src/app/components/menu/menu.component.html`**
   - Template del menú con accordion para submenús
   - Información de usuario
   - Botón de logout
6. **`frontend/src/app/components/menu/menu.component.scss`**
   - Estilos del menú lateral

### Archivos Modificados:

1. **`frontend/src/app/app.component.ts`**
   - Importa `MenuComponent`
2. **`frontend/src/app/app.component.html`**
   - Incluye `<app-menu></app-menu>`
   - Agrega id `main-content` al router-outlet
3. **`frontend/src/app/app.routes.ts`**
   - Reorganiza rutas para usar tabs como contenedor
   - Rutas autenticadas ahora son hijas de tabs

## 🔄 Estructura de Rutas Actualizada

```typescript
routes = [
  { path: "", redirectTo: "login" },
  { path: "login", component: LoginPage },
  { path: "auth/callback", component: AuthCallbackPage },
  {
    path: "",
    component: TabsPage, // ← Contenedor principal
    canActivate: [AuthGuard],
    children: [
      { path: "home", component: HomePage },
      { path: "registro-form", component: RegistroFormPage },
      { path: "registro-lista", component: RegistroListaPage },
      { path: "mantenimiento", component: MantenimientoPage },
      // ... todos los CRUDs (campanias, materiales, fundos, lotes, motivos)
    ],
  },
];
```

## 🎨 Cómo Funciona

### Flujo de Navegación:

1. Usuario inicia sesión → redirección automática a `/home`
2. Tabs aparecen en la parte inferior
3. Usuario puede navegar entre Inicio, Nuevo, Registros usando tabs
4. Al presionar "Más", se abre el menú lateral desde la derecha
5. Menú muestra solo opciones permitidas según permisos del usuario
6. Al seleccionar una opción del menú:
   - El menú se cierra automáticamente
   - Navega a la ruta seleccionada
   - Los tabs siguen visibles

### Validación de Permisos:

```typescript
// En menu.component.ts
hasPermission(permission?: string): boolean {
  if (!permission) {
    return true; // Sin restricción
  }
  return this.authService.hasPermission(permission);
}
```

### Permisos del Sistema:

- `campanias.view`, `campanias.create`, `campanias.edit`, `campanias.delete`
- `materiales.view`, `materiales.create`, `materiales.edit`, `materiales.delete`
- `fundos.view`, `fundos.create`, `fundos.edit`, `fundos.delete`
- `lotes.view`, `lotes.create`, `lotes.edit`, `lotes.delete`
- `motivos.view`, `motivos.create`, `motivos.edit`, `motivos.delete`

## 📱 Experiencia de Usuario

### En Dispositivos Móviles:

- Tabs siempre visibles en la parte inferior
- Acceso rápido a las funciones principales
- Menú lateral se desliza desde la derecha
- Submenu de Mantenimiento se expande/colapsa con animación

### Navegación Intuitiva:

- 3 tabs directos: Inicio, Nuevo, Registros
- 1 tab para acceder a opciones avanzadas (Más)
- Menú organizado por categorías
- Ítems deshabilitados si no hay permisos (no se muestran)

## 🔐 Seguridad

### Protección por Roles:

- AuthGuard protege todas las rutas autenticadas
- Cada ítem del menú valida permisos en tiempo real
- Usuario sin permisos NO ve las opciones
- Doble validación: frontend (UI) + backend (API)

### Cierre de Sesión:

El botón "Cerrar Sesión" en el menú:

1. Cierra el menú lateral
2. Llama a `authService.logout()`
3. Limpia token y datos locales
4. Redirecciona a `/login`
5. Detiene auto-sync

## 🚀 Próximos Pasos (Opcional)

### Personalización del Menú:

Si deseas agregar más ítems al menú, edita el array `menuItems` en `menu.component.ts`:

```typescript
menuItems: MenuItem[] = [
  {
    title: 'Mi Nueva Opción',
    icon: 'rocket-outline',
    route: '/mi-ruta',
    permission: 'mi.permiso', // opcional
  },
  // ... más items
];
```

### Iconos Disponibles:

Usa iconos de Ionicons: https://ionic.io/ionicons

- Ya importados: home, list, settings, flask, cube, business, grid, flag, logOut, personCircle
- Para agregar nuevos: importar en `menu.component.ts` → `addIcons({...})`

## ✅ Verificación de Funcionamiento

### Prueba el Sistema:

1. Inicia sesión como Administrator
2. Verifica que aparezcan los 4 tabs en la parte inferior
3. Presiona "Más" → el menú lateral se abre desde la derecha
4. Expande "Mantenimiento" → verás las 5 opciones (tienes todos los permisos)
5. Navega a cualquier opción → el menú se cierra automáticamente
6. Presiona "Cerrar Sesión" → redirige a login

### Con Otros Roles:

Si inicias sesión con un rol diferente (por ejemplo, "Operador"), solo verás las opciones del menú para las cuales tienes permisos.

## 📝 Notas Técnicas

- **Menú Side**: `side="end"` → se abre desde la derecha
- **Menú ID**: `menuId="main-menu"` → identificador único
- **Content ID**: `id="main-content"` → vinculado al router-outlet
- **Accordion**: `ion-accordion-group` → para submenus expandibles
- **MenuController**: Servicio de Ionic para controlar menús programáticamente

---

**Implementado**: Tabs + Menú Lateral con Permisos ✅  
**Compatibilidad**: Ionic 8 + Angular 20  
**Funcionamiento**: Offline-first compatible
