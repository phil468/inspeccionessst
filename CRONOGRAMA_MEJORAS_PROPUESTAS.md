# Cronograma de Desarrollo de Mejoras

Fecha de elaboración: 19-05-2026

## 1. Supuestos de planificación

- Capacidad disponible: 1 desarrollador fullstack
- Dedicación: 24 horas por semana
- Metodología: planificación semanal
- Fecha límite: no definida
- Se incluye margen de contingencia para retrabajo y ajustes de alcance

## 2. Estimación por propuesta (horas)

| ID  | Propuesta                                                | Complejidad | Horas estimadas |
| --- | -------------------------------------------------------- | ----------- | --------------: |
| P01 | Conectividad al consolidado de inspecciones              | Alta        |              56 |
| P02 | Cambio de imagen en levantamientos                       | Media       |              20 |
| P03 | Eliminación del campo Vigencia                           | Baja        |               8 |
| P04 | Asignación automática de visores con edición             | Alta        |              32 |
| P05 | Alerta de guardado de avance + autosave básico           | Alta        |              36 |
| P06 | Comentarios adicionales en imágenes de levantamiento     | Media       |              16 |
| P07 | Actualización automática de base de usuarios             | Alta        |              44 |
| P08 | Lista desplegable de categoría de inspección             | Media       |              20 |
|     | Subtotal desarrollo                                      |             |             232 |
|     | QA funcional, estabilización, despliegue y documentación |             |              28 |
|     | Contingencia aproximada (15%)                            |             |              35 |
|     | Total estimado                                           |             |             295 |

Duración estimada total con 24 h/semana: 12 a 13 semanas.

## 3. Dependencias clave

- P04 depende de definir reglas de jerarquía responsable-equipo (supervisor, coordinador, gerencia).
- P07 depende de disponibilidad de fuente maestra de personal (API, BD o archivo corporativo).
- P01 depende de definir destino de consolidado, estructura de datos y frecuencia de sincronización.
- P06 se puede implementar junto con P02 para aprovechar cambios en pantalla/flujo de levantamiento.

## 4. Gantt resumido (semanal)

Leyenda:

- X: ejecución principal
- x: soporte, ajustes o cierre

| Propuesta                          | S1  | S2  | S3  | S4  | S5  | S6  | S7  | S8  | S9  | S10 | S11 | S12 | S13 |
| ---------------------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P03 Eliminar Vigencia              | X   | x   |     |     |     |     |     |     |     |     |     |     |     |
| P08 Categoría de inspección        | X   | X   | x   |     |     |     |     |     |     |     |     |     |     |
| P02 Cambio de imagen levantamiento |     | X   | X   | x   |     |     |     |     |     |     |     |     |     |
| P06 Comentarios en imágenes        |     |     | X   | X   | x   |     |     |     |     |     |     |     |     |
| P05 Alerta guardado + autosave     |     |     |     | X   | X   | X   | x   |     |     |     |     |     |     |
| P04 Asignación automática visores  |     |     |     |     | X   | X   | X   | x   |     |     |     |     |     |
| P07 Sync automática usuarios       |     |     |     |     |     |     | X   | X   | X   | x   |     |     |     |
| P01 Integración consolidado        |     |     |     |     |     |     |     |     | X   | X   | X   | x   |     |
| QA integral y hardening            |     |     |     |     |     |     |     |     |     |     | X   | X   | x   |
| Documentación y cierre             |     |     |     |     |     |     |     |     |     |     |     | X   | X   |

## 5. Plan semanal detallado

### Semana 1 (24h)

- P03: retirar campo Vigencia en frontend, validaciones y backend.
- P08: diseño técnico y cambios de modelo/migración para categoría de inspección.
- Definir catálogo cerrado de categorías con validación funcional.

### Semana 2 (24h)

- P08: implementación completa frontend/backend + pruebas.
- P02: inicio de reemplazo de imagen (API y almacenamiento).

### Semana 3 (24h)

- P02: completar reemplazo de imagen + pruebas móviles.
- P06: inicio de campo comentario por imagen en flujo de levantamiento.

### Semana 4 (24h)

- P06: finalizar comentarios por imagen.
- P05: diseño de estrategia de guardado de avance y eventos de salida/recarga.

### Semana 5 (24h)

- P05: pop-up de confirmación para salir/recargar.
- P04: diseño de reglas de asignación automática de visores según responsable.

### Semana 6 (24h)

- P05: autosave básico por borrador local y recuperación al volver.
- P04: implementación backend de autoasignación y edición manual.

### Semana 7 (24h)

- P04: completar integración frontend y pruebas.
- P07: análisis de fuente maestra de usuarios y estrategia de sincronización.

### Semana 8 (24h)

- P07: desarrollo de sincronización automática (altas, bajas, cambios de puesto).

### Semana 9 (24h)

- P07: pruebas de consistencia, logs y manejo de errores.
- P01: diseño de integración al consolidado (mapeo, contratos, frecuencia).

### Semana 10 (24h)

- P01: implementación integración, jobs, trazabilidad y reintentos.

### Semana 11 (24h)

- P01: cierre técnico y validación de datos consolidados.
- QA integral inter-módulos (regresión funcional).

### Semana 12 (24h)

- Hardening, ajustes por feedback de usuarios clave.
- Documentación técnica/operativa y checklist de salida.

### Semana 13 (buffer, opcional)

- Reserva para contingencias de integración y cambios de último momento.
- Si no se usa, puede adelantarse la salida a producción.

## 6. Criterios de aceptación por propuesta

- P01: datos de inspecciones sincronizados sin exportación manual y con trazabilidad.
- P02: reemplazo de imagen disponible sin eliminar el registro.
- P03: campo Vigencia removido del flujo y de validaciones.
- P04: visores sugeridos automáticamente por responsable, con edición manual.
- P05: prevención de pérdida de datos al salir/recargar y recuperación de avance.
- P06: cada imagen de levantamiento permite comentario asociado.
- P07: usuarios y cargos sincronizados automáticamente desde fuente maestra.
- P08: categoría de inspección obligatoria y estandarizada mediante lista cerrada.

## 7. Riesgos y mitigación

- Falta de definición de integración consolidado (P01): cerrar contrato técnico en semana 9.
- Fuente de datos de personal no disponible (P07): acordar API o export intermedio temporal.
- Cambios de alcance en reglas de negocio (P04-P05): congelar criterios al inicio de cada semana.
- Carga operativa de un solo recurso: priorizar entregas incrementales y usar buffer semana 13.

## 8. Priorización sugerida

Orden recomendado por valor y rapidez:

1. P03
2. P08
3. P02
4. P06
5. P05
6. P04
7. P07
8. P01

Esta secuencia entrega mejoras visibles desde las primeras semanas mientras prepara las integraciones de mayor riesgo para la segunda mitad del cronograma.
