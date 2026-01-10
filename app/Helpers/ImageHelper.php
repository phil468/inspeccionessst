<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageHelper
{
    /**
     * Verifica si un string es una imagen base64
     */
    public static function isBase64Image(?string $data): bool
    {
        if (empty($data)) {
            return false;
        }
        
        // Si empieza con data:image/ es base64
        if (preg_match('/^data:image\//', $data)) {
            return true;
        }
        
        // Si es un string muy largo sin extensión de archivo, probablemente es base64
        if (strlen($data) > 1000 && !preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $data)) {
            return true;
        }
        
        return false;
    }

    /**
     * Guarda una imagen base64 en el filesystem y retorna la ruta
     * 
     * @param string $base64Data La imagen en formato base64 (con o sin prefijo data:image)
     * @param string $folder La carpeta donde guardar (ej: 'inspecciones/fotos_iniciales')
     * @param string $prefix Prefijo para el nombre del archivo
     * @return string|null La ruta del archivo guardado o null si falla
     */
    public static function saveBase64Image(string $base64Data, string $folder, string $prefix = 'img'): ?string
    {
        try {
            $imageData = $base64Data;
            $extension = 'jpg'; // Default
            
            // Extraer la extensión y remover el prefijo data:image si existe
            if (preg_match('/^data:image\/(\w+);base64,/', $base64Data, $type)) {
                $extension = strtolower($type[1]);
                $imageData = substr($base64Data, strpos($base64Data, ',') + 1);
            }
            
            // Normalizar extensión
            if ($extension === 'jpeg') {
                $extension = 'jpg';
            }
            
            // Decodificar base64
            $decodedData = base64_decode($imageData);
            
            if ($decodedData === false) {
                return null;
            }
            
            // Generar nombre único
            $filename = $prefix . '_' . Str::random(10) . '.' . $extension;
            $path = trim($folder, '/') . '/' . $filename;
            
            // Guardar archivo
            Storage::disk('public')->put($path, $decodedData);
            
            return $path;
        } catch (\Exception $e) {
            \Log::error('Error al guardar imagen base64: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Procesa un campo de imagen: si es base64 lo guarda en filesystem, si ya es ruta lo deja igual
     * 
     * @param string|null $imageData El dato de la imagen (base64 o ruta)
     * @param string $folder La carpeta donde guardar
     * @param string $prefix Prefijo para el nombre del archivo
     * @return string|null La ruta del archivo
     */
    public static function processImage(?string $imageData, string $folder, string $prefix = 'img'): ?string
    {
        if (empty($imageData)) {
            return null;
        }
        
        // Si es base64, guardarlo en filesystem
        if (self::isBase64Image($imageData)) {
            return self::saveBase64Image($imageData, $folder, $prefix);
        }
        
        // Si ya es una ruta, devolverla tal cual
        return $imageData;
    }
}
