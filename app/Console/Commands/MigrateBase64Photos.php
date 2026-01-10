<?php

namespace App\Console\Commands;

use App\Helpers\ImageHelper;
use App\Models\ResultadoInspeccion;
use Illuminate\Console\Command;

class MigrateBase64Photos extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'photos:migrate-base64 
                            {--dry-run : Solo mostrar qué se haría sin ejecutar cambios}
                            {--limit=100 : Límite de registros a procesar por lote}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migra las fotos guardadas como base64 en la base de datos al sistema de archivos';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $limit = (int) $this->option('limit');

        $this->info('=== Migración de fotos Base64 a Filesystem ===');
        
        if ($dryRun) {
            $this->warn('⚠️  Modo dry-run: no se realizarán cambios');
        }

        // Buscar resultados con fotos base64
        $query = ResultadoInspeccion::where(function ($q) {
            $q->where('registro_fotografico_inicial', 'like', 'data:image/%')
              ->orWhere('registro_fotografico_inicial', 'regexp', '^[A-Za-z0-9+/=]{1000,}');
        })->orWhere(function ($q) {
            $q->where('registro_fotografico_final', 'like', 'data:image/%')
              ->orWhere('registro_fotografico_final', 'regexp', '^[A-Za-z0-9+/=]{1000,}');
        });

        $total = $query->count();
        $this->info("📊 Total de resultados con posibles fotos base64: {$total}");

        if ($total === 0) {
            $this->info('✅ No hay fotos base64 para migrar');
            return 0;
        }

        $processed = 0;
        $migrated = 0;
        $errors = 0;

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $query->chunk($limit, function ($resultados) use (&$processed, &$migrated, &$errors, $dryRun, $bar) {
            foreach ($resultados as $resultado) {
                $processed++;
                $changed = false;

                // Procesar foto inicial
                if ($resultado->registro_fotografico_inicial && ImageHelper::isBase64Image($resultado->registro_fotografico_inicial)) {
                    if ($dryRun) {
                        $this->newLine();
                        $this->line("  [DRY-RUN] Resultado #{$resultado->id}: migraría foto inicial");
                    } else {
                        $newPath = ImageHelper::saveBase64Image(
                            $resultado->registro_fotografico_inicial,
                            'inspecciones/fotos_iniciales',
                            'inicial_' . $resultado->local_id
                        );

                        if ($newPath) {
                            $resultado->registro_fotografico_inicial = $newPath;
                            $changed = true;
                        } else {
                            $errors++;
                            $this->newLine();
                            $this->error("  ❌ Error al migrar foto inicial del resultado #{$resultado->id}");
                        }
                    }
                }

                // Procesar foto final
                if ($resultado->registro_fotografico_final && ImageHelper::isBase64Image($resultado->registro_fotografico_final)) {
                    if ($dryRun) {
                        $this->newLine();
                        $this->line("  [DRY-RUN] Resultado #{$resultado->id}: migraría foto final");
                    } else {
                        $newPath = ImageHelper::saveBase64Image(
                            $resultado->registro_fotografico_final,
                            'inspecciones/fotos_finales',
                            'final_' . $resultado->local_id
                        );

                        if ($newPath) {
                            $resultado->registro_fotografico_final = $newPath;
                            $changed = true;
                        } else {
                            $errors++;
                            $this->newLine();
                            $this->error("  ❌ Error al migrar foto final del resultado #{$resultado->id}");
                        }
                    }
                }

                if ($changed && !$dryRun) {
                    $resultado->save();
                    $migrated++;
                }

                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine(2);

        $this->info('=== Resumen ===');
        $this->info("📝 Procesados: {$processed}");
        
        if (!$dryRun) {
            $this->info("✅ Migrados: {$migrated}");
            $this->info("❌ Errores: {$errors}");
        }

        return $errors > 0 ? 1 : 0;
    }
}
