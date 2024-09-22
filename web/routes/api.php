<?php
use App\Http\Controllers\RentalOrderController;
use App\Http\Controllers\ProductPricingSchemeController;
use App\Http\Controllers\PricingSchemesController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ShopifyChargeController;
use Shopify\Utils;
use Shopify\Webhooks\Registry;
use Shopify\Webhooks\Topics;
use Shopify\Clients\HttpHeaders;
use Shopify\Exception\InvalidWebhookException;
use Illuminate\Support\Facades\Log;
use Shopify\Context;

Route::get('/', function () {
    return "Hello API rental";
});

Route::post('/product_pricing_scheme/save', [ProductPricingSchemeController::class, 'save']);
Route::get('/product_pricing_scheme/fetch', [ProductPricingSchemeController::class, 'fetch']);
Route::post('/product_pricing_scheme/fetchList', [ProductPricingSchemeController::class, 'fetchList']);
Route::post('/product_pricing_scheme/delete', [ProductPricingSchemeController::class, 'delete']);

Route::post('/pricing_schemes/save', [PricingSchemesController::class, 'save']);
Route::get('/pricing_schemes/fetch', [PricingSchemesController::class, 'fetch']);
Route::post('/pricing_schemes/fetchList', [PricingSchemesController::class, 'fetchList']);
Route::post('/pricing_schemes/delete', [PricingSchemesController::class, 'delete']);
Route::get('/pricing_schemes/test', [PricingSchemesController::class, 'testCreateMetafield']);

Route::post('/rental_order/save', [RentalOrderController::class, 'save']);
Route::get('/rental_order/fetch', [RentalOrderController::class, 'fetch']);
Route::post('/rental_order/fetchList', [RentalOrderController::class, 'fetchList']);
Route::post('/rental_order/delete', [RentalOrderController::class, 'delete']);
Route::post('/create-draft-order', [RentalOrderController::class, 'createDraftOrder']);
Route::get('/get-order', [RentalOrderController::class, 'getRentalOrders']);
Route::post('/rental_order/fetchListCO', [RentalOrderController::class, 'getRentalOrders']);

Route::post('/product-info', [ProductPricingSchemeController::class, 'getProductPricingScheme']);

Route::post('/create-charge', [ShopifyChargeController::class, 'createRecurringCharge'])->name('createCharge');
Route::get('/billing/callback', [ShopifyChargeController::class, 'billingCallback'])->name('billingCallback');
Route::get('/recurring-charges/active', [ShopifyChargeController::class, 'getActiveRecurringCharges']);
Route::post('/plan/unsubscribe', [ShopifyChargeController::class, 'unsubscribe']);

Route::post('/webhooks', function (Request $request) {
    Log::info("handling webhook request");

    $topic = $request->header(HttpHeaders::X_SHOPIFY_TOPIC, '');
    $shop = $request->header(HttpHeaders::X_SHOPIFY_DOMAIN, '');
    $hmac = $request->header(HttpHeaders::X_SHOPIFY_HMAC, '');

    try {
        // Validate the HMAC directly within the route
        $rawBody = $request->getContent();
        $calculatedHmac = base64_encode(hash_hmac('sha256', $rawBody, Context::$API_SECRET_KEY, true));

        if ($hmac !== $calculatedHmac) {
            throw new InvalidWebhookException("Could not validate webhook HMAC");
        }

        // Process the webhook
        $response = Registry::process($request->header(), $rawBody);
        if (!$response->isSuccess()) {
            Log::error("Failed to process '$topic' webhook: {$response->getErrorMessage()}");
            return response()->json(['message' => "Failed to process '$topic' webhook"], 401);
        }

    } catch (InvalidWebhookException $e) {
        Log::error("Got invalid webhook request for topic '$topic': {$e->getMessage()}");
        return response()->json(['message' => "Got invalid webhook request for topic '$topic'"], 401);
    } catch (\Exception $e) {
        Log::error("Got an exception when handling '$topic' webhook: {$e->getMessage()}");
        return response()->json(['message' => "Got an exception when handling '$topic' webhook"], 401);
    }
});
