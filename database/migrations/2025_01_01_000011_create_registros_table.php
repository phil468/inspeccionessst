<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registros', function (Blueprint $table) {
            $table->id();
            $table->uuid('local_id')->unique()->nullable(); // Para sincronización offline
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('campania_id')->constrained('campanias')->onDelete('restrict');
            $table->foreignId('material_id')->constrained('materiales')->onDelete('restrict');
            $table->foreignId('fundo_id')->constrained('fundos')->onDelete('restrict');
            $table->foreignId('lote_id')->constrained('lotes')->onDelete('restrict');
            $table->foreignId('motivo_id')->constrained('motivos')->onDelete('restrict');
            $table->decimal('cantidad', 10, 2);
            $table->string('numero_tractor')->nullable();
            $table->text('observaciones')->nullable();
            $table->timestamp('fecha_registro');
            $table->boolean('synced')->default(false); // Indica si está sincronizado con el servidor
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['user_id', 'fecha_registro']);
            $table->index(['synced']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registros');
    }
};
