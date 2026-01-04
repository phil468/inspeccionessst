<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    /**
     * Redirigir al usuario a Microsoft OAuth
     */
    public function redirectToMicrosoft()
    {
        try {
            $redirectUrl = Socialite::driver('microsoft')
                ->stateless()
                ->redirect()
                ->getTargetUrl();

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

            // Buscar o crear usuario
            $user = User::updateOrCreate(
                ['microsoft_id' => $microsoftUser->getId()],
                [
                    'name' => $microsoftUser->getName(),
                    'email' => $microsoftUser->getEmail(),
                    'avatar' => $microsoftUser->getAvatar(),
                    'activo' => true,
                    'password' => bcrypt(bin2hex(random_bytes(16))),
                ]
            );

            // Si es un usuario nuevo, asignar rol por defecto
            if ($user->wasRecentlyCreated) {
                $user->assignRole('Operador');
            }

            // Verificar que el usuario esté activo
            if (!$user->activo) {
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

            // Redirigir al frontend solo con la clave de sesión
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:8102');
            return redirect($frontendUrl . '/auth/callback?session=' . $sessionKey);

        } catch (\Exception $e) {
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:8102');
            return redirect($frontendUrl . '/login?error=' . urlencode($e->getMessage()));
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
