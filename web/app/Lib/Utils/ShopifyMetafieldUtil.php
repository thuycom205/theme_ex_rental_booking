<?php
namespace App\Lib\Utils;
use Shopify\Clients\Graphql;

use App\Models\Session;
class ShopifyMetafieldUtil {
    public static function createRentalPricingMetafield(
        $schemeId =0,
        $schemeType = 'tieredRate',
        $flatRatePeriod = 24,
        $timeUnit = 'hours',
        $flatRate = 50.00,
        $initialPeriod = 2,
        $initialRate = 20.00,
        $subsequentRate = 5.00,
        $dailyRate = 50.00,
        $hourlyOverageRate = 10.00,
        $rentalLimit = null,
        $membershipFee = null,
        $shopName = 'example_shop',
        $productId = 123456 // Example product ID
    ) {
        $predefinedPeriods = [ 1, 2, 3 ];
        $timeBlockPricing  = [];

        switch ( $schemeType ) {
            case "flatRate":
                foreach ( $predefinedPeriods as $multiplier ) {
                    $price = $flatRate * $multiplier;

                    $timeBlockPricing[] = [
                        'block' => $multiplier,
                        'unit'  => $timeUnit,
                        'price' => $price
                    ];
                }
                break;

            case "tieredRate":
                foreach ( $predefinedPeriods as $multiplier ) {
                    $timeBlockPricing[] = [
                        'init_block'        => $multiplier,
                        'subsequence_block' => $multiplier - 1,
                        'unit'              => $timeUnit,
                        'price'             => $dailyRate * $multiplier + $subsequentRate * ( $multiplier - 1 ),
                    ];
                }
                break;

            case "dailyRate":
                foreach ( $predefinedPeriods as $multiplier ) {
                    $timeBlockPricing[] = [
                        'init_block'        => 1,
                        'subsequence_block' => $multiplier,
                        'unit'              => $timeUnit,
                        'price'             => $dailyRate + $hourlyOverageRate * $multiplier,
                    ];
                }
                break;
        }

        // Return the metafield payload in the format expected by Shopify's GraphQL API
        return [
            'namespace' => 'rental_pricing',
            'key'       => 'pricing_scheme',
            'value'     => json_encode( [
                'scheme_id'           => $schemeId,
                'scheme_type'         => $schemeType,
                'initial_period'      => $initialPeriod,
                'initial_rate'        => $initialRate,
                'subsequent_rate'     => $subsequentRate,
                'daily_rate'          => $dailyRate,
                'hourly_overage_rate' => $hourlyOverageRate,
                'flat_rate_period'    => $flatRatePeriod,
                'flat_rate'           => $flatRate,
                'time_unit'           => $timeUnit,
                'rental_limit'        => $rentalLimit,
                'membership_fee'      => $membershipFee,
                'shop_name'           => $shopName,
                'time_block_pricing'  => $timeBlockPricing,
            ] ),
            'type'      => 'json'
        ];
    }

}
