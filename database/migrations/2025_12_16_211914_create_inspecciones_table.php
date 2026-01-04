<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspecciones', function (Blueprint $table) {
            $table->id();
            $table->uuid('local_id')->unique();
            $table->foreignId('user_id')->constrained('users')->onDelete('restrict');
            $table->foreignId('empresa_id')->constrained('empresas')->onDelete('restrict');
            $table->foreignId('area_id')->constrained('areas')->onDelete('restrict');
            
            // Tipo de inspección
            $table->enum('tipo_inspeccion', ['Planeada', 'No Planeada', 'Otro'])->default('Planeada');
            $table->string('tipo_inspeccion_otro', 250)->nullable();
            
            // Vigencia
            $table->date('vigencia_desde')->nullable();
            $table->date('vigencia_hasta')->nullable();
            
            // Snapshot de datos de empresa (para histórico)
            $table->string('razon_social', 250)->nullable();
            $table->string('ruc', 11)->nullable();
            $table->text('domicilio')->nullable();
            $table->string('actividad_economica', 250)->nullable();
            
            // Datos de la inspección
            $table->text('zona_inspeccionada')->nullable();
            $table->string('numero_registro', 100)->nullable();
            $table->dateTime('fecha_hora_inspeccion')->nullable();
            $table->text('comentario')->nullable();
            $table->text('objetivo')->nullable();
            $table->text('descripcion_causa')->nullable();
            $table->text('conclusiones_recomendaciones')->nullable();
            
            // Control de sincronización offline-first
            $table->boolean('synced')->default(false);
            $table->timestamp('synced_at')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['user_id', 'synced']);
            $table->index(['empresa_id', 'area_id']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspecciones');
    }
};
