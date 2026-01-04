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
        Schema::table('resultados_inspeccion', function (Blueprint $table) {
            // Estados de aprobación de fotos
            $table->enum('foto_inicial_estado', ['pendiente', 'aprobada', 'rechazada'])->default('pendiente')->after('registro_fotografico_inicial');
            $table->text('foto_inicial_comentario')->nullable()->after('foto_inicial_estado');
            $table->unsignedBigInteger('foto_inicial_aprobador_id')->nullable()->after('foto_inicial_comentario');
            $table->timestamp('foto_inicial_aprobada_at')->nullable()->after('foto_inicial_aprobador_id');

            $table->enum('foto_final_estado', ['pendiente', 'aprobada', 'rechazada'])->default('pendiente')->after('registro_fotografico_final');
            $table->text('foto_final_comentario')->nullable()->after('foto_final_estado');
            $table->unsignedBigInteger('foto_final_aprobador_id')->nullable()->after('foto_final_comentario');
            $table->timestamp('foto_final_aprobada_at')->nullable()->after('foto_final_aprobador_id');

            // Foreign keys
            $table->foreign('foto_inicial_aprobador_id')->references('id')->on('personal')->onDelete('set null');
            $table->foreign('foto_final_aprobador_id')->references('id')->on('personal')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('resultados_inspeccion', function (Blueprint $table) {
            $table->dropForeign(['foto_inicial_aprobador_id']);
            $table->dropForeign(['foto_final_aprobador_id']);
            
            $table->dropColumn([
                'foto_inicial_estado',
                'foto_inicial_comentario',
                'foto_inicial_aprobador_id',
                'foto_inicial_aprobada_at',
                'foto_final_estado',
                'foto_final_comentario',
                'foto_final_aprobador_id',
                'foto_final_aprobada_at',
            ]);
        });
    }
};
