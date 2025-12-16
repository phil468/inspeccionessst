<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Campania;
use App\Models\Material;
use App\Models\Fundo;
use App\Models\Lote;
use App\Models\Motivo;

class CatalogosSeeder extends Seeder
{
    public function run(): void
    {
        // Crear campañas
        $campanias = [
            ['nombre' => 'Campaña 2024-2025', 'anio_inicio' => 2024, 'anio_fin' => 2025, 'activo' => true],
            ['nombre' => 'Campaña 2023-2024', 'anio_inicio' => 2023, 'anio_fin' => 2024, 'activo' => false],
        ];

        foreach ($campanias as $campania) {
            Campania::firstOrCreate(
                ['nombre' => $campania['nombre']],
                $campania
            );
        }

        // Crear materiales de ejemplo
        $materiales = [
            ['codigo' => 'MAT001', 'nombre' => 'Fertilizante NPK', 'descripcion' => 'Fertilizante compuesto', 'activo' => true],
            ['codigo' => 'MAT002', 'nombre' => 'Urea', 'descripcion' => 'Fertilizante nitrogenado', 'activo' => true],
            ['codigo' => 'MAT003', 'nombre' => 'Sulfato de Potasio', 'descripcion' => 'Fertilizante potásico', 'activo' => true],
            ['codigo' => 'MAT004', 'nombre' => 'Insecticida A', 'descripcion' => 'Control de plagas', 'activo' => true],
            ['codigo' => 'MAT005', 'nombre' => 'Fungicida B', 'descripcion' => 'Control de hongos', 'activo' => true],
        ];

        foreach ($materiales as $material) {
            Material::firstOrCreate(
                ['codigo' => $material['codigo']],
                $material
            );
        }

        // Crear fundos
        $fundos = [
            ['nombre' => 'Fundo Santa Rosa', 'ubicacion' => 'Ica', 'activo' => true],
            ['nombre' => 'Fundo El Paraíso', 'ubicacion' => 'Lima', 'activo' => true],
            ['nombre' => 'Fundo San Juan', 'ubicacion' => 'Arequipa', 'activo' => true],
        ];

        foreach ($fundos as $fundoData) {
            $fundo = Fundo::firstOrCreate(
                ['nombre' => $fundoData['nombre']],
                $fundoData
            );

            // Crear lotes para cada fundo
            if ($fundo->wasRecentlyCreated || $fundo->lotes()->count() === 0) {
                for ($i = 1; $i <= 5; $i++) {
                    Lote::create([
                        'fundo_id' => $fundo->id,
                        'codigo' => 'L' . str_pad($i, 3, '0', STR_PAD_LEFT),
                        'nombre' => 'Lote ' . $i,
                        'activo' => true,
                    ]);
                }
            }
        }

        // Crear motivos
        $motivos = [
            ['nombre' => 'Fertilización', 'descripcion' => 'Aplicación de fertilizantes', 'activo' => true],
            ['nombre' => 'Control de Plagas', 'descripcion' => 'Aplicación de insecticidas', 'activo' => true],
            ['nombre' => 'Control de Enfermedades', 'descripcion' => 'Aplicación de fungicidas', 'activo' => true],
            ['nombre' => 'Mantenimiento', 'descripcion' => 'Trabajos de mantenimiento general', 'activo' => true],
            ['nombre' => 'Calibración', 'descripcion' => 'Pruebas de calibración de equipos', 'activo' => true],
        ];

        foreach ($motivos as $motivo) {
            Motivo::firstOrCreate(
                ['nombre' => $motivo['nombre']],
                $motivo
            );
        }

        $this->command->info('Catálogos creados exitosamente');
    }
}
