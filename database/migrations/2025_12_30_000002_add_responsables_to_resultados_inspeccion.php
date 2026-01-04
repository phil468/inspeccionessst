<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resultados_inspeccion', function (Blueprint $table) {
            // Responsable del área
            $table->foreignId('responsable_id')->nullable()->after('inspeccion_id')
                ->constrained('personal')->onDelete('set null')
                ->comment('Responsable del área para este resultado');
        });

        // Tabla pivot para visores (personal de solo lectura)
        Schema::create('resultado_visores', function (Blueprint $table) {
            $table->id();
            $table->uuid('local_id')->unique()->comment('ID para offline-first');
            $table->foreignId('resultado_id')->constrained('resultados_inspeccion')->onDelete('cascade');
            $table->foreignId('personal_id')->constrained('personal')->onDelete('cascade');
            $table->timestamps();
            $table->softDeletes();
            
            $table->unique(['resultado_id', 'personal_id'], 'resultado_visor_unique');
        });

        // Tabla pivot para responsables de levantamiento
        Schema::create('resultado_responsables_levantamiento', function (Blueprint $table) {
            $table->id();
            $table->uuid('local_id')->unique()->comment('ID para offline-first');
            $table->foreignId('resultado_id')->constrained('resultados_inspeccion')->onDelete('cascade');
            $table->foreignId('personal_id')->constrained('personal')->onDelete('cascade');
            $table->timestamps();
            $table->softDeletes();
            
            $table->unique(['resultado_id', 'personal_id'], 'resultado_responsable_lev_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resultado_responsables_levantamiento');
        Schema::dropIfExists('resultado_visores');
        
        Schema::table('resultados_inspeccion', function (Blueprint $table) {
            $table->dropForeign(['responsable_id']);
            $table->dropColumn('responsable_id');
        });
    }
};
