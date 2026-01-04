<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileUploadController extends Controller
{
    /**
     * Subir foto de inspección (inicial o final de resultado)
     */
    public function uploadFoto(Request $request)
    {
        $request->validate([
            'foto' => 'required|image|mimes:jpeg,png,jpg|max:5120', // Max 5MB
            'tipo' => 'required|in:inicial,final',
            'resultado_id' => 'nullable|string',
        ]);

        try {
            $file = $request->file('foto');
            $tipo = $request->input('tipo');
            
            // Generar nombre único
            $filename = Str::uuid() . '_' . $tipo . '.' . $file->getClientOriginalExtension();
            
            // Guardar en storage/app/public/inspecciones
            $path = $file->storeAs('inspecciones', $filename, 'public');
            
            // URL pública
            $url = Storage::url($path);

            return response()->json([
                'success' => true,
                'message' => 'Foto subida exitosamente',
                'data' => [
                    'url' => $url,
                    'path' => $path,
                    'filename' => $filename,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al subir foto',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar foto
     */
    public function deleteFoto(Request $request)
    {
        $request->validate([
            'path' => 'required|string',
        ]);

        try {
            $path = str_replace('/storage/', '', $request->input('path'));
            
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Foto eliminada exitosamente',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Foto no encontrada',
            ], 404);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar foto',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
