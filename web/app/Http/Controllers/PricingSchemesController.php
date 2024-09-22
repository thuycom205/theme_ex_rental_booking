<?php

namespace App\Http\Controllers;
use App\Models\PricingSchemes;
use App\Models\Session;
use App\Traits\DynamicModelTrait;
use Illuminate\Http\Request;
use App\Lib\Utils\ShopifyMetafieldUtil;
use Shopify\Clients\Graphql;
use Shopify\Clients\HttpResponse;

class PricingSchemesController extends Controller {
    use DynamicModelTrait;

    public function __construct() {
        $relativePath = 'app/Http/schema/pricing_schemes.xml';

        $this->initializeDynamicModelTrait(PricingSchemes::class, base_path($relativePath));
        $this->model = PricingSchemes::class;
    }

    private const GET_METAFIELDS_QUERY = <<<'QUERY'
    query getProductMetafields($productId: ID!) {
      product(id: $productId) {
        id
        title
        metafields(first: 10) {
          edges {
            node {
              id
              namespace
              key
              value
            }
          }
        }
      }
    }
    QUERY;

    public static function getProductMetafields(Session $session, $productId) {
        $client = new Graphql($session->shop, $session->access_token);

        $response = $client->query([
            'query' => self::GET_METAFIELDS_QUERY,
            'variables' => [
                'productId' => "gid://shopify/Product/{$productId}"
            ]
        ]);

        $body = HttpResponse::fromResponse($response)->getDecodedBody();

        if ($response->getStatusCode() !== 200 || isset($body['errors'])) {
            throw new \Exception($response->getBody()->__toString());
        }

        return $body['data']['product']['metafields']['edges'];
    }

    private const UPDATE_METAFIELDS_MUTATION = <<<'QUERY'
    mutation updateProductMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
            metafields {
                id
                namespace
                key
                value
            }
            userErrors {
                field
                message
            }
        }
    }
    QUERY;

    public static function updateMetafields(Session $session, $productId, $metafieldData)
    {
        $client = new Graphql($session->shop, $session->access_token);

        $response = $client->query([
            'query' => self::UPDATE_METAFIELDS_MUTATION,
            'variables' => [
                'metafields' => [
                    [
                        'ownerId' => "gid://shopify/Product/{$productId}",
                        'namespace' => $metafieldData['namespace'],
                        'key' => $metafieldData['key'],
                        'value' => $metafieldData['value'],
                        'type' => $metafieldData['type']
                    ]
                ]
            ]
        ]);

        $body = HttpResponse::fromResponse($response)->getDecodedBody();

        if ($response->getStatusCode() !== 200 || isset($body['errors'])) {
            throw new \Exception($response->getBody()->__toString());
        }

        return $body;
    }

    public function save(Request $request) {
        $schemeObject = $this->dynamicSave($request);

        if (!$schemeObject) {
            return response()->json(['error' => 'Failed to save pricing scheme'], 500);
        }

        // Extract request data
        $schemeType = $request->input('scheme_type');
        $flatRatePeriod = $request->input('flat_rate_period');
        $timeUnit = $request->input('time_unit');
        $flatRate = (float) $request->input('flat_rate');
        $initialPeriod = (int) $request->input('initial_period');
        $initialRate = (float) $request->input('initial_rate');
        $subsequentRate = (float) $request->input('subsequent_rate');
        $dailyRate = (float) $request->input('daily_rate');
        $hourlyOverageRate = (float) $request->input('hourly_overage_rate');
        $rentalLimit = (int) $request->input('rental_limit');
        $membershipFee = (float) $request->input('membership_fee');
        $shopName = $request->input('shop_name');
        $products = $request->input('product_pricing_scheme');

        $message = 'Pricing scheme created successfully';
        if (is_array($products)) {
            foreach ( $products as $product ) {
                $productId = $product['product_id'];
                $metadata_fields = ShopifyMetafieldUtil::createRentalPricingMetafield(
                    $schemeObject->id,
                    $schemeType,
                    $flatRatePeriod,
                    $timeUnit,
                    $flatRate,
                    $initialPeriod,
                    $initialRate,
                    $subsequentRate,
                    $dailyRate,
                    $hourlyOverageRate,
                    $rentalLimit,
                    $membershipFee,
                    $shopName,
                    $productId
                );

                // Get session
                $session = Session::where('shop', $shopName)->first();

                // Update metafields
                try {
                    self::updateMetafields($session, $productId, $metadata_fields);
                    $message .= 'add product : ' . $productId . ' to the pricing scheme successfully';
                } catch (\Exception $e) {
                    $message .= 'Failed to add product : ' . $productId . ' to the pricing scheme';
                    continue;
                  //  return response()->json(['error' => $e->getMessage()], 500);
                }
            }
        }
        return response()->json(['message' => $message, 'data' => $schemeObject], 200);
    }

    public function fetch(Request $request) {
        $id = $request->input('id');
        $shopName = $request->input('shop_name');
        return $this->fetchDataByIdAndShopName($id, $shopName);
    }

    public function fetchList(Request $request) {
        return $this->fetchPagedList($request);
    }

    public function testCreateMetafield()
    {
       // $productId = 7981409468583;
        $productId = 7981408452775;

        try {
            $session = Session::where('shop', 'wapstoremuoihai.myshopify.com')->first();

            $metafields = self::getProductMetafields($session, $productId);

            return response()->json($metafields);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
