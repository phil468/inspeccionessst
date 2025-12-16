<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Ejecutar seeders en orden
        $this->call([
            RolesAndPermissionsSeeder::class,
            PermissionsSeeder::class,
            CatalogosSeeder::class,
        ]);

        $this->command->info('Base de datos poblada exitosamente');
    }
}
