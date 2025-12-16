# Instrucciones para Depurar el Menú Lateral

## Pasos para Verificar el Problema

### 1. Abre la Aplicación en el Navegador

```bash
cd c:\laragon\www\calibracion\frontend
ionic serve
```

### 2. Abre las Herramientas de Desarrollo (F12)

- Pestaña **Console** para ver los logs

### 3. Inicia Sesión

- Ve a la aplicación y haz login

### 4. Presiona el Botón "Más"

### 5. Verifica en la Consola

Deberías ver estos mensajes:

```
🔍 Intentando abrir menú lateral...
📋 Menú encontrado: [HTMLIonMenuElement o null]
✓ Menú habilitado: true/false
✅ Menú abierto: true/false
```

## Posibles Resultados

### Caso 1: "Menú encontrado: null"

**Problema**: El componente `<app-menu>` no se está renderizando.
**Solución**: Verificar que MenuComponent esté importado correctamente en tabs.page.ts

### Caso 2: "Menú habilitado: false"

**Problema**: El menú está deshabilitado.
**Solución**: El código ya incluye `menuController.enable(true, 'main-menu')`

### Caso 3: "❌ Error abriendo menú: ..."

**Problema**: Error específico al abrir.
**Solución**: Revisar el mensaje de error específico

## Verificación Manual del DOM

En la consola de Chrome/Edge, ejecuta:

```javascript
// Verificar si el menú existe en el DOM
document.querySelector("ion-menu");

// Verificar el contentId
document.querySelector("#tabs-content");

// Verificar la estructura
console.log(document.querySelector("app-menu"));
```

## Prueba Alternativa: Abrir Menú Manualmente

En la consola del navegador:

```javascript
// Obtener el MenuController
const menu = document.querySelector("ion-menu");
if (menu) {
  menu.open();
} else {
  console.log("❌ Menú no encontrado en el DOM");
}
```

## Checklist de Verificación

- [ ] El componente `<app-menu>` aparece en el DOM (inspeccionar elemento)
- [ ] El `<ion-menu>` está dentro de `<app-menu>`
- [ ] El elemento con id `tabs-content` existe
- [ ] Los console.log aparecen al hacer clic en "Más"
- [ ] No hay errores en la consola del navegador

## Si el Menú No Aparece en el DOM

Esto significa que `<app-menu>` no se está renderizando. Verifica:

1. **tabs.page.ts** debe importar MenuComponent:

   ```typescript
   imports: [CommonModule, IonicModule, MenuComponent];
   ```

2. **tabs.page.html** debe tener:

   ```html
   <app-menu></app-menu>
   ```

3. **menu.component.ts** debe ser standalone:
   ```typescript
   standalone: true;
   ```

## Información Adicional

Si ves el error en la consola, copia el mensaje completo para análisis detallado.
