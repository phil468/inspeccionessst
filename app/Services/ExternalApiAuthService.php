<?php

namespace App\Services;

use App\Models\ApiToken;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

class ExternalApiAuthService
{
    // URL del API de autenticación (ajusta según tu configuración)
    private const LOGIN_URL = 'http://10.13.10.49:81/api/login';
    private const LOGIN_EMAIL = 'john.delacruz@vanguardfresh.pe';
    private const LOGIN_PASSWORD = 'Ch4p1guard$';

    /**
     * Obtiene un token válido (reutiliza si existe, o crea uno nuevo)
     */
    public function getValidToken(): ?ApiToken
    {
        // Intentar obtener el último token
        $token = $this->getLastToken();

        if ($token && !$token->isExpired()) {
            return $token;
        }

        // Si no hay token o está expirado, hacer login
        return $this->login();
    }

    /**
     * Obtiene el último token almacenado
     */
    public function getLastToken(): ?ApiToken
    {
        return ApiToken::orderBy('created_at', 'desc')->first();
    }

    /**
     * Hace login en el API externo y guarda el token
     */
    public function login(): ?ApiToken
    {
        try {
            $response = Http::withoutVerifying()
                ->timeout(30)
                ->post(self::LOGIN_URL, [
                    'email' => self::LOGIN_EMAIL,
                    'password' => self::LOGIN_PASSWORD,
                ]);

            if (!$response->successful()) {
                Log::error('Error en login de API externo', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return null;
            }

            $data = $response->json();

            // Crear y guardar el token
            $token = ApiToken::create([
                'user_id' => $data['user']['user_id'] ?? null,
                'access_token' => $data['access_token'],
                'token_type' => $data['token_type'] ?? 'Bearer',
                'expires_at' => now()->addSeconds($data['expires_in'] ?? 3600),
                'refresh_token' => $data['refresh_token'] ?? null,
            ]);

            Log::info('Token de API externo obtenido exitosamente', [
                'expires_at' => $token->expires_at,
            ]);

            return $token;

        } catch (Exception $e) {
            Log::error('Excepción al hacer login en API externo: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Verifica si un token ha expirado
     */
    public function checkTokenExpiration(ApiToken $token): bool
    {
        return $token->isExpired();
    }
}
