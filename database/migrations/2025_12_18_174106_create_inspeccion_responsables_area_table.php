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
        Schema::create('inspeccion_responsables_area', function (Blueprint $table) {
            $table->id();
            $table->uuid('local_id')->unique()->comment('ID para offline-first');
            $table->unsignedBigInteger('inspeccion_id');
            $table->unsignedBigInteger('area_id');
            $table->unsignedBigInteger('personal_id')->comment('Responsable del área inspeccionada');
            $table->foreign('inspeccion_id')->references('id')->on('inspecciones')->onDelete('cascade');
            $table->foreign('area_id')->references('id')->on('areas')->onDelete('cascade');
            $table->foreign('personal_id')->references('id')->on('personal')->onDelete('cascade');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inspeccion_responsables_area');
    }
};
