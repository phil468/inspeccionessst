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
        Schema::table('inspecciones', function (Blueprint $table) {
            if (!Schema::hasColumn('inspecciones', 'fundo_id')) {
                $table->unsignedBigInteger('fundo_id')->nullable()->after('area_id');
                // no foreign key to avoid issues if fondos table not present in some environments
                $table->index('fundo_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inspecciones', function (Blueprint $table) {
            if (Schema::hasColumn('inspecciones', 'fundo_id')) {
                $table->dropIndex(['fundo_id']);
                $table->dropColumn('fundo_id');
            }
        });
    }
};
