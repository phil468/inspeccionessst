<?php

namespace App\Console\Commands;

use App\Models\Personal;
use Illuminate\Console\Command;

class UpdatePersonalNames extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'personal:update-names';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Actualiza el campo name de todos los registros de personal basándose en apellido_paterno, apellido_materno y nombres';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Actualizando nombres del personal...');
        
        $personal = Personal::all();
        $updated = 0;
        
        foreach ($personal as $p) {
            $oldName = $p->name;
            
            $newName = trim(
                ($p->apellido_paterno ?? '') . ' ' .
                ($p->apellido_materno ?? '') . ' ' .
                ($p->nombres ?? '')
            );
            
            if ($newName !== '' && $oldName !== $newName) {
                $p->name = $newName;
                $p->save();
                $updated++;
                
                $this->line("✓ Actualizado: {$p->dni} - {$newName}");
            }
        }
        
        $this->info("Total de registros actualizados: {$updated}");
        $this->info('¡Proceso completado!');
        
        return Command::SUCCESS;
    }
}
