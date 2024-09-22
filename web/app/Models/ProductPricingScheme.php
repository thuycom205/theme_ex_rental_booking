<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductPricingScheme extends Model
{
    use HasFactory;

    // Define the table associated with the ProductPricingScheme model
    protected $table = 'product_pricing_scheme';

    // Disable Laravel's mass assignment protection
    protected $guarded = [];
    // Define the relationship with PricingSchemes
    public function pricingScheme()
    {
        return $this->belongsTo(PricingSchemes::class, 'pricing_scheme_id');
    }
}
