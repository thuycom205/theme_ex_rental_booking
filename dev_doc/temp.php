
<?php
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Exception;

public function createPage(Request $request)
{
    try {
        // Simplified validation: Allow anything for certain fields
        $validatedData = $request->validate([
            'page.shop_name' => 'nullable|string', // Shop name can be null or a string
            'page.body_html' => 'nullable|string', // body_html can be null or a string
            'page.title' => 'nullable|string',     // title can be null or a string
            'page.page_id' => 'nullable|integer',  // page_id can be null or an integer
            'page.style' => 'nullable',            // style can be null or any type
            'page.meta' => 'nullable',             // meta can be null or any type
            'page.jsonContent' => 'nullable'       // jsonContent can be null or any type
        ]);

        // Get Shopify credentials and shop domain
        $page = $validatedData['page'] ?? [];
        $shopDomain = $page['shop_name'] ?? ''; // Default to empty string if shop_name is not provided
        $body_html = $page['body_html'] ?? '';  // Default to empty if not provided
        $jsonContent = $page['jsonContent'] ?? '';  // No restrictions on type
        $style = $page['style'] ?? '';  // No restrictions on type
        $meta = $page['meta'] ?? '';  // No restrictions on type
        $pageTitle = $page['title'] ?? 'Untitled Page';
        $pageId = $page['page_id'] ?? 0;  // Default to 0 if page_id is not present

        $shopifyAccessToken = Util::getAccessTokenForFunnel($shopDomain);

        // Compose the body with HTML and CSS style
        $body = "<style>$style</style>$body_html";

        // Set up the API URL for Shopify
        $apiUrl = $pageId && $pageId > 0
            ? "https://$shopDomain/admin/api/2024-07/pages/$pageId.json"  // Update existing page
            : "https://$shopDomain/admin/api/2024-07/pages.json";  // Create new page

        // Set up the page payload for Shopify
        $pagePayload = $pageId && $pageId > 0 ? [
            'page' => [
                'body_html' => $body,
                'published' => true
            ]
        ] : [
            'page' => [
                'title' => $pageTitle,
                'body_html' => $body,
                'published' => true
            ]
        ];

        // Log the API request for debugging
        Log::info("Sending request to Shopify API: $apiUrl", ['payload' => $pagePayload]);

        // Send the request to Shopify API (POST for new, PUT for update)
        $response = $pageId && $pageId > 0
            ? Http::withHeaders([
                'Content-Type' => 'application/json',
                'X-Shopify-Access-Token' => $shopifyAccessToken
            ])->put($apiUrl, $pagePayload)
            : Http::withHeaders([
                'Content-Type' => 'application/json',
                'X-Shopify-Access-Token' => $shopifyAccessToken
            ])->post($apiUrl, $pagePayload);

        // Check if the request was successful
        if ($response->successful()) {
            $pageResponse = $response->json();
            $createdPageId = $pageResponse['page']['id'];

            // Log successful response
            Log::info("Page successfully created/updated on Shopify", ['page_id' => $createdPageId]);

            // Create or update the page metafield
            $this->createOrUpdatePageMetafieldForPage($createdPageId, $shopDomain, 'slv_page_builder', 'collection_handle', $meta);

            // Data for storing in the local database
            $data = [
                'page_title' => $pageResponse['page']['title'],
                'page_content' => $body_html,
                'page_handle' => $pageResponse['page']['handle'],
                'page_metafield' => json_encode($meta),
                'content' => json_encode($jsonContent),
                'styles' => json_encode($style)
            ];

            // Log before database operation
            Log::info("Storing page information in the database", ['data' => $data]);

            // Store or update the page record in the local database
            DB::table('funnel_page')->updateOrInsert(
                ['page_id' => $createdPageId, 'shop_name' => $shopDomain],
                $data
            );

            // Log success
            Log::info("Page record successfully stored/updated in the database", ['page_id' => $createdPageId]);

            // Return a successful response
            return response()->json([
                'message' => 'Page successfully created or updated',
                'data' => $pageResponse
            ]);
        } else {
            // Log the error response from Shopify
            Log::error("Error creating/updating page on Shopify", [
                'status' => $response->status(),
                'response' => $response->json()
            ]);

            // Return an error response
            return response()->json([
                'message' => 'Error creating or updating page',
                'error' => $response->json()
            ], $response->status());
        }
    } catch (Exception $e) {
        // Log any unhandled exceptions
        Log::error("An exception occurred while creating/updating page", [
            'exception' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);

        // Return an error response with the exception details
        return response()->json([
            'message' => 'An error occurred while processing the request',
            'error' => $e->getMessage()
        ], 500);
    }
}
