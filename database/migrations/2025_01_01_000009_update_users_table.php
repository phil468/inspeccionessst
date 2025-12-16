<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('microsoft_id')->unique()->nullable()->after('email');
            $table->string('avatar')->nullable()->after('microsoft_id');
            $table->boolean('activo')->default(true)->after('avatar');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['microsoft_id', 'avatar', 'activo']);
        });
    }
};
