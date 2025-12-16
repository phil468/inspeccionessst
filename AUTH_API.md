# Guía de Autenticación - API Calibración

## 🔐 Flujo de Autenticación Microsoft OAuth + Sanctum

### 1. Configuración Inicial

Asegúrate de tener configuradas las variables de entorno en `.env`:

```env
MICROSOFT_CLIENT_ID=tu_client_id
MICROSOFT_CLIENT_SECRET=tu_client_secret
MICROSOFT_REDIRECT_URI=http://localhost:8000/api/v1/auth/microsoft/callback
FRONTEND_URL=http://localhost:8100
SANCTUM_STATEFUL_DOMAINS=localhost:8100,localhost:4200
SESSION_DOMAIN=localhost
```

### 2. Flujo de Login (Frontend)

#### Paso 1: Obtener URL de redirección a Microsoft

```typescript
// Desde el frontend (Ionic/Angular)
const response = await fetch("http://localhost:8000/api/v1/auth/microsoft");
const data = await response.json();

// Redirigir al usuario a Microsoft
window.location.href = data.redirect_url;
```

**Respuesta:**

```json
{
    "success": true,
    "redirect_url": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?..."
}
```

#### Paso 2: Microsoft redirige al callback

Después de que el usuario inicie sesión en Microsoft, será redirigido a:

```
http://localhost:8000/api/v1/auth/microsoft/callback?code=...
```

El backend procesa automáticamente y devuelve:

```json
{
  "success": true,
  "message": "Autenticación exitosa",
  "data": {
    "user": {
      "id": 1,
      "name": "Juan Pérez",
      "email": "juan.perez@empresa.com",
      "microsoft_id": "...",
      "avatar": "https://...",
      "activo": true,
      "roles": [
        {
          "id": 3,
          "nombre": "Operador",
          "permissions": [...]
        }
      ]
    },
    "token": "1|abc123def456..."
  }
}
```

#### Paso 3: Guardar token y usar en peticiones

```typescript
// Guardar token en storage
localStorage.setItem("auth_token", data.data.token);
localStorage.setItem("user", JSON.stringify(data.data.user));

// Usar en peticiones posteriores
const response = await fetch("http://localhost:8000/api/v1/registros", {
    headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
    },
});
```

## 📋 Endpoints de Autenticación

### Obtener URL de Microsoft OAuth

```http
GET /api/v1/auth/microsoft
```

**Respuesta:**

```json
{
    "success": true,
    "redirect_url": "https://login.microsoftonline.com/..."
}
```

---

### Callback de Microsoft (automático)

```http
GET /api/v1/auth/microsoft/callback?code={code}
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Autenticación exitosa",
  "data": {
    "user": {...},
    "token": "1|abc123..."
  }
}
```

---

### Obtener usuario autenticado

```http
GET /api/v1/auth/me
Authorization: Bearer {token}
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan.perez@empresa.com",
    "roles": [...],
    "permissions": [...]
  }
}
```

---

### Cerrar sesión (revocar token actual)

```http
POST /api/v1/auth/logout
Authorization: Bearer {token}
```

**Respuesta:**

```json
{
    "success": true,
    "message": "Sesión cerrada exitosamente"
}
```

---

### Cerrar todas las sesiones (revocar todos los tokens)

```http
POST /api/v1/auth/logout-all
Authorization: Bearer {token}
```

**Respuesta:**

```json
{
    "success": true,
    "message": "Todas las sesiones cerradas exitosamente"
}
```

---

### Verificar permiso

```http
POST /api/v1/auth/check-permission
Authorization: Bearer {token}
Content-Type: application/json

{
  "permission": "registros.create"
}
```

**Respuesta:**

```json
{
    "success": true,
    "has_permission": true,
    "permission": "registros.create"
}
```

## 🛡️ Sistema de Permisos

### Middlewares Disponibles

#### Verificar Permiso

```php
Route::middleware('permission:registros.create')->group(function () {
    // Rutas que requieren el permiso 'registros.create'
});
```

#### Verificar Rol

```php
Route::middleware('role:Administrador')->group(function () {
    // Rutas que requieren el rol 'Administrador'
});
```

### Permisos Disponibles

**Registros:**

-   `registros.create` - Crear registros
-   `registros.read` - Ver registros
-   `registros.update` - Editar registros
-   `registros.delete` - Eliminar registros

**Catálogos:**

-   `campanias.manage` - Gestionar campañas
-   `materiales.manage` - Gestionar materiales
-   `fundos.manage` - Gestionar fundos
-   `lotes.manage` - Gestionar lotes
-   `motivos.manage` - Gestionar motivos

**Sincronización:**

-   `sync.execute` - Ejecutar sincronización

**Administración:**

-   `users.manage` - Gestionar usuarios
-   `roles.manage` - Gestionar roles

### Roles por Defecto

**Administrador:**

-   Todos los permisos del sistema

**Supervisor:**

-   `registros.create`, `registros.read`, `registros.update`
-   Todos los permisos de catálogos (`.manage`)
-   `sync.execute`

**Operador:**

-   `registros.create`, `registros.read`, `registros.update`
-   `sync.execute`

## 🔄 Manejo de Errores

### Usuario no autenticado (401)

```json
{
    "success": false,
    "message": "Unauthenticated."
}
```

### Sin permiso (403)

```json
{
    "success": false,
    "message": "No tienes permiso para realizar esta acción",
    "required_permission": "campanias.manage"
}
```

### Usuario inactivo (403)

```json
{
    "success": false,
    "message": "Usuario inactivo. Contacte al administrador."
}
```

## 💡 Ejemplo de Implementación en Angular/Ionic

### AuthService

```typescript
import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { BehaviorSubject, Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable({
    providedIn: "root",
})
export class AuthService {
    private apiUrl = "http://localhost:8000/api/v1";
    private currentUserSubject = new BehaviorSubject<any>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadUser();
    }

    private loadUser() {
        const user = localStorage.getItem("user");
        if (user) {
            this.currentUserSubject.next(JSON.parse(user));
        }
    }

    getMicrosoftUrl(): Observable<any> {
        return this.http.get(`${this.apiUrl}/auth/microsoft`);
    }

    handleCallback(code: string): Observable<any> {
        return this.http
            .get(`${this.apiUrl}/auth/microsoft/callback?code=${code}`)
            .pipe(
                tap((response: any) => {
                    if (response.success) {
                        localStorage.setItem("auth_token", response.data.token);
                        localStorage.setItem(
                            "user",
                            JSON.stringify(response.data.user)
                        );
                        this.currentUserSubject.next(response.data.user);
                    }
                })
            );
    }

    getToken(): string | null {
        return localStorage.getItem("auth_token");
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    hasPermission(permission: string): boolean {
        const user = this.currentUserSubject.value;
        if (!user || !user.roles) return false;

        return user.roles.some((role: any) =>
            role.permissions.some((p: any) => p.nombre === permission)
        );
    }

    logout(): Observable<any> {
        const token = this.getToken();
        return this.http
            .post(
                `${this.apiUrl}/auth/logout`,
                {},
                {
                    headers: new HttpHeaders({
                        Authorization: `Bearer ${token}`,
                    }),
                }
            )
            .pipe(
                tap(() => {
                    localStorage.removeItem("auth_token");
                    localStorage.removeItem("user");
                    this.currentUserSubject.next(null);
                })
            );
    }
}
```

### HTTP Interceptor para Token

```typescript
import { Injectable } from "@angular/core";
import {
    HttpInterceptor,
    HttpRequest,
    HttpHandler,
    HttpEvent,
} from "@angular/common/http";
import { Observable } from "rxjs";
import { AuthService } from "./auth.service";

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
    constructor(private authService: AuthService) {}

    intercept(
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        const token = this.authService.getToken();

        if (token) {
            const cloned = req.clone({
                headers: req.headers
                    .set("Authorization", `Bearer ${token}`)
                    .set("Accept", "application/json"),
            });
            return next.handle(cloned);
        }

        return next.handle(req);
    }
}
```

## 🧪 Pruebas con Postman

### 1. Login

1. GET `http://localhost:8000/api/v1/auth/microsoft`
2. Copiar `redirect_url` y abrirlo en navegador
3. Después del login, copiar el `code` de la URL de callback
4. GET `http://localhost:8000/api/v1/auth/microsoft/callback?code={code}`
5. Guardar el `token` recibido

### 2. Usar API con Token

```
GET http://localhost:8000/api/v1/registros
Headers:
  Authorization: Bearer {token}
  Accept: application/json
```

## 📝 Notas Importantes

1. **CORS**: Ya está configurado en `config/cors.php` para aceptar peticiones del frontend
2. **Sanctum**: Los dominios stateful están configurados en `.env`
3. **Token expiration**: Por defecto, los tokens de Sanctum no expiran
4. **Primer usuario**: Los nuevos usuarios reciben automáticamente el rol "Operador"
5. **Usuarios inactivos**: Los usuarios con `activo = false` no pueden autenticarse
