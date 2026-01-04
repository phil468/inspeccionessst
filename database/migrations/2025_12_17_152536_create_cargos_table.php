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
        Schema::create('cargos', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->nullable();
            $table->string('idcargo_nisira', 50)->nullable();
            $table->date('fechacreacion_nisira')->nullable();
            $table->unsignedBigInteger('empresa_id')->nullable();
            $table->tinyInteger('estado')->default(1);
            $table->timestamps();
            $table->softDeletes();

            $table->index('name');
            $table->foreign('empresa_id')->references('id')->on('empresas')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cargos');
    }
};
