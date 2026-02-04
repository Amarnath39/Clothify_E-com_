# POS System Testing Guide

## 🧪 Quick Setup

### 1. Enable POS Feature

Add to your `.env.local` file:

```bash
NEXT_PUBLIC_ENABLE_POS=true
```

### 2. Restart Server

```bash
npm run dev
```

### 3. Verify Installation

1. Login as Admin
2. Check sidebar for **POS** menu item (💵 icon)
3. Click POS → Modal should open with invoice number

---

## ✅ Test Scenarios

### Test 1: Basic POS Order Flow

**Steps:**
1. Click **POS** in sidebar
2. Enter product SKU or name in search
3. Select product size
4. Enter customer phone: `9876543210`
5. Select payment method: **Cash**
6. Click **Checkout**
7. Verify success message
8. Click **Print Invoice**

**Expected Result:**
- ✅ Order created with POS type
- ✅ Stock reduced for selected product/size
- ✅ Invoice printed with correct details
- ✅ Order visible in `/admin/get-orders`

---

### Test 2: Barcode Scanning

**Steps:**
1. Open POS modal
2. Focus search input (auto-focused)
3. Scan product barcode with scanner
   - *Or manually type SKU and press Enter*
4. If single size: Product auto-added
5. If multiple sizes: Select size

**Expected Result:**
- ✅ Product instantly added to cart
- ✅ Quantity defaults to 1
- ✅ Search field clears after add

---

### Test 3: Out of Stock Handling

**Steps:**
1. Add product to cart with quantity > available stock
2. Try to checkout

**Expected Result:**
- ✅ Toast error: "Only X items available"
- ✅ Cannot add more than available stock
- ✅ Checkout blocked if any item out of stock

---

### Test 4: Stock Reduction Verification

**Before:**
- Note current stock of a product (e.g., 10 units)

**Steps:**
1. Create POS order with 3 units
2. Complete checkout successfully

**After:**
- Check product stock in inventory
- Verify stock history in database

**Expected Result:**
- ✅ Stock reduced to 7 units
- ✅ `StockHistory` entry created with action: "POS"
- ✅ Order has `stockUpdated: true`

---

### Test 5: Validation Checks

**Phone Number Validation:**
- Try: Empty phone → Error
- Try: 9 digits → Error
- Try: 11 digits → Error
- Try: 10 digits → Success

**Payment Method Validation:**
- Try: No payment method selected → Error
- Select Cash/UPI/Card → Success

**Cart Validation:**
- Try: Empty cart checkout → Error
- Add product → Success

---

### Test 6: Invoice Generation

**Steps:**
1. Complete a POS order
2. Note invoice number (e.g., `POS-20260204-0001`)
3. Create another order on same day
4. Verify invoice number increments to `POS-20260204-0002`

**Expected Result:**
- ✅ Unique invoice numbers
- ✅ Daily sequence increments
- ✅ Format: `POS-YYYYMMDD-####`

---

### Test 7: Feature Flag Control

**Steps:**
1. Set `NEXT_PUBLIC_ENABLE_POS=false` in `.env.local`
2. Restart server
3. Check admin sidebar

**Expected Result:**
- ✅ POS menu item NOT visible
- ✅ No breaking errors
- ✅ Other menu items work normally

**Restore:**
```bash
NEXT_PUBLIC_ENABLE_POS=true
```

---

### Test 8: Order Record Verification

**Steps:**
1. Create POS order
2. Navigate to `/admin/get-orders`
3. Find the POS order

**Expected Result:**
- ✅ Order visible in list
- ✅ Order type shows "POS"
- ✅ Payment status: "PAYMENT_SUCCESS"
- ✅ Current status: "COMPLETED"
- ✅ Customer phone visible
- ✅ Payment method saved

---

### Test 9: Multi-Product Cart

**Steps:**
1. Add 3 different products to cart
2. Adjust quantities
3. Remove one product
4. Checkout

**Expected Result:**
- ✅ All products correctly priced
- ✅ Total calculated accurately
- ✅ Stock reduced for each product
- ✅ Removed item NOT in final order

---

### Test 10: Concurrent POS Sessions

**Steps:**
1. Open POS in Browser A
2. Open POS in Browser B (different admin)
3. Create orders simultaneously

**Expected Result:**
- ✅ Unique invoice numbers for each
- ✅ No stock conflicts
- ✅ Both orders successfully created
- ✅ Stock correctly reduced

---

## 🔍 Database Verification Queries

### Check POS Orders

```javascript
// MongoDB
db.orders.find({ order_type: "POS" }).sort({ createdAt: -1 })
```

### Check Stock History

```javascript
// MongoDB
db.stockhistories.find({ action: "POS" }).sort({ createdAt: -1 })
```

### Verify Stock Reduction

```javascript
// MongoDB
db.products.aggregate([
  { $unwind: "$sizes" },
  { $project: { name: 1, "sizes.size": 1, "sizes.stock": 1 } }
])
```

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot find module '@/components/ui/dialog'"

**Solution:**
```bash
# Install shadcn/ui dialog component
npx shadcn-ui@latest add dialog
```

---

### Issue: "x-admin-id is null"

**Solution:**
Ensure admin ID is stored in localStorage after login:
```javascript
localStorage.setItem("adminId", adminData._id)
```

---

### Issue: Stock not reducing

**Solution:**
1. Check console for errors
2. Verify `StockHistory` model exists
3. Check MongoDB connection
4. Verify product has `sizes` array with stock

---

### Issue: Print window blocked

**Solution:**
Allow popups in browser settings for your domain.

---

## 📊 Performance Testing

### Load Test

**Steps:**
1. Create 10 POS orders rapidly
2. Monitor response times
3. Check for race conditions

**Expected:**
- ✅ Each order < 500ms
- ✅ No duplicate invoice numbers
- ✅ Correct stock deductions

---

## ✅ Pre-Production Checklist

Before deploying to production:

- [ ] All 10 test scenarios pass
- [ ] Stock reduction verified in database
- [ ] Invoice printing works on target printer
- [ ] Feature flag can disable POS
- [ ] No console errors
- [ ] API response times < 500ms
- [ ] Stock history audit trail working
- [ ] Admin permissions verified
- [ ] Mobile/tablet responsive
- [ ] Barcode scanner tested (if using)

---

## 🚀 Production Deployment Steps

1. **Backup Database**
   ```bash
   mongodump --uri="your_production_uri"
   ```

2. **Set Environment Variable**
   ```bash
   # In production .env
   NEXT_PUBLIC_ENABLE_POS=true
   ```

3. **Deploy Code**
   ```bash
   git add .
   git commit -m "feat: POS system implementation"
   git push origin main
   ```

4. **Verify Deployment**
   - Login to production admin panel
   - Check POS menu visibility
   - Test with 1 real product
   - Verify stock update

5. **Monitor Initial Orders**
   - Check first 5-10 POS orders
   - Verify stock reductions
   - Check invoice generation
   - Monitor for errors

---

## 📞 Emergency Rollback

If issues occur in production:

1. **Disable Feature Flag**
   ```bash
   NEXT_PUBLIC_ENABLE_POS=false
   ```

2. **Redeploy**
   ```bash
   # Trigger production rebuild
   ```

3. **Verify POS Hidden**
   - Check admin sidebar
   - POS should not be visible
   - Other features unaffected

4. **Investigate Issues**
   - Review server logs
   - Check database for POS orders
   - Verify stock consistency

---

## 🎓 Training Checklist for Staff

- [ ] How to open POS modal
- [ ] How to search products (SKU/Barcode/Name)
- [ ] How to add products to cart
- [ ] How to adjust quantities
- [ ] How to enter customer phone
- [ ] How to select payment method
- [ ] How to complete checkout
- [ ] How to print invoice
- [ ] How to start new order
- [ ] What to do if out of stock
- [ ] How to handle errors

---

## 🔒 Security Verification

### Admin Access Control

**Test:**
1. Login as non-admin user
2. Try to access `/api/admin/pos`

**Expected:**
- ✅ 401 Unauthorized response
- ✅ POS menu not visible

### Feature Flag Access

**Test:**
1. Disable POS feature flag
2. Try to call API directly

**Expected:**
- ✅ API still validates admin access
- ✅ UI respects feature flag

---

## 📈 Success Metrics

After 1 week in production, verify:

- [ ] X POS orders created successfully
- [ ] 0% stock inconsistencies
- [ ] < 1% order failures
- [ ] Average checkout time < 30 seconds
- [ ] 100% invoice generation success
- [ ] 0 critical errors logged

---

**POS System is ready for production deployment!** 🎉
