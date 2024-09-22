<?php
namespace App\Http\Controllers;

use App\Models\RecurringCharge;
use Illuminate\Http\Request;
use Shopify\Auth\Session as ShopifySession;
use Shopify\Clients\Rest as ShopifyRestClient;
use Shopify\Utils;
use App\Models\Session;
use Shopify\Clients\Graphql;
use Illuminate\Support\Facades\Log;

class ShopifyChargeController extends Controller
{
    public function createRecurringCharge(Request $request)
    {
        $shop = $request->input('shop');
        $shopUrl = $shop;

        $session = Session::where('shop', $shop)->first();

        if (!$session) {
            return response()->json(['error' => 'Session not found for ' . $shop], 400);
        }

        $accessToken = $session->access_token;

        // Initialize Shopify REST client
        $client = new ShopifyRestClient($shopUrl, $accessToken);

        $response = $client->post('recurring_application_charges', [
            'recurring_application_charge' => [
                'name' => '$9.90 Monthly Plan',
                'price' => 9.90,
                'return_url' => route('billingCallback'),
                'trial_days' => 7,
                'test' => true, // Set to false in production
            ],
        ]);

        $data = $response->getDecodedBody();

        if (isset($data['recurring_application_charge']['confirmation_url'])) {
            // Store the response data in the database
            RecurringCharge::create([
                'charge_id' => (string) $data['recurring_application_charge']['id'], // Cast to string
                'name' => $data['recurring_application_charge']['name'],
                'shop' => $shop,
                'price' => $data['recurring_application_charge']['price'],
                'status' => $data['recurring_application_charge']['status'],
                'created_at' => $data['recurring_application_charge']['created_at'],
                'updated_at' => $data['recurring_application_charge']['updated_at'],
                'activated_on' => $data['recurring_application_charge']['activated_on'],
                'cancelled_on' => $data['recurring_application_charge']['cancelled_on'],
                'trial_ends_on' => $data['recurring_application_charge']['trial_ends_on'],
                'api_client_id' => $data['recurring_application_charge']['api_client_id'],
                'confirmation_url' => $data['recurring_application_charge']['confirmation_url'],
            ]);

            return response()->json(['confirmation_url' => $data['recurring_application_charge']['confirmation_url']]);
        } else {
            Log::error('Unable to create charge: ' . json_encode($data));
            return response()->json(['error' => 'Unable to create charge.'], 200);

        }

    }

    public function billingCallback(Request $request)
    {
        // Handle the callback from Shopify after the merchant accepts/declines the charge

        $charge_id = $request->query('charge_id');
        $chargeModel = RecurringCharge::where('charge_id', $charge_id)->first();

        if ($chargeModel) {
            $chargeModel->update(['status' => 'active']);
            $shop = $chargeModel->shop;

            // Redirect back to the embedded app within Shopify
            $redirectUrl = "https://{$shop}/admin/apps/" . env('SHOPIFY_APP_HANDLER');
            return view('redirect', ['redirectUrl' => $redirectUrl, 'shop' => $shop, 'shopify_api_key' => env('SHOPIFY_API_KEY')]);
        }

        return response()->json(['error' => 'Charge not found.'], 400);
    }
    public function getActiveRecurringCharges(Request $request)
    {
        // Validate the request to ensure 'shop' is provided
        $request->validate([
            'shop' => 'required|string',
        ]);

        // Get the 'shop' from the request
        $shop = $request->input('shop');

        // Fetch records where 'shop' matches and 'status' is 'active'
        $activeCharges = RecurringCharge::where('shop', $shop)
                                        ->where('status', 'active')
                                        ->get();
        if ($activeCharges->isEmpty()) {
            return '';
            //return response()->json(['message' => 'No active charges found.'], 200);
        }

        // Return the active charges as a JSON response
        return response()->json($activeCharges);
    }

    public function unsubscribe(Request $request)
    {
        // Validate the request to ensure 'shop' is provided
        $request->validate([
            'shop' => 'required|string',
        ]);

        // Get the 'shop' from the request
        $shop = $request->input('shop');

        // Fetch the session associated with the shop
        $session = Session::where('shop', $shop)->first();

        if (!$session) {
            return response()->json(['error' => 'Session not found for ' . $shop], 400);
        }

        $accessToken = $session->access_token;

        // Find the active charge
        $activeCharge = RecurringCharge::where('shop', $shop)
                                       ->where('status', 'active')
                                       ->first();

        if (!$activeCharge) {
            return response()->json(['error' => 'No active subscription found for ' . $shop], 400);
        }

        try {
            // Cancel the charge via Shopify API
            $chargeId = $activeCharge->charge_id;
            $client = new Graphql($shop, $accessToken);
            $query = <<<QUERY
        mutation appSubscriptionCancel(\$id: ID!) {
            appSubscriptionCancel(id: \$id) {
                userErrors {
                    field
                    message
                }
                appSubscription {
                    id
                    status
                }
            }
        }
QUERY;

            $variables = [
                "id" => "gid://shopify/AppSubscription/" . $chargeId,
            ];

            $response = $client->query(["query" => $query, "variables" => $variables]);

            // Check if the cancellation was successful
            if ($response->getStatusCode() === 200) {
                // Update the local database to reflect the cancellation
                $activeCharge->update([
                    'status' => 'cancelled',
                    'cancelled_on' => now(),
                ]);

                return response()->json(['message' => 'Subscription cancelled successfully.', 'success' =>true], 200);
            } else {
                return response()->json(['error' => 'Failed to cancel subscription.'], 200);
            }
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to cancel subscription: ' . $e->getMessage()], 200);
        }
    }

}
