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
        Schema::table('inspeccion_inspectores', function (Blueprint $table) {
            $table->date('fecha_firma')->nullable()->after('personal_id');
            $table->text('firma_digital')->nullable()->after('fecha_firma');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inspeccion_inspectores', function (Blueprint $table) {
            $table->dropColumn(['fecha_firma', 'firma_digital']);
        });
    }
};
