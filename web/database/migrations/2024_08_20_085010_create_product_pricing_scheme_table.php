<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProductPricingSchemeTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('product_pricing_scheme', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->string('product_handler')->nullable;
            $table->string('product_img')->nullable();
            $table->string('product_name')->nullable();;

            $table->unsignedBigInteger('pricing_scheme_id');
            $table->timestamps();
           // $table->foreign('pricing_scheme_id')->references('id')->on('pricing_schemes')->onDelete('cascade');
            $table->unique(['product_id', 'pricing_scheme_id']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('product_pricing_scheme');
    }
}
