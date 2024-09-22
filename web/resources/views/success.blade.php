<!-- resources/views/success.blade.php -->

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authentication Successful</title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Roboto', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f4f6f8;
        }
        .container {
            text-align: center;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        h1 {
            font-size: 2em;
            margin-bottom: 0.5em;
            color: #3c3c3c;
        }
        p {
            font-size: 1.2em;
            margin-bottom: 1em;
            color: #5c5c5c;
        }
    </style>
</head>
<body>
<div class="container">
    <h1>Authentication Successful</h1>
    <p>You have successfully authenticated with Facebook.</p>
    <p>Please return to the Shopify admin area and reload the app to continue.</p>
</div>
</body>
</html>
