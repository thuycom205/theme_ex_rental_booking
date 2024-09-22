<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddTimeUnitToRentalOrderTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('rental_order', function (Blueprint $table) {
            $table->string('time_unit', 50)->nullable()->after('number_of_day');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('rental_order', function (Blueprint $table) {
            $table->dropColumn('time_unit');
        });
    }
}
