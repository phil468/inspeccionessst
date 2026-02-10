<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Agrega 'Cumplimiento' y 'Buena Práctica' al enum `estado`
        DB::statement("ALTER TABLE `resultados_inspeccion` MODIFY `estado` ENUM('Pendiente','En Proceso','Ejecutado','Cerrado','Cumplimiento','Buena Práctica') NOT NULL DEFAULT 'Pendiente'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revierte a los valores originales
        DB::statement("ALTER TABLE `resultados_inspeccion` MODIFY `estado` ENUM('Pendiente','En Proceso','Ejecutado','Cerrado') NOT NULL DEFAULT 'Pendiente'");
    }
};
