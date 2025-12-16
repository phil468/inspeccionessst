<?php

namespace App\Helpers;

class ResponseHelper
{
    /**
     * Success response
     */
    public static function success($data = null, $message = null, $code = 200)
    {
        $response = [
            'success' => true,
        ];

        if ($message) {
            $response['message'] = $message;
        }

        if ($data !== null) {
            $response['data'] = $data;
        }

        return response()->json($response, $code);
    }

    /**
     * Error response
     */
    public static function error($message, $errors = null, $code = 400)
    {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $code);
    }

    /**
     * Not found response
     */
    public static function notFound($message = 'Recurso no encontrado')
    {
        return self::error($message, null, 404);
    }

    /**
     * Unauthorized response
     */
    public static function unauthorized($message = 'No autorizado')
    {
        return self::error($message, null, 401);
    }

    /**
     * Forbidden response
     */
    public static function forbidden($message = 'Acceso denegado')
    {
        return self::error($message, null, 403);
    }

    /**
     * Validation error response
     */
    public static function validationError($errors, $message = 'Error de validación')
    {
        return self::error($message, $errors, 422);
    }

    /**
     * Paginated response
     */
    public static function paginated($paginator, $message = null)
    {
        $response = [
            'success' => true,
            'data' => $paginator->items(),
            'pagination' => [
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ];

        if ($message) {
            $response['message'] = $message;
        }

        return response()->json($response);
    }
}
