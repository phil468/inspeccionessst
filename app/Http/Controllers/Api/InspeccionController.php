<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inspeccion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class InspeccionController extends Controller
{
    /**
     * Listar inspecciones del usuario autenticado
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Inspeccion::query();

        // Filtrar por usuario autenticado
        $query->porUsuario($user->id);

        // Filtrar por estado de sincronización
        if ($request->has('synced')) {
            if ($request->boolean('synced')) {
                $query->sincronizado();
            } else {
                $query->pendienteSincronizacion();
            }
        }

        // Filtrar por empresa
        if ($request->filled('empresa_id')) {
            $query->porEmpresa($request->empresa_id);
        }

        // Filtrar por área
        if ($request->filled('area_id')) {
            $query->porArea($request->area_id);
        }

        // Filtrar por rango de fechas
        if ($request->filled('fecha_inicio')) {
            $fechaFin = $request->fecha_fin ?? $request->fecha_inicio;
            $query->porFecha($request->fecha_inicio, $fechaFin);
        }

        // Incluir relaciones
        $query->conRelaciones();

        // Ordenar por más reciente
        $query->latest('created_at');

        // Paginación
        $perPage = $request->input('per_page', 50);
        $inspecciones = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $inspecciones->items(),
            'pagination' => [
                'total' => $inspecciones->total(),
                'per_page' => $inspecciones->perPage(),
                'current_page' => $inspecciones->currentPage(),
                'last_page' => $inspecciones->lastPage(),
            ],
        ]);
    }

    /**
     * Crear nueva inspección (online u offline)
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'local_id' => 'nullable|string|uuid',
            'empresa_id' => 'required|exists:empresas,id',
            'area_id' => 'required|exists:areas,id',
            'tipo_inspeccion' => 'required|in:Planeada,No Planeada,Otro',
            'fundo_id' => 'nullable|exists:fundos,id',
            'tipo_inspeccion_otro' => 'nullable|string|max:250',
            'vigencia_desde' => 'nullable|date',
            'vigencia_hasta' => 'nullable|date|after_or_equal:vigencia_desde',
            'razon_social' => 'nullable|string|max:250',
            'ruc' => 'nullable|string|max:11',
            'domicilio' => 'nullable|string',
            'actividad_economica' => 'nullable|string|max:250',
            'zona_inspeccionada' => 'nullable|string',
            'numero_registro' => 'nullable|string|max:100',
            'fecha_inspeccion' => 'nullable|date',
            'hora_inspeccion' => 'nullable|date_format:H:i:s',
            'comentario' => 'nullable|string',
            'objetivo' => 'nullable|string',
            'descripcion_causa' => 'nullable|string',
            'conclusiones_recomendaciones' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        $data['user_id'] = $user->id;

        // Si viene de sincronización offline, verificar que no exista ya por local_id
        if (isset($data['local_id'])) {
            $existente = Inspeccion::where('local_id', $data['local_id'])->first();
            if ($existente) {
                return response()->json([
                    'success' => true,
                    'message' => 'Inspección ya existe (sincronizada previamente)',
                    'data' => $existente->load(['empresa', 'area']),
                ], 200);
            }
        }

        // Si es creación desde el servidor, marcar como sincronizado
        if (!$request->has('local_id')) {
            $data['synced'] = true;
            $data['synced_at'] = now();
        }

        $inspeccion = Inspeccion::create($data);
        $inspeccion->load(['empresa', 'area']);

        return response()->json([
            'success' => true,
            'message' => 'Inspección creada exitosamente',
            'data' => $inspeccion,
        ], 201);
    }

    /**
     * Mostrar una inspección específica
     */
    public function show(Request $request, string $id)
    {
        $user = $request->user();
        
        $inspeccion = Inspeccion::conRelaciones()
            ->where('id', $id)
            ->first();

        if (!$inspeccion) {
            return response()->json([
                'success' => false,
                'message' => 'Inspección no encontrada',
            ], 404);
        }

        // Verificar permisos: creador, inspector o personal asignado
        $personalId = $user->personal_id;
        $esCreador = $inspeccion->user_id === $user->id;
        $esInspector = $inspeccion->inspectores->contains('id', $personalId);
        $esAsignado = $inspeccion->resultados->contains(function ($resultado) use ($personalId) {
            return $resultado->responsable_id === $personalId ||
                   $resultado->visores->contains('id', $personalId) ||
                   $resultado->responsablesLevantamiento->contains('id', $personalId);
        });
        $esAdmin = $user->hasRole('Administrador');

        if (!$esCreador && !$esInspector && !$esAsignado && !$esAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para ver esta inspección',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $inspeccion,
        ]);
    }

    /**
     * Actualizar una inspección
     */
    public function update(Request $request, string $id)
    {
        $user = $request->user();
        
        $inspeccion = Inspeccion::find($id);

        if (!$inspeccion) {
            return response()->json([
                'success' => false,
                'message' => 'Inspección no encontrada',
            ], 404);
        }

        // Verificar que la inspección pertenezca al usuario
        if ($inspeccion->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para editar esta inspección',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'empresa_id' => 'sometimes|required|exists:empresas,id',
            'fundo_id' => 'nullable|exists:fundos,id',
            'area_id' => 'sometimes|required|exists:areas,id',
            'tipo_inspeccion' => 'sometimes|required|in:Planeada,No Planeada,Otro',
            'tipo_inspeccion_otro' => 'nullable|string|max:250',
            'vigencia_desde' => 'nullable|date',
            'vigencia_hasta' => 'nullable|date',
            'razon_social' => 'nullable|string|max:250',
            'ruc' => 'nullable|string|max:11',
            'domicilio' => 'nullable|string',
            'actividad_economica' => 'nullable|string|max:250',
            'zona_inspeccionada' => 'nullable|string',
            'numero_registro' => 'nullable|string|max:100',
            'fecha_inspeccion' => 'nullable|date',
            'hora_inspeccion' => 'nullable|date_format:H:i:s',
            'comentario' => 'nullable|string',
            'objetivo' => 'nullable|string',
            'descripcion_causa' => 'nullable|string',
            'conclusiones_recomendaciones' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $inspeccion->update($validator->validated());
        $inspeccion->load(['empresa', 'area']);

        return response()->json([
            'success' => true,
            'message' => 'Inspección actualizada exitosamente',
            'data' => $inspeccion,
        ]);
    }

    /**
     * Eliminar (soft delete) una inspección
     */
    public function destroy(Request $request, string $id)
    {
        $user = $request->user();
        
        $inspeccion = Inspeccion::find($id);

        if (!$inspeccion) {
            return response()->json([
                'success' => false,
                'message' => 'Inspección no encontrada',
            ], 404);
        }

        // Verificar que la inspección pertenezca al usuario
        if ($inspeccion->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para eliminar esta inspección',
            ], 403);
        }

        $inspeccion->delete();

        return response()->json([
            'success' => true,
            'message' => 'Inspección eliminada exitosamente',
        ]);
    }

    /**
     * Descargar plantilla Excel para una inspección (rellenada si es posible)
     */
    public function downloadTemplate(Request $request, string $id)
    {
        try {
            $inspeccion = Inspeccion::with(['empresa', 'area', 'resultados'])->find($id);

            if (!$inspeccion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Inspección no encontrada',
                ], 404);
            }

            $templatePath = public_path('storage/inspecciones/template/template_inspeccion.xlsx');

            if (!File::exists($templatePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Plantilla no encontrada en el servidor',
                ], 404);
            }

            $filename = 'inspeccion_' . ($inspeccion->numero_registro ?? $inspeccion->id) . '.xlsx';

            // Si PhpSpreadsheet está disponible, intentamos abrir y rellenar algunos campos básicos
            if (class_exists('PhpOffice\\PhpSpreadsheet\\IOFactory') || class_exists('\\PhpOffice\\PhpSpreadsheet\\IOFactory')) {
                try {
                    $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($templatePath);

                    // Ejemplo: rellenar celdas A1..A4 con información básica
                    $sheet = $spreadsheet->getActiveSheet();
                    $sheet->setCellValue('A1', 'Número de registro: ' . ($inspeccion->numero_registro ?? ''));
                    $sheet->setCellValue('A2', 'Empresa: ' . (optional($inspeccion->empresa)->name ?? ''));
                    $sheet->setCellValue('A3', 'Área: ' . (optional($inspeccion->area)->name ?? ''));
                    $sheet->setCellValue('A4', 'Fecha creación: ' . $inspeccion->created_at);

                    // Guardar en un archivo temporal
                    $tempFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . Str::random(12) . '.xlsx';
                    $writer = \PhpOffice\PhpSpreadsheet\IOFactory::createWriter($spreadsheet, 'Xlsx');
                    $writer->save($tempFile);

                    return response()->download($tempFile, $filename)->deleteFileAfterSend(true);
                } catch (\Throwable $e) {
                    // Si falla la generación con PhpSpreadsheet, cae al fallback
                    \Log::warning('Error generando plantilla con PhpSpreadsheet: ' . $e->getMessage());
                }
            }

            // Fallback: devolver la plantilla original sin modificar
            return response()->download($templatePath, $filename);
        } catch (\Throwable $e) {
            \Log::error('Error en downloadTemplate: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al generar/descargar la plantilla',
            ], 500);
        }
    }
}
