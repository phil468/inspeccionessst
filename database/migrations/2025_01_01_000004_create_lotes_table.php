<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lotes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fundo_id')->constrained('fundos')->onDelete('cascade');
            $table->string('codigo');
            $table->string('nombre');
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();
            
            $table->unique(['fundo_id', 'codigo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lotes');
    }
};
