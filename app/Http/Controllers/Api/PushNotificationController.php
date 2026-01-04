<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PushNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PushNotificationController extends Controller
{
    protected $pushService;

    public function __construct(PushNotificationService $pushService)
    {
        $this->pushService = $pushService;
    }

    /**
     * Registrar token de dispositivo
     */
    public function registerToken(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string|max:500',
            'platform' => 'required|in:ios,android,web',
            'device_id' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        try {
            $pushToken = $this->pushService->registerToken(
                $user,
                $request->token,
                $request->platform,
                $request->device_id
            );

            return response()->json([
                'success' => true,
                'message' => 'Token registrado correctamente',
                'data' => $pushToken,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar token',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Desactivar token
     */
    public function deactivateToken(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $result = $this->pushService->deactivateToken($request->token);

        return response()->json([
            'success' => true,
            'message' => $result ? 'Token desactivado' : 'Token no encontrado',
        ]);
    }

    /**
     * Obtener tokens del usuario
     */
    public function getUserTokens(Request $request)
    {
        $user = $request->user();
        $tokens = $this->pushService->getUserTokens($user);

        return response()->json([
            'success' => true,
            'data' => $tokens,
        ]);
    }

    /**
     * Enviar notificación de prueba
     */
    public function sendTestNotification(Request $request)
    {
        $user = $request->user();

        $results = $this->pushService->sendToUser(
            $user,
            'Notificación de Prueba',
            'Esta es una notificación de prueba del sistema de inspecciones SST',
            ['type' => 'test']
        );

        return response()->json([
            'success' => true,
            'message' => 'Notificación enviada',
            'results' => $results,
        ]);
    }
}
