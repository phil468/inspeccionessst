<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('inspecciones', function (Blueprint $table) {
            // Primero actualizar registros con numero_registro null a un valor por defecto
            DB::statement("UPDATE inspecciones SET numero_registro = CONCAT('REG-', id) WHERE numero_registro IS NULL OR numero_registro = ''");
            
            // Luego cambiar numero_registro a requerido
            $table->string('numero_registro', 100)->nullable(false)->change();
            
            // Cambiar vigencia_desde y vigencia_hasta de date a datetime
            $table->dateTime('vigencia_desde')->nullable()->change();
            $table->dateTime('vigencia_hasta')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inspecciones', function (Blueprint $table) {
            // Revertir numero_registro a nullable
            $table->string('numero_registro', 100)->nullable()->change();
            
            // Revertir vigencia a date
            $table->date('vigencia_desde')->nullable()->change();
            $table->date('vigencia_hasta')->nullable()->change();
        });
    }
};
