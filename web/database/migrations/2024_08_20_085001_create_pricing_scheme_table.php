<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePricingSchemeTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('pricing_schemes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('scheme_type', 50);
            $table->integer('initial_period');
            $table->decimal('initial_rate', 10, 2);
            $table->decimal('subsequent_rate', 10, 2)->nullable();
            $table->enum('time_unit', ['hours', 'days'])->default('hours');
            $table->integer('rental_limit')->nullable();
            $table->decimal('membership_fee', 10, 2)->nullable();
            $table->string('shop_name');

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
        Schema::dropIfExists('pricing_scheme');
    }
}
