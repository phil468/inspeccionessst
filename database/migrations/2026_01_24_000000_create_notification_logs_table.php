<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateNotificationLogsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('notification_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('inspeccion_id')->nullable();
            $table->unsignedBigInteger('personal_id')->nullable();
            $table->string('canal'); // 'email' | 'push'
            $table->string('estado'); // 'sent' | 'omitted' | 'error'
            $table->text('motivo')->nullable();
            $table->json('detalles')->nullable();
            $table->integer('resultados_count')->nullable();
            $table->timestamps();

            $table->index('inspeccion_id');
            $table->index('personal_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('notification_logs');
    }
}
