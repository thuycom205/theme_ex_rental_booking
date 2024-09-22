<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddFieldsToPricingSchemesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('pricing_schemes', function (Blueprint $table) {
            $table->decimal('daily_rate', 10, 2)->nullable()->after('subsequent_rate');
            $table->decimal('hourly_overage_rate', 10, 2)->nullable()->after('daily_rate');
            $table->integer('flat_rate_period')->nullable()->after('hourly_overage_rate');
            $table->decimal('flat_rate', 10, 2)->nullable()->after('flat_rate_period');
            $table->string('name')->nullable()->after('id'); // Adding name as nullable, can be changed to not null as per your needs
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
            $table->dropColumn(['daily_rate', 'hourly_overage_rate', 'flat_rate_period', 'flat_rate', 'name']);
        });
    }
}
