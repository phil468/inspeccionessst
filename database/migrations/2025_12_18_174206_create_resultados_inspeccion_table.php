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
        Schema::create('resultados_inspeccion', function (Blueprint $table) {
            $table->id();
            $table->uuid('local_id')->unique()->comment('ID para offline-first');
            $table->unsignedBigInteger('inspeccion_id');
            $table->text('descripcion')->comment('Descripción del hallazgo/acto/condición');
            $table->string('registro_fotografico_inicial')->nullable()->comment('URL/ruta de la foto inicial');
            $table->enum('nivel_riesgo', ['Alto', 'Medio', 'Bajo'])->comment('Nivel de riesgo: Alto, Medio, Bajo');
            $table->text('accion_tomar')->nullable()->comment('Acción a tomar para corregir');
            $table->enum('estado', ['Pendiente', 'En Proceso', 'Ejecutado', 'Cerrado'])->default('Pendiente');
            $table->date('fecha_cierre')->nullable()->comment('Fecha de cierre del hallazgo');
            $table->string('registro_fotografico_final')->nullable()->comment('URL/ruta de la foto final (después de corregir)');
            $table->boolean('synced')->default(false);
            $table->timestamp('synced_at')->nullable();
            $table->foreign('inspeccion_id')->references('id')->on('inspecciones')->onDelete('cascade');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('resultados_inspeccion');
    }
};
