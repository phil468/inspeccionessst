<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CampaniaController;
use App\Http\Controllers\Api\MaterialController;
use App\Http\Controllers\Api\FundoController;
use App\Http\Controllers\Api\LoteController;
use App\Http\Controllers\Api\MotivoController;
use App\Http\Controllers\Api\RegistroController;
use App\Http\Controllers\Api\SyncController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RoleController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Rutas públicas (sin autenticación)
Route::prefix('v1')->group(function () {
    // Autenticación Microsoft OAuth
    Route::get('/auth/microsoft', [AuthController::class, 'redirectToMicrosoft']);
    Route::get('/auth/microsoft/callback', [AuthController::class, 'handleMicrosoftCallback']);
});

// Rutas protegidas con Sanctum
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    
    // Autenticación
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/logout-all', [AuthController::class, 'logoutAll']);
    Route::post('/auth/check-permission', [AuthController::class, 'checkPermission']);
    
    // Usuario autenticado
    Route::get('/user', function (Request $request) {
        return response()->json([
            'success' => true,
            'data' => $request->user()->load('roles.permissions'),
        ]);
    });

    // Sincronización
    Route::prefix('sync')->group(function () {
        Route::post('/registros', [SyncController::class, 'syncRegistros']);
        Route::get('/catalogos', [SyncController::class, 'downloadCatalogos']);
        Route::get('/registros', [SyncController::class, 'downloadRegistros']);
        Route::get('/status', [SyncController::class, 'checkStatus']);
    });

    // Catálogos - Campañas
    Route::get('campanias', [CampaniaController::class, 'index']);
    Route::get('campanias/{id}', [CampaniaController::class, 'show']);
    Route::middleware('permission:campanias.manage')->group(function () {
        Route::post('campanias', [CampaniaController::class, 'store']);
        Route::put('campanias/{id}', [CampaniaController::class, 'update']);
        Route::delete('campanias/{id}', [CampaniaController::class, 'destroy']);
    });

    // Catálogos - Materiales
    Route::get('materiales', [MaterialController::class, 'index']);
    Route::get('materiales/{id}', [MaterialController::class, 'show']);
    Route::middleware('permission:materiales.manage')->group(function () {
        Route::post('materiales', [MaterialController::class, 'store']);
        Route::put('materiales/{id}', [MaterialController::class, 'update']);
        Route::delete('materiales/{id}', [MaterialController::class, 'destroy']);
    });

    // Catálogos - Fundos
    Route::get('fundos', [FundoController::class, 'index']);
    Route::get('fundos/{id}', [FundoController::class, 'show']);
    Route::middleware('permission:fundos.manage')->group(function () {
        Route::post('fundos', [FundoController::class, 'store']);
        Route::put('fundos/{id}', [FundoController::class, 'update']);
        Route::delete('fundos/{id}', [FundoController::class, 'destroy']);
    });

    // Catálogos - Lotes
    Route::get('lotes', [LoteController::class, 'index']);
    Route::get('lotes/{id}', [LoteController::class, 'show']);
    Route::middleware('permission:lotes.manage')->group(function () {
        Route::post('lotes', [LoteController::class, 'store']);
        Route::put('lotes/{id}', [LoteController::class, 'update']);
        Route::delete('lotes/{id}', [LoteController::class, 'destroy']);
    });

    // Catálogos - Motivos
    Route::get('motivos', [MotivoController::class, 'index']);
    Route::get('motivos/{id}', [MotivoController::class, 'show']);
    Route::middleware('permission:motivos.manage')->group(function () {
        Route::post('motivos', [MotivoController::class, 'store']);
        Route::put('motivos/{id}', [MotivoController::class, 'update']);
        Route::delete('motivos/{id}', [MotivoController::class, 'destroy']);
    });

    // Registros
    Route::prefix('registros')->group(function () {
        Route::get('/', [RegistroController::class, 'index']);
        Route::post('/', [RegistroController::class, 'store']);
        Route::get('/estadisticas', [RegistroController::class, 'estadisticas']);
        Route::get('/{id}', [RegistroController::class, 'show']);
        Route::put('/{id}', [RegistroController::class, 'update']);
        Route::delete('/{id}', [RegistroController::class, 'destroy']);
    });

    // Usuarios (español para frontend)
    Route::prefix('usuarios')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::get('/{id}', [UserController::class, 'show']);
        Route::middleware('permission:usuarios.manage')->group(function () {
            Route::post('/', [UserController::class, 'store']);
            Route::put('/{id}', [UserController::class, 'update']);
            Route::delete('/{id}', [UserController::class, 'destroy']);
            Route::post('/{id}/roles', [UserController::class, 'assignRole']);
            Route::delete('/{id}/roles/{roleId}', [UserController::class, 'removeRole']);
        });
    });

    // Roles (español para frontend)
    Route::prefix('roles')->group(function () {
        Route::get('/', [RoleController::class, 'index']);
        Route::get('/{id}', [RoleController::class, 'show']);
        Route::middleware('permission:roles.manage')->group(function () {
            Route::post('/', [RoleController::class, 'store']);
            Route::put('/{id}', [RoleController::class, 'update']);
            Route::delete('/{id}', [RoleController::class, 'destroy']);
        });
    });

    // Permisos
    Route::get('/permisos', [RoleController::class, 'permissions']);

    // Rutas antiguas para compatibilidad
    Route::middleware('permission:users.manage')->prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::get('/estadisticas', [UserController::class, 'estadisticas']);
        Route::get('/{id}', [UserController::class, 'show']);
        Route::put('/{id}', [UserController::class, 'update']);
        Route::post('/{id}/toggle-active', [UserController::class, 'toggleActive']);
        Route::post('/{id}/assign-role', [UserController::class, 'assignRole']);
        Route::post('/{id}/remove-role', [UserController::class, 'removeRole']);
    });
});
