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
        Schema::create('responsable_registro', function (Blueprint $table) {
            $table->id();
            $table->uuid('local_id')->unique()->comment('ID para offline-first');
            $table->unsignedBigInteger('inspeccion_id');
            $table->unsignedBigInteger('personal_id')->comment('Responsable del registro (quien firma)');
            $table->date('fecha_firma')->nullable();
            $table->string('firma_digital')->nullable()->comment('URL/ruta de la firma digitalizada');
            $table->foreign('inspeccion_id')->references('id')->on('inspecciones')->onDelete('cascade');
            $table->foreign('personal_id')->references('id')->on('personal')->onDelete('cascade');
            $table->timestamps();
            $table->softDeletes();
            
            // Solo un responsable de registro por inspección
            $table->unique('inspeccion_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('responsable_registro');
    }
};
