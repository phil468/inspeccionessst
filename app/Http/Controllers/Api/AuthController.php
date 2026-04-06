<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Login con email y password
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        try {
            // Intentar autenticar
            if (!Auth::attempt($request->only('email', 'password'))) {
                return response()->json([
                    'success' => false,
                    'message' => 'Credenciales incorrectas',
                ], 401);
            }

            $user = User::where('email', $request->email)->first();

            // Verificar que el usuario esté activo
            if (!$user->activo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario inactivo. Contacte al administrador.',
                ], 403);
            }

            // Crear token de acceso
            $token = $user->createToken('auth-token')->plainTextToken;

            // Cargar relaciones
            $user->load('roles.permissions', 'personal');

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $user,
                    'token' => $token,
                ],
                'message' => 'Login exitoso',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error durante el login',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Redirigir al usuario a Microsoft OAuth
     */
    public function redirectToMicrosoft()
    {
        try {
            // Leer returnUrl opcional enviado por el frontend
            $returnUrl = request()->query('returnUrl');

            // Validar returnUrl para evitar open redirects: aceptar rutas relativas o URLs que pertenecen al FRONTEND_URL
            if ($returnUrl) {
                $allowed = false;
                // Rutas relativas como /mis-inspecciones/123
                if (strpos($returnUrl, '/') === 0) {
                    $allowed = true;
                } else {
                    // Si es URL absoluta, comprobar host
                    $frontend = rtrim(env('FRONTEND_URL', 'http://localhost:8102'), '/');
                    $frontendHost = parse_url($frontend, PHP_URL_HOST);
                    $returnHost = parse_url($returnUrl, PHP_URL_HOST);
                    if ($frontendHost && $returnHost && $frontendHost === $returnHost) {
                        $allowed = true;
                    }
                }

                if (!$allowed) {
                    // Ignorar returnUrl no segura
                    $returnUrl = null;
                }
            }

            // Generar un state único si se pasó returnUrl, y guardarlo en cache
            $state = null;
            if ($returnUrl) {
                $state = 'rurl_' . bin2hex(random_bytes(12));
                // Guardar el returnUrl asociado al state por 15 minutos
                cache()->put('oauth_return_' . $state, $returnUrl, now()->addMinutes(15));
            }

            // Construir la URL de redirección a Microsoft, incluyendo nuestro state personalizado si existe
            $driver = Socialite::driver('microsoft')->stateless();
            if ($state) {
                // Agregar el state personalizado al request de OAuth
                $driver = $driver->with(['state' => $state]);
            }

            $redirectUrl = $driver->redirect()->getTargetUrl();

            return response()->json([
                'success' => true,
                'redirect_url' => $redirectUrl,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al generar URL de autenticación',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Callback de Microsoft OAuth
     */
    public function handleMicrosoftCallback(Request $request)
    {
        try {
            // Obtener usuario de Microsoft
            $microsoftUser = Socialite::driver('microsoft')->stateless()->user();

            // Intentar recuperar returnUrl desde el state si el frontend lo envió
            $receivedState = $request->input('state');
            $returnUrl = null;
            if ($receivedState) {
                $returnUrl = cache()->pull('oauth_return_' . $receivedState);
                // pull() obtiene y elimina la entrada de cache
            }

            $email = $microsoftUser->getEmail();
            $microsoftId = $microsoftUser->getId();
            // Truncar avatar a 255 chars como respaldo si la columna aún es VARCHAR(255)
            $avatarUrl = $microsoftUser->getAvatar();
            if ($avatarUrl && strlen($avatarUrl) > 2000) {
                $avatarUrl = null; // Descartar URLs absurdamente largas
            }

            // Usar transacción para evitar race conditions
            try {
                $user = DB::transaction(function () use ($microsoftId, $email, $microsoftUser, $avatarUrl) {
                    // 1) Intentar encontrar por microsoft_id
                    $user = User::where('microsoft_id', $microsoftId)->first();

                    // 2) Si no existe, intentar por email y bloquear la fila
                    if (!$user && $email) {
                        $user = User::where('email', $email)->lockForUpdate()->first();
                    }

                    // 3) Si existe, actualizar campos relevantes
                    if ($user) {
                        $user->microsoft_id = $microsoftId;
                        $user->name = $microsoftUser->getName() ?? $user->name;
                        $user->avatar = $avatarUrl ?? $user->avatar;
                        $user->activo = $user->activo ?? true;
                        $user->save();
                        return $user;
                    }

                    // 4) No existe: crear nuevo usuario y asignar rol dentro de la transacción
                    $user = User::create([
                        'microsoft_id' => $microsoftId,
                        'name' => $microsoftUser->getName(),
                        'email' => $email,
                        'avatar' => $avatarUrl,
                        'activo' => true,
                        'password' => bcrypt(Str::random(40)),
                    ]);

                    // Asignar rol por defecto si no tiene roles
                    if (method_exists($user, 'assignRole')) {
                        try {
                            $user->assignRole('Personal');
                        } catch (\Exception $err) {
                            // No bloquear la transacción por error en roles
                            Log::warning('No se pudo asignar rol dentro de la transacción: ' . $err->getMessage());
                        }
                    }

                    return $user;
                });
            } catch (QueryException $qe) {
                // Manejo defensivo en caso de duplicate key por race
                if (isset($qe->errorInfo[1]) && $qe->errorInfo[1] == 1062 && $email) {
                    Log::warning('Duplicate entry al crear usuario OAuth, intentando recuperar por email: ' . $email);
                    $user = User::where('email', $email)->first();
                    if ($user && !$user->microsoft_id) {
                        $user->microsoft_id = $microsoftId;
                        $user->save();
                    }
                } else {
                    throw $qe;
                }
            }

            // Si el usuario no tiene roles, asignar rol 'Personal'
            if (isset($user)) {
                try {
                    $hasRoles = $user->roles()->exists();
                } catch (\Exception $err) {
                    // En caso de que la relación no exista o falle, consideramos que no tiene roles
                    $hasRoles = false;
                }

                if (!$hasRoles) {
                    try {
                        $user->assignRole('Personal');
                    } catch (\Exception $err) {
                        Log::warning('No se pudo asignar rol al usuario después de transacción: ' . $err->getMessage());
                    }
                }
            }

            // Verificar que el usuario esté activo
            if (!$user || !$user->activo) {
                $frontendUrl = env('FRONTEND_URL', 'http://localhost:8102');
                return redirect($frontendUrl . '/login?error=usuario_inactivo');
            }

            // Crear token de acceso
            $token = $user->createToken('auth-token')->plainTextToken;

            // Guardar en sesión temporal (en lugar de pasar en URL)
            $sessionKey = 'auth_' . bin2hex(random_bytes(16));
            cache()->put($sessionKey, [
                'user_id' => $user->id,
                'token' => $token,
            ], now()->addMinutes(5)); // Expira en 5 minutos

            // Redirigir al frontend solo con la clave de sesión y opcional returnUrl
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:8102');
            $callbackUrl = $frontendUrl . '/auth/callback?session=' . $sessionKey;
            if ($returnUrl) {
                $callbackUrl .= '&returnUrl=' . urlencode($returnUrl);
            }

            return redirect($callbackUrl);
        } catch (\Exception $e) {
            Log::error('Error en callback Microsoft: ' . $e->getMessage());
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:8102');
            return redirect($frontendUrl . '/login?error=error_autenticacion');
        }
    }

    /**
     * Obtener datos de sesión OAuth
     */
    public function getSessionData(Request $request)
    {
        $sessionKey = $request->input('session');

        if (!$sessionKey) {
            return response()->json([
                'success' => false,
                'message' => 'Session key requerida',
            ], 400);
        }

        $sessionData = cache()->get($sessionKey);

        if (!$sessionData) {
            return response()->json([
                'success' => false,
                'message' => 'Sesión expirada o inválida',
            ], 404);
        }

        // Eliminar la sesión temporal
        cache()->forget($sessionKey);

        // Obtener usuario completo
        $user = User::with('roles.permissions')->find($sessionData['user_id']);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'token' => $sessionData['token'],
            ],
        ]);
    }

    /**
     * Obtener usuario autenticado
     */
    public function me(Request $request)
    {
        $user = $request->user();
        $user->load('roles.permissions');

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    /**
     * Cerrar sesión (revocar token)
     */
    public function logout(Request $request)
    {
        try {
            // Revocar el token actual
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Sesión cerrada exitosamente',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cerrar sesión',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Revocar todos los tokens del usuario
     */
    public function logoutAll(Request $request)
    {
        try {
            // Revocar todos los tokens
            $request->user()->tokens()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Todas las sesiones cerradas exitosamente',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al cerrar sesiones',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verificar permisos del usuario
     */
    public function checkPermission(Request $request)
    {
        $user = $request->user();
        $permission = $request->input('permission');

        if (!$permission) {
            return response()->json([
                'success' => false,
                'message' => 'Permiso no especificado',
            ], 400);
        }

        $hasPermission = $user->hasPermission($permission);

        return response()->json([
            'success' => true,
            'has_permission' => $hasPermission,
            'permission' => $permission,
        ]);
    }
}
