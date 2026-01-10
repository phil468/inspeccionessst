<?php

namespace App\Console\Commands;

use App\Models\Inspeccion;
use App\Models\InspeccionArea;
use App\Models\InspeccionInspector;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanDuplicateRelations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'inspecciones:clean-duplicates 
                            {--dry-run : Solo mostrar qué se haría sin ejecutar cambios}
                            {--inspeccion= : Limpiar solo una inspección específica por ID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Limpia registros duplicados en las tablas de relaciones de inspecciones (áreas, inspectores)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $inspeccionId = $this->option('inspeccion');

        $this->info('=== Limpieza de relaciones duplicadas ===');
        
        if ($dryRun) {
            $this->warn('⚠️  Modo dry-run: no se realizarán cambios');
        }

        DB::beginTransaction();

        try {
            // Limpiar áreas duplicadas
            $this->limpiarAreasDuplicadas($inspeccionId, $dryRun);
            
            // Limpiar inspectores duplicados
            $this->limpiarInspectoresDuplicados($inspeccionId, $dryRun);

            if (!$dryRun) {
                DB::commit();
                $this->info('✅ Limpieza completada exitosamente');
            } else {
                DB::rollBack();
                $this->info('ℹ️  Dry-run completado. Ejecuta sin --dry-run para aplicar cambios.');
            }

            return 0;
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('❌ Error: ' . $e->getMessage());
            return 1;
        }
    }

    private function limpiarAreasDuplicadas(?string $inspeccionId, bool $dryRun): void
    {
        $this->info("\n📋 Analizando áreas duplicadas...");

        // Incluir registros soft-deleted para limpiar todos los duplicados
        $query = InspeccionArea::withTrashed()
            ->select('inspeccion_id', 'area_id', DB::raw('COUNT(*) as total'), DB::raw('MIN(id) as keep_id'))
            ->groupBy('inspeccion_id', 'area_id')
            ->having('total', '>', 1);

        if ($inspeccionId) {
            $query->where('inspeccion_id', $inspeccionId);
        }

        $duplicados = $query->get();

        if ($duplicados->isEmpty()) {
            $this->info('   ✓ No se encontraron áreas duplicadas');
            return;
        }

        $totalEliminados = 0;

        foreach ($duplicados as $dup) {
            $registrosAEliminar = InspeccionArea::withTrashed()
                ->where('inspeccion_id', $dup->inspeccion_id)
                ->where('area_id', $dup->area_id)
                ->where('id', '!=', $dup->keep_id)
                ->count();

            $this->line("   Inspección #{$dup->inspeccion_id}, Área #{$dup->area_id}: {$dup->total} registros ({$registrosAEliminar} a eliminar)");

            if (!$dryRun) {
                // Usar forceDelete para eliminar permanentemente
                InspeccionArea::withTrashed()
                    ->where('inspeccion_id', $dup->inspeccion_id)
                    ->where('area_id', $dup->area_id)
                    ->where('id', '!=', $dup->keep_id)
                    ->forceDelete();
            }

            $totalEliminados += $registrosAEliminar;
        }

        $this->info("   📊 Total áreas duplicadas a eliminar: {$totalEliminados}");
    }

    private function limpiarInspectoresDuplicados(?string $inspeccionId, bool $dryRun): void
    {
        $this->info("\n📋 Analizando inspectores duplicados...");

        // Incluir registros soft-deleted para limpiar todos los duplicados
        $query = InspeccionInspector::withTrashed()
            ->select('inspeccion_id', 'personal_id', DB::raw('COUNT(*) as total'), DB::raw('MIN(id) as keep_id'))
            ->groupBy('inspeccion_id', 'personal_id')
            ->having('total', '>', 1);

        if ($inspeccionId) {
            $query->where('inspeccion_id', $inspeccionId);
        }

        $duplicados = $query->get();

        if ($duplicados->isEmpty()) {
            $this->info('   ✓ No se encontraron inspectores duplicados');
            return;
        }

        $totalEliminados = 0;

        foreach ($duplicados as $dup) {
            $registrosAEliminar = InspeccionInspector::withTrashed()
                ->where('inspeccion_id', $dup->inspeccion_id)
                ->where('personal_id', $dup->personal_id)
                ->where('id', '!=', $dup->keep_id)
                ->count();

            $this->line("   Inspección #{$dup->inspeccion_id}, Personal #{$dup->personal_id}: {$dup->total} registros ({$registrosAEliminar} a eliminar)");

            if (!$dryRun) {
                // Usar forceDelete para eliminar permanentemente
                InspeccionInspector::withTrashed()
                    ->where('inspeccion_id', $dup->inspeccion_id)
                    ->where('personal_id', $dup->personal_id)
                    ->where('id', '!=', $dup->keep_id)
                    ->forceDelete();
            }

            $totalEliminados += $registrosAEliminar;
        }

        $this->info("   📊 Total inspectores duplicados a eliminar: {$totalEliminados}");
    }
}
