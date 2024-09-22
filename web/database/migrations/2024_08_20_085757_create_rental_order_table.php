<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRentalOrderTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('rental_order', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('shop_name');

            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('pricing_scheme_id');
            $table->string('pricing_scheme_title');
            $table->text('pricing_scheme_detail');
            $table->unsignedBigInteger('customer_id');
            $table->dateTime('rental_start_date');
            $table->dateTime('rental_end_date');
            $table->enum('rental_status', ['reserved', 'rented', 'returned'])->default('reserved');
            $table->decimal('total_cost', 10, 2);
            $table->timestamps();

//            $table->foreign('pricing_scheme_id')->references('id')->on('pricing_schemes')->onDelete('cascade');
//            $table->foreign('product_id')->references('product_id')->on('product_pricing_scheme')->onDelete('cascade');
//            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('rental_order');
    }
}
