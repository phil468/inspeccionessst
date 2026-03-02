<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\PersonalSyncService;

class SyncPersonalFromExternalApi extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'personal:sync-from-api';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sincroniza el personal desde el API externo de Vanguard';

    protected $syncService;

    /**
     * Create a new command instance.
     */
    public function __construct(PersonalSyncService $syncService)
    {
        parent::__construct();
        $this->syncService = $syncService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Sin límite de tiempo para el comando CLI
        set_time_limit(0);
        ini_set('memory_limit', '512M');

        $this->info('Iniciando sincronización de personal desde API externo...');

        $result = $this->syncService->syncFromExternalApi();

        if ($result['success']) {
            $this->info('✓ ' . $result['message']);
            
            if (isset($result['stats'])) {
                $this->table(
                    ['Métrica', 'Cantidad'],
                    [
                        ['Nuevos', $result['stats']['nuevos']],
                        ['Actualizados', $result['stats']['actualizados']],
                        ['Cesados', $result['stats']['cesados']],
                        ['Errores', $result['stats']['errors']],
                    ]
                );
            }

            return Command::SUCCESS;
        } else {
            $this->error('✗ ' . $result['message']);
            return Command::FAILURE;
        }
    }
}
