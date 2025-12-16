# API de Usuarios, Roles y Permisos

## Endpoints Disponibles

### Usuarios

#### GET /api/v1/usuarios

Lista todos los usuarios con sus roles y permisos.

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Usuario Ejemplo",
      "email": "usuario@example.com",
      "activo": true,
      "roles": [
        {
          "id": 1,
          "name": "Administrador",
          "description": "Acceso total",
          "permissions": [...]
        }
      ]
    }
  ]
}
```

#### GET /api/v1/usuarios/{id}

Obtiene un usuario específico con sus relaciones.

#### POST /api/v1/usuarios

Crea un nuevo usuario.

**Requiere permiso:** `usuarios.manage`

**Body:**

```json
{
    "name": "Nuevo Usuario",
    "email": "nuevo@example.com",
    "password": "password123",
    "role_id": 1,
    "activo": true
}
```

#### PUT /api/v1/usuarios/{id}

Actualiza un usuario existente.

**Requiere permiso:** `usuarios.manage`

**Body:**

```json
{
    "name": "Usuario Actualizado",
    "email": "actualizado@example.com",
    "password": "newpassword123",
    "role_id": 2,
    "activo": false
}
```

**Nota:** El campo `password` es opcional en la actualización.

#### DELETE /api/v1/usuarios/{id}

Elimina un usuario.

**Requiere permiso:** `usuarios.manage`

#### POST /api/v1/usuarios/{id}/roles

Asigna un rol a un usuario.

**Requiere permiso:** `usuarios.manage`

**Body:**

```json
{
    "role_id": 1
}
```

#### DELETE /api/v1/usuarios/{id}/roles/{roleId}

Remueve un rol de un usuario.

**Requiere permiso:** `usuarios.manage`

---

### Roles

#### GET /api/v1/roles

Lista todos los roles con sus permisos.

**Respuesta:**

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "Administrador",
            "description": "Acceso total al sistema",
            "permissions": [
                {
                    "id": 1,
                    "name": "campanias.view",
                    "description": "Ver Campañas",
                    "resource": "campanias",
                    "action": "view"
                }
            ]
        }
    ]
}
```

#### GET /api/v1/roles/{id}

Obtiene un rol específico con sus permisos y usuarios.

#### POST /api/v1/roles

Crea un nuevo rol.

**Requiere permiso:** `roles.manage`

**Body:**

```json
{
    "name": "Nuevo Rol",
    "description": "Descripción del rol",
    "permissions": [1, 2, 3, 4]
}
```

#### PUT /api/v1/roles/{id}

Actualiza un rol existente.

**Requiere permiso:** `roles.manage`

**Body:**

```json
{
    "name": "Rol Actualizado",
    "description": "Nueva descripción",
    "permissions": [1, 5, 8, 12]
}
```

#### DELETE /api/v1/roles/{id}

Elimina un rol.

**Requiere permiso:** `roles.manage`

**Nota:** No se pueden eliminar los roles del sistema (Administrador, Supervisor, Operador).

---

### Permisos

#### GET /api/v1/permisos

Lista todos los permisos disponibles en el sistema.

**Respuesta:**

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "campanias.view",
            "description": "Ver Campañas",
            "resource": "campanias",
            "action": "view"
        }
    ]
}
```

---

## Estructura de Permisos

Los permisos siguen el patrón `{resource}.{action}`:

### Recursos:

-   `campanias` - Campañas
-   `materiales` - Materiales
-   `fundos` - Fundos
-   `lotes` - Lotes
-   `motivos` - Motivos
-   `registros` - Registros
-   `usuarios` - Usuarios
-   `roles` - Roles y Permisos

### Acciones:

-   `view` - Ver/Listar
-   `create` - Crear
-   `edit` - Editar
-   `delete` - Eliminar
-   `manage` - Gestionar (para catálogos)
-   `sync` - Sincronizar (solo para registros)

### Ejemplos:

-   `campanias.view` - Ver campañas
-   `campanias.create` - Crear campañas
-   `campanias.manage` - Gestionar campañas (incluye create, edit, delete)
-   `usuarios.manage` - Gestionar usuarios
-   `roles.manage` - Gestionar roles y permisos
-   `registros.sync` - Sincronizar registros

---

## Roles Predefinidos

### Administrador

-   Todos los permisos del sistema

### Supervisor

-   Ver todos los catálogos
-   Gestionar registros completos (CRUD + sync)

### Operador

-   Ver catálogos
-   Ver y crear registros

---

## Comandos Útiles

### Ejecutar el seeder de roles y permisos

```bash
php artisan db:seed --class=RolesPermissionsSeeder
```

Este comando creará:

-   Todos los permisos necesarios (55+ permisos)
-   3 roles predefinidos (Administrador, Supervisor, Operador)
-   Asignará los permisos correspondientes a cada rol
