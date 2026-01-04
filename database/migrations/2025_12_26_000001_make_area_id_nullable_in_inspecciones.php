<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inspecciones', function (Blueprint $table) {
            // Hacer area_id nullable porque ahora usamos la tabla many-to-many inspeccion_areas
            $table->foreignId('area_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('inspecciones', function (Blueprint $table) {
            $table->foreignId('area_id')->nullable(false)->change();
        });
    }
};
