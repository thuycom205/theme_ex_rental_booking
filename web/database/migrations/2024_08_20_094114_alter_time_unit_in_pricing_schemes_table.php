<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AlterTimeUnitInPricingSchemesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('pricing_schemes', function (Blueprint $table) {
            // Change the time_unit column from enum to varchar(50)
            $table->string('time_unit', 50)->default('hours')->change();
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
            // Revert the time_unit column back to enum
            $table->enum('time_unit', ['hours', 'days'])->default('hours')->change();
        });
    }
}
