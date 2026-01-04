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
        Schema::table('areas', function (Blueprint $table) {
            $table->string('idarea_nisira', 50)->nullable()->after('empresa_id');
            $table->index(['idarea_nisira', 'empresa_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('areas', function (Blueprint $table) {
            $table->dropIndex(['idarea_nisira', 'empresa_id']);
            $table->dropColumn('idarea_nisira');
        });
    }
};
