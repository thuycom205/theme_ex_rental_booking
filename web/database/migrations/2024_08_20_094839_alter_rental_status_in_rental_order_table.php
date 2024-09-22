<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AlterRentalStatusInRentalOrderTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('rental_order', function (Blueprint $table) {
            // Change the rental_status column from enum to varchar(255)
            $table->string('rental_status', 255)->default('reserved')->change();
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
            // Revert the rental_status column back to enum
            $table->enum('rental_status', ['reserved', 'rented', 'returned'])->default('reserved')->change();
        });
    }
}
