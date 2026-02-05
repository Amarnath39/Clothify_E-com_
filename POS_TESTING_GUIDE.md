# POS Stock Deduction Testing Guide

## What Was Fixed

### Issues Identified:
1. **MongoDB Transaction Support**: Stock manager now gracefully falls back to non-transactional mode for standalone MongoDB instances
2. **Request Validation**: Added comprehensive validation with detailed error messages for POS orders
3. **Stock Update Logging**: Enhanced logging throughout the stock deduction process
4. **Error Messages**: Clearer, more specific error messages to identify issues quickly

### Changes Made:
1. **`src/lib/stockManager.ts`**:
   - Detects if MongoDB supports transactions
   - Falls back to non-transactional updates if needed
   - Detailed console logging at every step
   - Better error handling with full stack traces

2. **`src/app/api/admin/pos/route.ts`**:
   - Enhanced request validation with specific error messages
   - Validates each product detail field individually
   - Comprehensive logging before/after stock deduction
   - Clear indication of which validation step failed

## How to Test

### Setup:
1. Deploy the latest code to your server
2. Open browser dev tools (Console tab)
3. Open the POS interface in admin panel

### Test Case 1: Cash Payment (Immediate Stock Deduction)
1. **Add product to cart**
   - Search for a product
   - Select size and quantity
   - Verify it appears in cart

2. **Enter customer details**
   - Phone: 10-digit number
   - Payment Method: Cash

3. **Click Checkout**

4. **Expected Behavior**:
   - ✅ Order completes successfully
   - ✅ Toast shows "Order Completed Successfully!"
   - ✅ Success screen displays
   - ✅ Stock is reduced immediately

5. **Check Server Logs** (you should see):
   ```
   📦 POS Request Body: { action: "COMPLETE", customerPhone: "...", ... }
   ✅ Request validation passed
   💰 Processing immediate payment order...
   ✅ Order saved to database
   📦 Attempting stock deduction for items: [...]
   🔄 Starting stock update: SALE for X items
   ✅ Using transactional stock update OR ⚠️ Transactions not supported, using non-transactional mode
   📦 Stock Update: [Product Name] -> Old: X, New: Y, Change: -1
   ✅ History entry created
   ✅ Stock Transaction Committed OR ✅ Stock Updated (Non-Transactional)
   ✅ Stock deduction successful
   ```

### Test Case 2: UPI/Card Offline Payment
1. **Add product to cart**
2. **Select Payment Method**: UPI or Card
3. **Enter transaction details** (optional)
4. **Click Checkout**
5. **Expected**: Same as Test Case 1

### Test Case 3: Razorpay Payment Link
1. **Add product to cart**
2. **Select Payment Method**: Payment Link (Razorpay)
3. **Click Checkout**
4. **Expected**:
   - ✅ Payment link generated
   - ✅ Link displayed in UI
   - ✅ Order created with PENDING status
   - ⚠️ Stock is **NOT** deducted yet
   - ✅ After customer pays via link, webhook deducts stock

### Test Case 4: Insufficient Stock
1. **Find a product with low stock** (e.g., 1 item)
2. **Try to add 2 items to cart**
3. **Expected**:
   - ❌ Toast shows "Only 1 items available"
   - Order not created

### Test Case 5: Missing Fields
1. **Add product to cart**
2. **Leave phone number empty**
3. **Click Checkout**
4. **Expected**:
   - ❌ Toast shows "Valid 10-digit phone number required"

## Troubleshooting

### If you see "Stock deduction failed":

1. **Check server logs** for the exact error:
   ```
   ❌ Stock deduction failed: [error details]
   ```

2. **Common causes**:
   - **Insufficient stock**: Product doesn't have enough inventory
   - **Product not found**: Product ID invalid
   - **Size not found**: Size ID invalid
   - **Database connection**: MongoDB connection issues

3. **Logs to look for**:
   - `📦 POS Request Body` - Shows what was sent
   - `❌ Missing [field]` - Shows validation failures
   - `📦 Attempting stock deduction` - Shows items being processed
   - `❌ Stock update failed` - Shows stock manager errors

### If you see 400 error:

1. **Check browser console** - exact error message will be displayed
2. **Check server logs** - detailed validation errors logged
3. **Common issues**:
   - Missing customer phone
   - Empty cart
   - Invalid product/size ID
   - Missing payment method

## Expected Log Output (Successful Order)

```
📦 POS Request Body: {
  "action": "COMPLETE",
  "customerPhone": "9999999999",
  "productDetailsCount": 1,
  "paymentMethod": "CASH",
  "hasTransactionDetails": false
}
✅ Request validation passed
💰 Processing immediate payment order: {
  "orderId": "ON-001234",
  "paymentMethod": "CASH",
  "totalItems": 1
}
✅ Order saved to database
📦 Attempting stock deduction for items: [
  {
    "productId": "...",
    "sizeId": "...",
    "quantity": 1,
    "productName": "Test Product",
    "sizeLabel": "M"
  }
]
🔄 Starting stock update: SALE for 1 items
Processing item: .../...
📦 Stock Update: Test Product (M) -> Old: 5, New: 4, Change: -1
✅ History entry created for Test Product
✅ Stock Updated (Non-Transactional)
✅ Stock deduction successful
```

## Next Steps

1. **Deploy**: Push latest code to production/staging
2. **Test**: Follow test cases above
3. **Monitor**: Watch server logs during first few real orders
4. **Verify**: Check that stock is updating correctly in database

## File Reference

- **Stock Manager**: `src/lib/stockManager.ts` (handles stock updates)
- **POS API**: `src/app/api/admin/pos/route.ts` (order creation)
- **POS UI**: `src/components/admin/POSModal.tsx` (frontend interface)
- **Webhook**: `src/app/api/webhook/razorpay/route.ts` (payment link confirmations)
