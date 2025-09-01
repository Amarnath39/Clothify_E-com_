export const orderShippedTemplate = (order: any) =>`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 5px;
        }
        .header {
            background-color: #007bff;
            color: #ffffff;
            text-align: center;
            padding: 10px;
            border-radius: 5px 5px 0 0;
        }
        .content {
            padding: 20px;
            color: #333333;
            line-height: 1.6;
        }
        .content h1 {
            color: #007bff;
            font-size: 24px;
        }
        .footer {
            margin-top: 20px;
            padding: 10px;
            text-align: center;
            background-color: #f4f4f4;
            color: #777777;
            font-size: 12px;
            border-radius: 0 0 5px 5px;
        }
        a {
            color: #007bff;
            text-decoration: none;
        }
        .button {
            background-color: #007bff;
            color: #ffffff;
            padding: 10px 20px;
            text-align: center;
            border-radius: 5px;
            text-decoration: none;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h2>Order Shipped</h2>
        </div>
        <div class="content">
            <h1>Hello ${order.userName},</h1>
            <p>We're happy to let you know that your order has been shipped!</p>
            <p><strong>Tracking ID:</strong>${order.trackingId}</p>
            <p>You can track your order on <strong>${order.deliveryPartner}</strong></p>
            <p>Thank you for shopping with us! If you have any questions, feel free to reach out to our support team.</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 ${order.companyName} | All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;