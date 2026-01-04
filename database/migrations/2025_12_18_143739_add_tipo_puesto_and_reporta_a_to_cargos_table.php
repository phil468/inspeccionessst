<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('cargos', function (Blueprint $table) {
            // Relación con tipo de puesto
            $table->unsignedBigInteger('tipo_de_puesto_id')->nullable()->after('empresa_id');
            
            // Auto-referencia a otro cargo (reporta a)
            $table->unsignedBigInteger('reporta_a')->nullable()->after('tipo_de_puesto_id');
            
            // Índices para mejor rendimiento
            $table->index('tipo_de_puesto_id');
            $table->index('reporta_a');
            
            // Foreign key para reporta_a (auto-referencia)
            $table->foreign('reporta_a')->references('id')->on('cargos')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cargos', function (Blueprint $table) {
            $table->dropForeign(['reporta_a']);
            $table->dropIndex(['tipo_de_puesto_id']);
            $table->dropIndex(['reporta_a']);
            $table->dropColumn(['tipo_de_puesto_id', 'reporta_a']);
        });
    }
};
