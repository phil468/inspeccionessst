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
        Schema::create('personal', function (Blueprint $table) {
            $table->id();
            $table->string('dni', 100)->unique()->nullable();
            $table->string('name', 250)->nullable(); // Nombre completo
            $table->string('nombres', 250)->nullable();
            $table->string('apellido_paterno', 250)->nullable();
            $table->string('apellido_materno', 250)->nullable();
            
            // Relaciones con catálogos
            $table->unsignedBigInteger('empresa_id')->nullable();
            $table->unsignedBigInteger('area_id')->nullable();
            $table->unsignedBigInteger('cargo_id')->nullable();
            $table->unsignedBigInteger('tipo_de_trabajador_id')->nullable();
            $table->unsignedBigInteger('tipo_de_personal_id')->nullable();
            $table->unsignedBigInteger('planilla_id')->nullable();
            $table->unsignedBigInteger('reporta_a')->nullable(); // Referencia a otro personal
            
            // Contacto
            $table->string('correo_empresa', 250)->nullable();
            $table->string('celular_empresa', 250)->nullable();
            
            // Datos adicionales
            $table->char('genero', 1)->nullable(); // M o F
            $table->char('sexo', 1)->nullable(); // M o F
            $table->date('fecha_ingreso')->nullable();
            $table->date('fecha_cese')->nullable();
            
            // Estados y control
            $table->tinyInteger('estado')->default(1);
            $table->tinyInteger('seleccionado')->default(0)->comment('Indica si ha sido seleccionado para campaña actual');
            $table->tinyInteger('cesado')->default(0);
            $table->tinyInteger('importado')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Índices
            $table->index('name');
            $table->index('empresa_id');
            $table->index('area_id');
            $table->index('cargo_id');
            
            // Llaves foráneas
            $table->foreign('empresa_id')->references('id')->on('empresas')->onDelete('set null');
            $table->foreign('area_id')->references('id')->on('areas')->onDelete('set null');
            $table->foreign('cargo_id')->references('id')->on('cargos')->onDelete('set null');
            $table->foreign('tipo_de_trabajador_id')->references('id')->on('tipo_de_trabajador')->onDelete('set null');
            $table->foreign('tipo_de_personal_id')->references('id')->on('tipo_de_personal')->onDelete('set null');
            $table->foreign('planilla_id')->references('id')->on('planillas')->onDelete('set null');
            $table->foreign('reporta_a')->references('id')->on('personal')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('personal');
    }
};
