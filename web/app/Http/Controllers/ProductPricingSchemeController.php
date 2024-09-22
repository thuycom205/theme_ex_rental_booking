<?php

namespace App\Http\Controllers;
use App\Models\ProductPricingScheme;
use App\Traits\DynamicModelTrait;
use Illuminate\Http\Request;
use App\Models\PricingSchemes;
use Shopify\Clients\Graphql;

class ProductPricingSchemeController extends Controller {
    use DynamicModelTrait;

    public function __construct() {
        $relativePath = 'app/Http/schema/product_pricing_scheme.xml';

        $this->initializeDynamicModelTrait(ProductPricingScheme::class, base_path($relativePath));
        $this->model = ProductPricingScheme::class;
    }

    public function save(Request $request) {
        return $this->dynamicSave($request);
    }

    public function fetch(Request $request) {
        $id = $request->input('id');
        $shopName = $request->input('shop_name');
        return $this->fetchDataByIdAndShopName($id, $shopName);
    }

    public function fetchList(Request $request) {
        return $this->fetchPagedList($request);
    }
    public function getProductPricingScheme(Request $request)
    {
        // Validate the incoming request data
        $request->validate([
            'product_id' => 'required',
            'shop_name' => 'required',
        ]);

        // Retrieve the product_id and shop_name from the request
        $productId = $request->input('product_id');
        $shopName = $request->input('shop_name');

        // Find the product pricing scheme based on product_id and shop_name
        $productPricingScheme = ProductPricingScheme::where('product_id', $productId)
                                                    ->whereHas('pricingScheme', function($query) use ($shopName) {
                                                        $query->where('shop_name', $shopName);
                                                    })
                                                    ->with('pricingScheme')
                                                    ->first();

        // Check if the pricing scheme exists
        if (!$productPricingScheme) {
            return response()->json(['error' => 'Pricing scheme not found'], 404);
        }

        // Return the product pricing scheme data
        return response()->json($productPricingScheme);
    }

}
