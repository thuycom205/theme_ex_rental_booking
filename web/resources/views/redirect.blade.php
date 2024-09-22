<!DOCTYPE html>
<html>
<head>
    <title>Redirecting...</title>
    <head>
        <meta name="shopify-api-key" content="{{ $shopify_api_key }}" />
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
    </head>
    <script type="text/javascript">
        document.addEventListener("DOMContentLoaded", function() {


            const appUrl = "{{ $redirectUrl }}";


            open(appUrl, '_top');
        });
    </script>
</head>
<body>
<p>Redirecting...</p>
</body>
</html>
