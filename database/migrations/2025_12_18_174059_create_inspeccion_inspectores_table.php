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
        Schema::create('inspeccion_inspectores', function (Blueprint $table) {
            $table->id();
            $table->uuid('local_id')->unique()->comment('ID para offline-first');
            $table->unsignedBigInteger('inspeccion_id');
            $table->unsignedBigInteger('personal_id')->comment('Inspector/Responsable de la inspección');
            $table->foreign('inspeccion_id')->references('id')->on('inspecciones')->onDelete('cascade');
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
        Schema::dropIfExists('inspeccion_inspectores');
    }
};
