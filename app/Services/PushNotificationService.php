<?php

namespace App\Services;

use App\Models\PushNotificationToken;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    /**
     * Registrar o actualizar token de dispositivo
     */
    public function registerToken(User $user, string $token, string $platform, ?string $deviceId = null): PushNotificationToken
    {
        // Buscar token existente
        $pushToken = PushNotificationToken::where('user_id', $user->id)
            ->where('token', $token)
            ->where('platform', $platform)
            ->first();

        if ($pushToken) {
            // Actualizar existente
            $pushToken->update([
                'device_id' => $deviceId,
                'active' => true,
                'last_used_at' => now(),
            ]);
        } else {
            // Crear nuevo
            $pushToken = PushNotificationToken::create([
                'user_id' => $user->id,
                'token' => $token,
                'platform' => $platform,
                'device_id' => $deviceId,
                'active' => true,
                'last_used_at' => now(),
            ]);
        }

        return $pushToken;
    }

    /**
     * Desactivar token
     */
    public function deactivateToken(string $token): bool
    {
        return PushNotificationToken::where('token', $token)
            ->update(['active' => false]) > 0;
    }

    /**
     * Enviar notificación push a un usuario
     */
    public function sendToUser(User $user, string $title, string $body, array $data = []): array
    {
        $tokens = PushNotificationToken::forUser($user->id)
            ->active()
            ->get();

        $results = [];

        foreach ($tokens as $token) {
            try {
                $result = $this->sendToToken($token->token, $token->platform, $title, $body, $data);
                $results[] = [
                    'token_id' => $token->id,
                    'success' => $result,
                ];

                // Actualizar last_used_at
                $token->update(['last_used_at' => now()]);
            } catch (\Exception $e) {
                Log::error("Error enviando push a token {$token->id}: {$e->getMessage()}");
                $results[] = [
                    'token_id' => $token->id,
                    'success' => false,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return $results;
    }

    /**
     * Enviar notificación a múltiples usuarios
     */
    public function sendToUsers(array $userIds, string $title, string $body, array $data = []): array
    {
        $results = [];

        foreach ($userIds as $userId) {
            $user = User::find($userId);
            if ($user) {
                $results[$userId] = $this->sendToUser($user, $title, $body, $data);
            }
        }

        return $results;
    }

    /**
     * Enviar notificación a un token específico
     * 
     * NOTA: Esta implementación es básica y asume Firebase Cloud Messaging (FCM)
     * Para producción, se recomienda usar un paquete como kreait/firebase-php
     */
    private function sendToToken(string $token, string $platform, string $title, string $body, array $data = []): bool
    {
        // Verificar si hay configuración de FCM
        $fcmServerKey = env('FCM_SERVER_KEY');

        if (!$fcmServerKey) {
            Log::warning('FCM_SERVER_KEY no configurada en .env');
            return false;
        }

        // Preparar payload según plataforma
        $payload = [
            'to' => $token,
            'notification' => [
                'title' => $title,
                'body' => $body,
                'sound' => 'default',
            ],
            'data' => $data,
            'priority' => 'high',
        ];

        // Para iOS necesitamos content_available
        if ($platform === 'ios') {
            $payload['notification']['content_available'] = true;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => "key={$fcmServerKey}",
                'Content-Type' => 'application/json',
            ])->post('https://fcm.googleapis.com/fcm/send', $payload);

            if ($response->successful()) {
                $result = $response->json();
                return isset($result['success']) && $result['success'] > 0;
            }

            Log::error("Error FCM: " . $response->body());
            return false;
        } catch (\Exception $e) {
            Log::error("Excepción FCM: {$e->getMessage()}");
            return false;
        }
    }

    /**
     * Obtener todos los tokens activos de un usuario
     */
    public function getUserTokens(User $user): array
    {
        return PushNotificationToken::forUser($user->id)
            ->active()
            ->get()
            ->toArray();
    }

    /**
     * Limpiar tokens inactivos (no usados en X días)
     */
    public function cleanInactiveTokens(int $daysInactive = 30): int
    {
        return PushNotificationToken::where('last_used_at', '<', now()->subDays($daysInactive))
            ->orWhere(function ($query) use ($daysInactive) {
                $query->whereNull('last_used_at')
                    ->where('created_at', '<', now()->subDays($daysInactive));
            })
            ->delete();
    }
}
