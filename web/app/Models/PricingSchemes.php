<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PricingSchemes extends Model
{
    use HasFactory;

    // Define the table associated with the PricingSchemes model
    protected $table = 'pricing_schemes';

    // Disable Laravel's mass assignment protection
    protected $guarded = [];
    // Optionally, you can define a relationship back to ProductPricingScheme
    public function productPricingSchemes()
    {
        return $this->hasMany(ProductPricingScheme::class, 'pricing_scheme_id');
    }
}
