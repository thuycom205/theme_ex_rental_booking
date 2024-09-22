<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RentalOrder extends Model
{
    use HasFactory;

    // Define the table associated with the RentalOrder model
    protected $table = 'rental_order';

    // Disable Laravel's mass assignment protection
    protected $guarded = [];
}
