<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRecurringChargesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('recurring_charges', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('shop');
            $table->string('charge_id');
            $table->string('name');
            $table->decimal('price', 8, 2);
            $table->string('status');
            $table->timestamp('activated_on')->nullable();
            $table->timestamp('cancelled_on')->nullable();
            $table->timestamp('trial_ends_on')->nullable();
            $table->unsignedBigInteger('api_client_id');
            $table->string('confirmation_url');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('recurring_charges');
    }
}
