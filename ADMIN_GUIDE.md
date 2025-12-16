# Guía de Administración - Sistema de Calibración

## 👥 Gestión de Usuarios

### Listar Usuarios

```http
GET /api/v1/users
Authorization: Bearer {token}
Permission: users.manage
```

**Query Parameters:**

-   `activo` (boolean): Filtrar por usuarios activos/inactivos
-   `buscar` (string): Buscar por nombre o email
-   `per_page` (integer): Registros por página (default: 20)

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Juan Pérez",
      "email": "juan.perez@empresa.com",
      "microsoft_id": "...",
      "avatar": "https://...",
      "activo": true,
      "roles": [...]
    }
  ],
  "pagination": {
    "total": 50,
    "per_page": 20,
    "current_page": 1,
    "last_page": 3
  }
}
```

---

### Ver Usuario Específico

```http
GET /api/v1/users/{id}
Authorization: Bearer {token}
Permission: users.manage
```

**Respuesta incluye:**

-   Información del usuario
-   Roles asignados
-   Permisos (a través de roles)
-   Registros creados

---

### Actualizar Usuario

```http
PUT /api/v1/users/{id}
Authorization: Bearer {token}
Permission: users.manage
Content-Type: application/json

{
  "name": "Juan Pérez Actualizado",
  "email": "nuevo.email@empresa.com",
  "activo": true
}
```

---

### Activar/Desactivar Usuario

```http
POST /api/v1/users/{id}/toggle-active
Authorization: Bearer {token}
Permission: users.manage
```

**Respuesta:**

```json
{
    "success": true,
    "message": "Estado del usuario actualizado",
    "data": {
        "id": 1,
        "activo": false
    }
}
```

---

### Asignar Rol a Usuario

```http
POST /api/v1/users/{id}/assign-role
Authorization: Bearer {token}
Permission: users.manage
Content-Type: application/json

{
  "role_id": 2
}
```

**Respuesta:**

```json
{
    "success": true,
    "message": "Rol asignado exitosamente",
    "data": {
        "id": 1,
        "name": "Juan Pérez",
        "roles": [
            {
                "id": 2,
                "nombre": "Supervisor"
            }
        ]
    }
}
```

---

### Remover Rol de Usuario

```http
POST /api/v1/users/{id}/remove-role
Authorization: Bearer {token}
Permission: users.manage
Content-Type: application/json

{
  "role_id": 2
}
```

---

### Estadísticas de Usuarios

```http
GET /api/v1/users/estadisticas
Authorization: Bearer {token}
Permission: users.manage
```

**Respuesta:**

```json
{
    "success": true,
    "data": {
        "total": 50,
        "activos": 45,
        "inactivos": 5,
        "por_rol": [
            {
                "id": 1,
                "nombre": "Administrador",
                "users_count": 3
            },
            {
                "id": 2,
                "nombre": "Supervisor",
                "users_count": 10
            },
            {
                "id": 3,
                "nombre": "Operador",
                "users_count": 37
            }
        ]
    }
}
```

---

## 🛡️ Gestión de Roles y Permisos

### Listar Todos los Roles

```http
GET /api/v1/roles
Authorization: Bearer {token}
Permission: roles.manage
```

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Administrador",
      "descripcion": "Acceso completo al sistema",
      "permissions": [...]
    }
  ]
}
```

---

### Ver Rol Específico

```http
GET /api/v1/roles/{id}
Authorization: Bearer {token}
Permission: roles.manage
```

**Respuesta incluye:**

-   Información del rol
-   Permisos asignados
-   Usuarios con este rol

---

### Crear Nuevo Rol

```http
POST /api/v1/roles
Authorization: Bearer {token}
Permission: roles.manage
Content-Type: application/json

{
  "nombre": "Auditor",
  "descripcion": "Puede ver reportes y estadísticas"
}
```

---

### Actualizar Rol

```http
PUT /api/v1/roles/{id}
Authorization: Bearer {token}
Permission: roles.manage
Content-Type: application/json

{
  "nombre": "Supervisor de Campo",
  "descripcion": "Supervisión de actividades en campo"
}
```

---

### Eliminar Rol

```http
DELETE /api/v1/roles/{id}
Authorization: Bearer {token}
Permission: roles.manage
```

**Nota:** No se pueden eliminar roles del sistema (Administrador, Supervisor, Operador)

---

### Sincronizar Permisos de un Rol

```http
POST /api/v1/roles/{id}/sync-permissions
Authorization: Bearer {token}
Permission: roles.manage
Content-Type: application/json

{
  "permissions": [1, 2, 3, 5, 8]
}
```

**Descripción:** Reemplaza todos los permisos del rol con los IDs proporcionados.

---

### Listar Todos los Permisos Disponibles

```http
GET /api/v1/roles/permissions
Authorization: Bearer {token}
Permission: roles.manage
```

**Respuesta (agrupada por grupo):**

```json
{
  "success": true,
  "data": {
    "registros": [
      {
        "id": 1,
        "nombre": "registros.create",
        "descripcion": "Crear registros",
        "grupo": "registros"
      }
    ],
    "catalogos": [
      {
        "id": 5,
        "nombre": "campanias.manage",
        "descripcion": "Gestionar campañas",
        "grupo": "catalogos"
      }
    ],
    "sync": [...],
    "admin": [...]
  }
}
```

---

## 📊 Permisos Disponibles

### Registros

-   `registros.create` - Crear registros
-   `registros.read` - Ver registros
-   `registros.update` - Editar registros
-   `registros.delete` - Eliminar registros

### Catálogos

-   `campanias.manage` - Gestionar campañas
-   `materiales.manage` - Gestionar materiales
-   `fundos.manage` - Gestionar fundos
-   `lotes.manage` - Gestionar lotes
-   `motivos.manage` - Gestionar motivos

### Sincronización

-   `sync.execute` - Ejecutar sincronización

### Administración

-   `users.manage` - Gestionar usuarios
-   `roles.manage` - Gestionar roles y permisos

---

## 🔒 Roles Predefinidos

### Administrador

**Permisos:** Todos  
**Descripción:** Acceso completo al sistema

### Supervisor

**Permisos:**

-   Todos los permisos de registros (excepto delete)
-   Gestión de todos los catálogos
-   Ejecutar sincronización

**Descripción:** Puede gestionar catálogos y ver todos los registros

### Operador

**Permisos:**

-   `registros.create`
-   `registros.read`
-   `registros.update`
-   `sync.execute`

**Descripción:** Solo puede crear y ver sus propios registros

---

## 🛠️ Casos de Uso Comunes

### Crear un Nuevo Supervisor

```bash
# 1. El usuario se autentica con Microsoft
GET /api/v1/auth/microsoft

# 2. Se crea automáticamente con rol "Operador"

# 3. El admin le asigna el rol de Supervisor
POST /api/v1/users/{id}/assign-role
{
  "role_id": 2  # ID del rol Supervisor
}

# 4. Remover el rol de Operador si es necesario
POST /api/v1/users/{id}/remove-role
{
  "role_id": 3  # ID del rol Operador
}
```

---

### Crear Rol Personalizado

```bash
# 1. Crear el rol
POST /api/v1/roles
{
  "nombre": "Auditor",
  "descripcion": "Acceso de solo lectura a todo el sistema"
}

# 2. Obtener IDs de permisos necesarios
GET /api/v1/roles/permissions

# 3. Asignar permisos al nuevo rol
POST /api/v1/roles/{id}/sync-permissions
{
  "permissions": [2, 5, 6, 7, 8, 9]  # Solo permisos de lectura
}

# 4. Asignar rol a usuarios
POST /api/v1/users/{user_id}/assign-role
{
  "role_id": {nuevo_rol_id}
}
```

---

### Desactivar Usuario Temporalmente

```bash
# Desactivar usuario (no podrá autenticarse)
POST /api/v1/users/{id}/toggle-active

# Reactivar usuario
POST /api/v1/users/{id}/toggle-active  # Toggle cambia el estado
```

---

## 📝 Notas Importantes

1. **Múltiples Roles:** Un usuario puede tener múltiples roles
2. **Permisos Acumulativos:** Si un usuario tiene varios roles, obtiene todos los permisos de todos sus roles
3. **Roles del Sistema:** Los roles Administrador, Supervisor y Operador no se pueden eliminar
4. **Primer Usuario:** Al autenticarse por primera vez con Microsoft, se asigna automáticamente el rol "Operador"
5. **Usuarios Inactivos:** Los usuarios con `activo = false` no pueden autenticarse
6. **Tokens Activos:** Al desactivar un usuario, sus tokens actuales siguen siendo válidos hasta que expiren o cierre sesión

---

## 🧪 Pruebas con Postman

### Colección de Endpoints de Administración

1. **Autenticarse como Admin**

```
GET /api/v1/auth/microsoft
# Completar flujo OAuth
# Guardar token
```

2. **Listar Usuarios**

```
GET /api/v1/users?per_page=10
Headers:
  Authorization: Bearer {admin_token}
```

3. **Ver Estadísticas**

```
GET /api/v1/users/estadisticas
Headers:
  Authorization: Bearer {admin_token}
```

4. **Gestionar Roles**

```
GET /api/v1/roles
GET /api/v1/roles/permissions
POST /api/v1/roles/{id}/sync-permissions
Headers:
  Authorization: Bearer {admin_token}
```

---

## 🔐 Seguridad

### Mejores Prácticas

1. **Principio de Menor Privilegio:** Asignar solo los permisos necesarios
2. **Revisión Periódica:** Revisar roles y permisos regularmente
3. **Usuarios Inactivos:** Desactivar usuarios que ya no necesitan acceso
4. **Auditoría:** Revisar logs de cambios en roles y permisos
5. **Roles Personalizados:** Crear roles específicos en lugar de dar acceso de Administrador

### Recomendaciones

-   No crear usuarios con rol Administrador innecesariamente
-   Usar roles personalizados para necesidades específicas
-   Desactivar usuarios en lugar de eliminarlos (mantener trazabilidad)
-   Documentar cambios en roles y permisos
-   Realizar pruebas antes de modificar permisos en producción
