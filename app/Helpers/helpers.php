<?php

if (!function_exists('success_response')) {
    /**
     * Retornar una respuesta exitosa estandarizada
     */
    function success_response($data = null, $message = null, $code = 200)
    {
        $response = ['success' => true];
        
        if ($message) {
            $response['message'] = $message;
        }
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        return response()->json($response, $code);
    }
}

if (!function_exists('error_response')) {
    /**
     * Retornar una respuesta de error estandarizada
     */
    function error_response($message, $errors = null, $code = 400)
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
}

if (!function_exists('paginated_response')) {
    /**
     * Retornar una respuesta paginada estandarizada
     */
    function paginated_response($paginator)
    {
        return response()->json([
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
        ]);
    }
}

if (!function_exists('format_date')) {
    /**
     * Formatear fecha para la API
     */
    function format_date($date, $format = 'Y-m-d H:i:s')
    {
        if (!$date) {
            return null;
        }
        
        if (is_string($date)) {
            $date = \Carbon\Carbon::parse($date);
        }
        
        return $date->format($format);
    }
}

if (!function_exists('generate_uuid')) {
    /**
     * Generar un UUID v4
     */
    function generate_uuid()
    {
        return \Illuminate\Support\Str::uuid()->toString();
    }
}

if (!function_exists('check_user_permission')) {
    /**
     * Verificar si el usuario tiene un permiso
     */
    function check_user_permission($user, $permission)
    {
        if (!$user) {
            return false;
        }
        
        return $user->hasPermission($permission);
    }
}

if (!function_exists('check_user_role')) {
    /**
     * Verificar si el usuario tiene un rol
     */
    function check_user_role($user, $role)
    {
        if (!$user) {
            return false;
        }
        
        return $user->hasRole($role);
    }
}

if (!function_exists('sanitize_search_term')) {
    /**
     * Sanitizar término de búsqueda
     */
    function sanitize_search_term($term)
    {
        return trim(preg_replace('/[^a-zA-Z0-9\s\-\_\.]/', '', $term));
    }
}

if (!function_exists('is_synced')) {
    /**
     * Verificar si un registro está sincronizado
     */
    function is_synced($model)
    {
        return isset($model->synced) && $model->synced === true;
    }
}

if (!function_exists('mark_as_synced')) {
    /**
     * Marcar un modelo como sincronizado
     */
    function mark_as_synced($model)
    {
        if (method_exists($model, 'marcarComoSincronizado')) {
            return $model->marcarComoSincronizado();
        }
        
        if (isset($model->synced)) {
            $model->update([
                'synced' => true,
                'synced_at' => now(),
            ]);
        }
        
        return $model;
    }
}
