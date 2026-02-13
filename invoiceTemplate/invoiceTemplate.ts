export const invoiceTemplate = (order: any, companyDetails: any) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .invoice-header {
            text-align: center;
            margin-bottom: 20px;
        }
        .invoice-header h1 {
            color: #2c3e50;
            margin: 0;
        }
        .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        .col {
            flex: 1;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        .total {
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 0.9em;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="invoice-header">
        <h1>Invoice</h1>
    </div>

    <div class="row">
        <div class="col">
            <strong>Invoice Number:</strong> ${order.invoiceId || "N/A"}<br>
            <strong>Date:</strong> ${order.createdAt
        ? new Date(order.createdAt).toLocaleDateString()
        : "N/A"
    }
        </div>
        <div class="col" style="text-align: right;">
            <strong>Payment Method:</strong> ${order.paymentMethod || "Not specified"
    }
        </div>
    </div>

    <div class="row">
        <div class="col">
            <strong>From:</strong><br>
            ${companyDetails.name || "Company Name"}<br>
            ${companyDetails.address || "Company Address"}
        </div>
        <div class="col" style="text-align: right;">
            <strong>To:</strong><br>
            ${order.user?.name || "Customer Name"}<br>
            ${order.user?.email || "Customer Email"}<br>
            ${order.shippingAddress?.address || "Address not available"}
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th>HSN</th>
                <th>Quantity</th>
                <th>Price (Rs.)</th>
                <th>Total (Rs.)</th>
            </tr>
        </thead>
        <tbody>
            ${(order.productDetails || [])
        .map(
            (item: any) => `
                <tr>
                    <td>${item.product?.name || "Product Name"}</td>
                    <td>
                        ${(() => {
                    const categories = item.product?.categories;
                    if (categories && Array.isArray(categories)) {
                        const catWithHsn = categories.find(
                            (c: any) => c.hsnCode
                        );
                        return catWithHsn ? catWithHsn.hsnCode : "-";
                    }
                    return "-";
                })()}
                    </td>
                    <td>${item.count || 0}</td>
                    <td>${(item.product?.offerPrice || 0).toFixed(2)}</td>
                    <td>${(
                    (item.count || 0) * (item.product?.offerPrice || 0)
                ).toFixed(2)}</td>
                </tr>
            `
        )
        .join("")}
            <tr class="total">
                <td colspan="4" style="text-align: right;">Total:</td>
                <td>${(order.payablePrice || 0).toFixed(2)}</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        Thank you for your business!
    </div>
</body>
</html>
`;
