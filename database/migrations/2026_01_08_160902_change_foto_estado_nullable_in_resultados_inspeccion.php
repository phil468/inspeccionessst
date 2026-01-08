<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Cambiar foto_final_estado y foto_inicial_estado para que sean nullable
     * y establecer como NULL los registros que no tienen foto subida
     */
    public function up(): void
    {
        // Cambiar la columna a nullable (usando raw SQL porque Laravel no permite cambiar enum fácilmente)
        DB::statement("ALTER TABLE resultados_inspeccion MODIFY foto_inicial_estado ENUM('pendiente', 'aprobada', 'rechazada') NULL DEFAULT NULL");
        DB::statement("ALTER TABLE resultados_inspeccion MODIFY foto_final_estado ENUM('pendiente', 'aprobada', 'rechazada') NULL DEFAULT NULL");
        
        // Actualizar los registros existentes: si no hay foto, el estado debe ser NULL
        DB::table('resultados_inspeccion')
            ->whereNull('registro_fotografico_inicial')
            ->update(['foto_inicial_estado' => null]);
            
        DB::table('resultados_inspeccion')
            ->whereNull('registro_fotografico_final')
            ->update(['foto_final_estado' => null]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Volver a establecer 'pendiente' como default
        DB::statement("ALTER TABLE resultados_inspeccion MODIFY foto_inicial_estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente'");
        DB::statement("ALTER TABLE resultados_inspeccion MODIFY foto_final_estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente'");
        
        // Actualizar NULL a 'pendiente'
        DB::table('resultados_inspeccion')
            ->whereNull('foto_inicial_estado')
            ->update(['foto_inicial_estado' => 'pendiente']);
            
        DB::table('resultados_inspeccion')
            ->whereNull('foto_final_estado')
            ->update(['foto_final_estado' => 'pendiente']);
    }
};
