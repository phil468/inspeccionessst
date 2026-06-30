# Cronograma Final de Desarrollo de Mejoras

Fecha de elaboración: 19-05-2026

## 1. Supuestos y definiciones clave

- Capacidad: 1 desarrollador fullstack (24h/semana)
- Metodología: planificación semanal
- Fecha límite: no definida
- Integración consolidado (P01): destino es archivo en SharePoint corporativo
- Sincronización usuarios (P07): fuente es API RRHH
- Categorías de inspección (P08): administrables desde módulo de mantenimiento
- Guardado de avance (P05): autosave obligatorio (borrador automático)

## 2. Estimación y dependencias

| ID                           | Propuesta                                 | Complejidad | Horas |
| ---------------------------- | ----------------------------------------- | ----------- | ----: |
| P01                          | Integración SharePoint (consolidado)      | Alta        |    60 |
| P02                          | Cambio de imagen en levantamientos        | Media       |    20 |
| P03                          | Eliminación campo Vigencia                | Baja        |     8 |
| P04                          | Asignación automática de visores editable | Alta        |    32 |
| P05                          | Alerta + autosave obligatorio             | Alta        |    40 |
| P06                          | Comentarios en imágenes de levantamiento  | Media       |    16 |
| P07                          | Sync automática usuarios (API RRHH)       | Alta        |    44 |
| P08                          | Categoría de inspección administrable     | Media       |    24 |
| QA, documentación, hardening |                                           | 28          |
| Contingencia (15%)           |                                           | 37          |
| **Total estimado**           |                                           | 309         |

Duración estimada: 13 semanas (con buffer y QA).

## 3. Gantt resumido (semanal)

| Propuesta             | S1  | S2  | S3  | S4  | S5  | S6  | S7  | S8  | S9  | S10 | S11 | S12 | S13 |
| --------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P03 Eliminar Vigencia | X   | x   |     |     |     |     |     |     |     |     |     |     |     |
| P08 Categoría admin.  | X   | X   | x   |     |     |     |     |     |     |     |     |     |     |
| P02 Cambio imagen     |     | X   | X   | x   |     |     |     |     |     |     |     |     |     |
| P06 Comentarios img.  |     |     | X   | X   | x   |     |     |     |     |     |     |     |     |
| P05 Autosave+alerta   |     |     |     | X   | X   | X   | x   |     |     |     |     |     |     |
| P04 Auto visores      |     |     |     |     | X   | X   | X   | x   |     |     |     |     |     |
| P07 Sync usuarios     |     |     |     |     |     |     | X   | X   | X   | x   |     |     |     |
| P01 SharePoint        |     |     |     |     |     |     |     |     | X   | X   | X   | x   |     |
| QA, hardening         |     |     |     |     |     |     |     |     |     |     | X   | X   | x   |
| Documentación         |     |     |     |     |     |     |     |     |     |     |     | X   | X   |

## 4. Hitos y entregables por semana

### Semana 1

- P03: eliminar campo Vigencia (frontend, backend, migraciones)
- P08: diseño de modelo y UI para categorías administrables

### Semana 2

- P08: CRUD de categorías en mantenimiento, validación en formulario inspección
- P02: inicio de lógica de reemplazo de imagen

### Semana 3

- P02: finalizar reemplazo de imagen, pruebas móviles
- P06: inicio de comentarios por imagen

### Semana 4

- P06: finalizar comentarios por imagen
- P05: diseño de eventos de autosave y alerta de salida

### Semana 5

- P05: implementación de autosave obligatorio (borrador local)
- P04: diseño de reglas de autoasignación de visores

### Semana 6

- P05: pop-up de confirmación, recuperación de borrador
- P04: backend de autoasignación y edición manual de visores

### Semana 7

- P04: integración frontend y pruebas
- P07: análisis de API RRHH y pruebas de consumo

### Semana 8

- P07: desarrollo de sincronización automática de usuarios

### Semana 9

- P07: pruebas de consistencia, logs y manejo de errores
- P01: diseño de integración con SharePoint (API, permisos, formato archivo)

### Semana 10

- P01: desarrollo de integración, jobs y trazabilidad

### Semana 11

- P01: cierre técnico y validación de datos en SharePoint
- QA integral inter-módulos

### Semana 12

- Hardening, ajustes por feedback, checklist de salida
- Documentación técnica y operativa

### Semana 13 (buffer)

- Contingencia para integración, cambios de último momento o adelanto de salida

## 5. Criterios de aceptación finales

- P01: datos de inspecciones sincronizados automáticamente a archivo SharePoint, con logs y reintentos.
- P02: reemplazo de imagen disponible sin eliminar registro, con historial de cambios.
- P03: campo Vigencia removido de UI, validaciones y base de datos.
- P04: visores sugeridos automáticamente por responsable, editable por usuario.
- P05: autosave obligatorio y recuperación de avance, alerta de salida en todos los flujos críticos.
- P06: cada imagen permite comentario asociado, visible en reportes y UI.
- P07: usuarios y cargos sincronizados automáticamente desde API RRHH, con logs de cambios.
- P08: categoría de inspección administrable desde mantenimiento, validada en cada registro.

## 6. Riesgos y mitigación

- SharePoint: definir permisos y formato de archivo en semana 9 para evitar bloqueos.
- API RRHH: validar disponibilidad y formato antes de semana 8.
- Cambios de alcance en reglas de negocio: congelar criterios al inicio de cada semana.
- Carga operativa: priorizar entregas incrementales y usar buffer semana 13.

---

Este cronograma está listo para presentar a gerencia o stakeholders. Si necesitas versión en Excel, Gantt visual o desglose por tareas técnicas, avísame y te lo genero al instante.
