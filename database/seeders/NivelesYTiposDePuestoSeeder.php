<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\NivelJerarquico;
use App\Models\TipoDePuesto;

class NivelesYTiposDePuestoSeeder extends Seeder
{
    public function run(): void
    {
        // Crear niveles jerárquicos
        $nivel1 = NivelJerarquico::create(['name' => 'NIVEL I', 'estado' => 1]);
        $nivel2 = NivelJerarquico::create(['name' => 'NIVEL II', 'estado' => 1]);
        $nivel3 = NivelJerarquico::create(['name' => 'NIVEL III', 'estado' => 1]);
        $nivel4 = NivelJerarquico::create(['name' => 'NIVEL IV', 'estado' => 1]);

        // Crear tipos de puesto asociados a cada nivel
        $tiposDePuesto = [
            // Nivel I
            ['name' => 'Gerencia Corporativa', 'nivel_jerarquico_id' => $nivel1->id],
            ['name' => 'Gerencia de Línea', 'nivel_jerarquico_id' => $nivel1->id],
            
            // Nivel II
            ['name' => 'Subgerencia', 'nivel_jerarquico_id' => $nivel2->id],
            ['name' => 'Jefatura I', 'nivel_jerarquico_id' => $nivel2->id],
            
            // Nivel III
            ['name' => 'Jefatura II/Coordinador/Gestor', 'nivel_jerarquico_id' => $nivel3->id],
            ['name' => 'Analista', 'nivel_jerarquico_id' => $nivel3->id],
            ['name' => 'Supervisor', 'nivel_jerarquico_id' => $nivel3->id],
            
            // Nivel IV
            ['name' => 'Asistente', 'nivel_jerarquico_id' => $nivel4->id],
            ['name' => 'Auxiliar', 'nivel_jerarquico_id' => $nivel4->id],
            ['name' => 'Técnico', 'nivel_jerarquico_id' => $nivel4->id],
        ];

        foreach ($tiposDePuesto as $tipo) {
            TipoDePuesto::create(array_merge($tipo, ['estado' => 1]));
        }

        $this->command->info('Niveles jerárquicos y tipos de puesto creados exitosamente');
    }
}
