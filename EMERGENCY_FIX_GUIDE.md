# 🚨 EMERGENCY FIX - Stock Deduction Issue

## What Changed

**CRITICAL FIX**: Completely removed MongoDB transactions from stock manager.

### Why?
MongoDB transactions require a **replica set**. Most production servers use **standalone** MongoDB, which doesn't support transactions. This was causing all stock updates to fail with 400 errors.

### The Solution
Rewrote `stockManager.ts` to use **simple, direct updates** that work on ANY MongoDB setup:
- ✅ Standalone MongoDB
- ✅ Replica Sets
- ✅ MongoDB Atlas
- ✅ Local/Remote/Cloud

## Deployment Steps

### 1️⃣ On Your Server - Pull Latest Code
```bash
cd /path/to/swya-ecom-stack
git pull origin main
npm install
npm run build
pm2 restart all  # or: npm run dev (if using dev mode)
```

### 2️⃣ Verify Environment Variables
**Visit**: `https://www.swaarasya.com/api/admin/pos/health`

**Expected Response**:
```json
{
  "overall": "✅ Healthy",
  "ready": true,
  "checks": {
    "mongodb": {
      "status": "✅ Connected"
    },
    "env": {
      "MONGO_URI": "✅ Set",
      "JWT_SECRET": "✅ Set",
      "RAZORPAY_KEY_ID": "✅ Set"
    }
  }
}
```

**If ANY variable shows "❌ Missing":**
```bash
# On your server, edit the env file:
nano .env.local  # or .env

# Make sure these are set:
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Restart after changes:
pm2 restart all
```

### 3️⃣ Test POS Order

1. **Open POS** (`/admin` → POS)
2. **Add product** to cart
3. **Enter phone**: 9999999999
4. **Select**: Cash
5. **Click**: Checkout

**Expected**: 
- ✅ "Order Completed Successfully!" toast
- ✅ Stock reduces immediately
- ✅ Order appears in POS Orders

### 4️⃣ Check Server Logs

**On Server**:
```bash
pm2 logs --lines 50
```

**You Should See**:
```
📦 POS Request Body: { action: "COMPLETE", ... }
✅ Request validation passed
💰 Processing immediate payment order
📦 Processing: productId=..., sizeId=..., quantity=1
✅ Found product: [Product Name]
✅ Found size: M, current stock: 5
📦 Stock Update: [Product] (M) -> Old: 5, New: 4, Change: -1
✅ Product saved: [Product Name]
✅ Stock Updated Successfully for: [Product Name]
```

## Troubleshooting

### Error: "Stock deduction failed"

**Check Logs** for the exact error. Common causes:

#### 1. Insufficient Stock
```
❌ Insufficient stock for Product (Size). Available: 0, Requested: 1
```
**Fix**: Product is out of stock. Add inventory.

#### 2. Product Not Found
```
❌ Product not found: [productId]
```
**Fix**: Product was deleted or database sync issue. Re-add product.

#### 3. Size Not Found
```
❌ Size not found for product: [Product Name]
```
**Fix**: Size was deleted. Check product has sizes defined.

#### 4. MongoDB Connection Failed
```
❌ Failed to save product: [error]
```
**Fix**: Check MongoDB connection. Run health check.

### Error: 400 Bad Request (Before Stock)

**Check Logs** for validation errors:

```
❌ Missing customer phone number
❌ Cart is empty
❌ Payment method is required
❌ Missing size for product at position X
```

**Fix**: These are frontend issues. Check form validation.

### Health Check Shows "❌ Unhealthy"

1. **MongoDB Not Connected**:
   ```bash
   # Check if MongoDB is running
   sudo systemctl status mongod
   
   # Restart MongoDB
   sudo systemctl restart mongod
   ```

2. **Environment Variables Missing**:
   ```bash
   # Check if .env.local exists
   ls -la .env.local
   
   # View env variables (CAREFUL - contains secrets!)
   cat .env.local | grep -E "MONGO_URI|JWT_SECRET|RAZORPAY"
   ```

3. **Wrong Directory**:
   ```bash
   # Make sure you're in the right folder
   pwd
   # Should show: /path/to/swya-ecom-stack
   ```

## Files Changed

1. **`src/lib/stockManager.ts`** - Removed ALL transactions
2. **`src/app/api/admin/pos/health/route.ts`** - NEW health check endpoint
3. **`deploy-stock-fix.sh`** - Deployment script

## What the Fix Does

### Before (BROKEN):
```typescript
const session = await mongoose.startSession();
session.startTransaction();  // ❌ FAILS on standalone MongoDB
// ... stock updates
await session.commitTransaction();
```

### After (WORKING):
```typescript
// Direct updates, no session, no transaction
const product = await Product.findById(id);
product.sizes[i].stock -= quantity;
product.markModified('sizes');
await product.save();  // ✅ WORKS on ANY MongoDB
```

## Verification Checklist

- [ ] Code pulled on server
- [ ] `npm run build` successful
- [ ] Server restarted
- [ ] Health check returns "✅ Healthy"
- [ ] All env variables show "✅ Set"
- [ ] POS order completes successfully
- [ ] Stock reduces in database
- [ ] Server logs show success messages

## Still Having Issues?

**Send me**:
1. Health check response: `https://www.swaarasya.com/api/admin/pos/health`
2. Server logs: Last 100 lines from `pm2 logs`
3. Error screenshot from browser console

**To get server logs**:
```bash
pm2 logs --lines 100 > pos-logs.txt
cat pos-logs.txt
```

Copy and paste the output.

---

## EMERGENCY ROLLBACK (If Needed)

If this fix causes other issues:

```bash
cd /path/to/swya-ecom-stack
git log --oneline -5  # Find previous commit
git reset --hard <previous-commit-hash>
git push -f origin main
pm2 restart all
```

**Then contact me immediately!**
