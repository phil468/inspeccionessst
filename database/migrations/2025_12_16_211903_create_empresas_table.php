<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('empresas', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('razon_social')->nullable();
            $table->string('ruc', 20)->nullable();
            $table->string('domicilio')->nullable();
            $table->string('actividad_economica')->nullable();
            $table->string('idempresa_nisira', 10)->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('activo');
            $table->index('ruc');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('empresas');
    }
};
