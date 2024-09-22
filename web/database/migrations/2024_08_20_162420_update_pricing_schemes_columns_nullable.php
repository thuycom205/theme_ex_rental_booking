<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdatePricingSchemesColumnsNullable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('pricing_schemes', function (Blueprint $table) {
            // Making the existing columns nullable except shop_name and scheme_type
            $table->integer('initial_period')->nullable()->change();
            $table->decimal('initial_rate', 10, 2)->nullable()->change();
            $table->decimal('subsequent_rate', 10, 2)->nullable()->change();
            $table->string('time_unit', 50)->nullable()->default(null)->change();
            $table->integer('rental_limit')->nullable()->change();
            $table->decimal('membership_fee', 10, 2)->nullable()->change();

        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('pricing_schemes', function (Blueprint $table) {
            // Reverting columns back to not nullable
            $table->integer('initial_period')->nullable(false)->change();
            $table->decimal('initial_rate', 10, 2)->nullable(false)->change();
            $table->decimal('subsequent_rate', 10, 2)->nullable(false)->change();
            $table->string('time_unit', 50)->nullable(false)->default('hours')->change();
            $table->integer('rental_limit')->nullable(false)->change();
            $table->decimal('membership_fee', 10, 2)->nullable(false)->change();

        });
    }
}
