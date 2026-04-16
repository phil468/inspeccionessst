<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // $schedule->command('inspire')->hourly();        
        $schedule->command('personal:sync-from-api')
        // la hora diaria de actualizacion se obtiene de un campo en el .env sino será por defecto a las 09:00
        ->dailyAt(config('app.hora_actualizacion_personal', '14:00'))
        ->appendOutputTo(storage_path('logs/personal-actualizacion.log'));
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
