<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecurringCharge extends Model
{
    use HasFactory;

    protected $table = 'recurring_charges';

    protected $fillable = [
        'charge_id',
        'name',
        'shop',
        'price',
        'status',
        'created_at',
        'updated_at',
        'activated_on',
        'cancelled_on',
        'trial_ends_on',
        'api_client_id',
        'confirmation_url',
    ];
}
