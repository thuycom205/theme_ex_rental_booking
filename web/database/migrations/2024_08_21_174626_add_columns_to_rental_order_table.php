<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddColumnsToRentalOrderTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('rental_order', function (Blueprint $table) {
            $table->string('product_name')->nullable()->after('product_id');
            $table->string('customer_email')->nullable()->after('customer_id');
            $table->string('customer_last_name')->nullable()->after('customer_email');
            $table->time('start_time')->nullable()->after('rental_start_date');
            $table->integer('number_of_hour')->nullable()->after('start_time');
            $table->integer('number_of_day')->nullable()->after('number_of_hour');
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
            $table->dropColumn('product_name');
            $table->dropColumn('customer_email');
            $table->dropColumn('customer_last_name');
            $table->dropColumn('start_time');
            $table->dropColumn('number_of_hour');
            $table->dropColumn('number_of_day');
        });
    }
}
