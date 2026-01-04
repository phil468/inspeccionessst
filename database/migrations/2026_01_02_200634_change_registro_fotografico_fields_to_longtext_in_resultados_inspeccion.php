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
        Schema::table('resultados_inspeccion', function (Blueprint $table) {
            $table->longText('registro_fotografico_inicial')->nullable()->change();
            $table->longText('registro_fotografico_final')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('resultados_inspeccion', function (Blueprint $table) {
            $table->string('registro_fotografico_inicial')->nullable()->change();
            $table->string('registro_fotografico_final')->nullable()->change();
        });
    }
};
