# POS System Architecture

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       ADMIN PANEL                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Admin Sidebar                            │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ ✅ Dashboard                                          │  │ │
│  │  │ ✅ All Orders                                         │  │ │
│  │  │ 💵 POS (Feature Flagged) ← Click to open modal       │  │ │
│  │  │ ✅ All Customers                                      │  │ │
│  │  │ ✅ Products                                           │  │ │
│  │  │ ✅ Inventory                                          │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    POS MODAL (Lazy Loaded)                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Invoice: POS-20260204-0001                                │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  🔍 Search: [Scan Barcode / SKU / Product Name]           │ │
│  │     ↓ Auto-focus on modal open                            │ │
│  │     ↓ Debounced search (300ms)                            │ │
│  │     ↓ Server-side product search                          │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │ Search Results:                                       │ │ │
│  │  │  📦 Product A - [Size: M] [Add]                       │ │ │
│  │  │  📦 Product B - [Size: L] [Add]                       │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  🛒 Cart (3 items)                                         │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │ [Product Image] Product A (M)                         │ │ │
│  │  │              ₹500 × 2  [−] 2 [+] [🗑️]                │ │ │
│  │  ├──────────────────────────────────────────────────────┤ │ │
│  │  │ [Product Image] Product B (L)                         │ │ │
│  │  │              ₹800 × 1  [−] 1 [+] [🗑️]                │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  📞 Customer Phone: [__________] (Mandatory)               │ │
│  │  💳 Payment Method: [Cash ▼] [UPI] [Card] (Mandatory)     │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  Subtotal:  ₹1,800                                         │ │
│  │  Discount:  −₹0                                            │ │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ │
│  │  TOTAL:     ₹1,800                                         │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  [        CHECKOUT - ₹1,800        ]                       │ │
│  │  [         Clear Cart              ]                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Click Checkout
┌─────────────────────────────────────────────────────────────────┐
│                    API PROCESSING FLOW                           │
│                                                                  │
│  Step 1: Validate Input                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ✓ Phone number (10 digits)                                 │ │
│  │ ✓ Payment method selected                                  │ │
│  │ ✓ Cart not empty                                           │ │
│  │ ✓ Admin ID in headers                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ▼                                   │
│  Step 2: Fetch Products & Validate Stock                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ FOR EACH product in cart:                                   │ │
│  │   ├─ Find product in database                              │ │
│  │   ├─ Find selected size                                    │ │
│  │   ├─ Check if stock >= quantity                            │ │
│  │   ├─ If insufficient → ABORT with error                    │ │
│  │   └─ Store for processing                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ▼                                   │
│  Step 3: Generate IDs                                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ✓ Invoice ID: POS-YYYYMMDD-NNNN (auto-increment)           │ │
│  │ ✓ Order ID: ON-001800 (sequential)                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ▼                                   │
│  Step 4: Create Order (stockUpdated: false)                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ {                                                           │ │
│  │   orderId: "ON-001800",                                     │ │
│  │   invoiceId: "POS-20260204-0001",                           │ │
│  │   order_type: "POS",                                        │ │
│  │   paymentStatus: "PAYMENT_SUCCESS",                         │ │
│  │   currentStatus: "COMPLETED",                               │ │
│  │   stockUpdated: false ← Will update after stock reduction  │ │
│  │ }                                                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ▼                                   │
│  Step 5: 🔥 ATOMIC STOCK REDUCTION (CRITICAL)                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ FOR EACH product:                                           │ │
│  │   ├─ Reduce stock: sizes[].stock -= quantity               │ │
│  │   ├─ Increase sell count: sizes[].sellCount += quantity    │ │
│  │   ├─ Create StockHistory record:                           │ │
│  │   │    {                                                    │ │
│  │   │      action: "SALE",                                    │ │
│  │   │      reason: "POS Order ON-001800",                     │ │
│  │   │      oldStock: 10,                                      │ │
│  │   │      newStock: 7,                                       │ │
│  │   │      changeAmount: -3                                   │ │
│  │   │    }                                                    │ │
│  │   └─ If ANY update fails → ROLLBACK order                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ▼                                   │
│               ┌──────────────┴──────────────┐                   │
│               ▼                             ▼                   │
│        ✅ SUCCESS                    ❌ FAILURE                  │
│  ┌──────────────────┐        ┌──────────────────────┐          │
│  │ Update order:    │        │ Delete order         │          │
│  │ stockUpdated=true│        │ Return error         │          │
│  │ Return success   │        │ Stock NOT reduced    │          │
│  └──────────────────┘        └──────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ Success Response
┌─────────────────────────────────────────────────────────────────┐
│                    SUCCESS SCREEN                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ✅ Order Completed                                         │ │
│  │                                                             │ │
│  │  Invoice Number                                             │ │
│  │  POS-20260204-0001                                          │ │
│  │                                                             │ │
│  │  Total Amount: ₹1,800                                       │ │
│  │  Payment Method: Cash                                       │ │
│  │  Customer Phone: 9876543210                                 │ │
│  │                                                             │ │
│  │  [🖨️  Print Invoice]  [➕ New Order]                        │ │
│  │  [               Close POS              ]                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema Changes

### Orders Collection (Modified)

```javascript
// BEFORE
{
  orderId: String,
  productDetails: Array,
  paymentStatus: String,
  currentStatus: String,
  stockUpdated: Boolean
  // ... existing fields
}

// AFTER (POS support added)
{
  orderId: String,
  productDetails: Array,
  paymentStatus: String,
  currentStatus: String,
  stockUpdated: Boolean,
  
  // ✅ NEW: POS-specific fields
  order_type: String,        // "normal" | "prebooking" | "POS"
  createdBy: ObjectId,       // Admin who created POS order
  metadata: {                // Additional POS data
    source: "POS",
    adminId: String,
    adminName: String
  }
}
```

### StockHistory Collection (Modified)

```javascript
// BEFORE
{
  action: ["SALE", "REFUND", "MANUAL_UPDATE", "CANCELLATION", "RESTOCK"]
}

// AFTER (POS support added)
{
  action: ["SALE", "REFUND", "MANUAL_UPDATE", "CANCELLATION", "RESTOCK", "POS"]
  // Note: POS orders use "SALE" action for consistency
}
```

---

## 🔄 Data Flow Diagram

```
┌─────────────┐
│   Admin     │
│   Panel     │
└──────┬──────┘
       │
       │ 1. Click POS
       ▼
┌─────────────────────┐
│   POSModal.tsx      │
│   (Lazy Loaded)     │
└──────┬──────────────┘
       │
       │ 2. Search Products
       ▼
┌─────────────────────────────────────┐
│ GET /api/admin/pos/products/search  │
│ - Validates admin ID                │
│ - Searches by SKU/Name              │
│ - Returns products with stock       │
└──────┬──────────────────────────────┘
       │
       │ 3. Add to cart (client-side)
       ▼
┌─────────────────────┐
│   Cart State        │
│   (React useState)  │
└──────┬──────────────┘
       │
       │ 4. Submit checkout
       ▼
┌─────────────────────────────────┐
│ POST /api/admin/pos             │
│ ├─ Validate input               │
│ ├─ Check stock availability     │
│ ├─ Generate invoice ID          │
│ ├─ Create order                 │
│ ├─ Reduce stock ATOMICALLY      │
│ └─ Return success/error         │
└──────┬──────────────────────────┘
       │
       │ 5. Success response
       ▼
┌─────────────────────┐
│   Success Screen    │
│   - Show invoice    │
│   - Print option    │
│   - New order       │
└─────────────────────┘
```

---

## 🔐 Security Flow

```
┌─────────────────┐
│  POS Request    │
└────────┬────────┘
         │
         ▼
    ┌────────────────────────┐
    │ Feature Flag Check     │
    │ NEXT_PUBLIC_ENABLE_POS │
    └────────┬───────────────┘
             │
             ▼ Enabled
    ┌────────────────────────┐
    │ Admin Role Check       │
    │ SuperAdmin or Admin?   │
    └────────┬───────────────┘
             │
             ▼ Authorized
    ┌────────────────────────┐
    │ API Request            │
    │ x-admin-id header      │
    └────────┬───────────────┘
             │
             ▼
    ┌────────────────────────┐
    │ Validate Admin ID      │
    │ Admin.findById()       │
    └────────┬───────────────┘
             │
             ▼ Valid
    ┌────────────────────────┐
    │ Process POS Order      │
    └────────────────────────┘
```

---

## 📊 Stock Reduction Flow (Critical)

```
START: POS Checkout Request
  │
  ▼
┌──────────────────────────────────┐
│ PHASE 1: VALIDATION              │
│ ─────────────────────────────── │
│ For each product in cart:        │
│   1. Fetch product from DB       │
│   2. Find size variant           │
│   3. Check: stock >= quantity?   │
│      ├─ YES → Continue           │
│      └─ NO  → ABORT (toast error)│
└──────────────┬───────────────────┘
               │
               ▼ All products validated
┌──────────────────────────────────┐
│ PHASE 2: ORDER CREATION          │
│ ─────────────────────────────── │
│ Create order record:             │
│   - order_type: "POS"            │
│   - paymentStatus: "SUCCESS"     │
│   - stockUpdated: false ⚠️       │
│ Save to database                 │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ PHASE 3: ATOMIC STOCK REDUCTION  │
│ ─────────────────────────────── │
│ For each product:                │
│   1. Update stock:               │
│      Product.findOneAndUpdate({  │
│        "sizes._id": sizeId       │
│      }, {                        │
│        $inc: {                   │
│          "sizes.$.stock": -qty,  │
│          "sizes.$.sellCount": qty│
│        }                         │
│      })                          │
│                                  │
│   2. Create StockHistory:        │
│      StockHistory.create({       │
│        action: "SALE",           │
│        orderId: orderId,         │
│        changeAmount: -qty        │
│      })                          │
│                                  │
│   3. If ANY fails → ROLLBACK     │
└──────────────┬───────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
   ✅ SUCCESS      ❌ FAILURE
┌──────────────┐ ┌─────────────────┐
│ Update order:│ │ Delete order:   │
│ stockUpdated:│ │ Order.delete()  │
│ true         │ │                 │
│              │ │ Return error    │
│ Return       │ │ message         │
│ success      │ └─────────────────┘
└──────────────┘
```

---

## 🎯 Component Hierarchy

```
AdminLayout (layout.tsx)
  │
  ├─ Sidebar Navigation
  │    ├─ Dashboard
  │    ├─ All Orders
  │    ├─ POS (onClick: setShowPOSModal(true))
  │    ├─ Customers
  │    └─ Products
  │
  ├─ Main Content Area
  │    └─ {children}
  │
  └─ Modals
       ├─ ConfirmationModal (Logout)
       │
       └─ <Suspense>
            └─ POSModal (Lazy Loaded)
                 │
                 ├─ SearchInput (ref: auto-focus)
                 │    ├─ Debounced search (300ms)
                 │    └─ API: /api/admin/pos/products/search
                 │
                 ├─ SearchResults
                 │    └─ ProductItem[]
                 │         ├─ Product image
                 │         ├─ Product name
                 │         └─ Size buttons (add to cart)
                 │
                 ├─ Cart
                 │    └─ CartItem[]
                 │         ├─ Product image
                 │         ├─ Quantity controls [−] N [+]
                 │         └─ Remove button [🗑️]
                 │
                 ├─ CustomerForm
                 │    ├─ Phone input (10 digits)
                 │    └─ Payment method select
                 │
                 ├─ TotalsSummary
                 │    ├─ Subtotal
                 │    ├─ Discount
                 │    └─ Total (bold)
                 │
                 └─ Actions
                      ├─ Checkout Button
                      └─ Clear Cart Button
```

---

## 🚀 API Architecture

```
/api/admin/pos/
  │
  ├─ POST /
  │   ├─ Headers: x-admin-id
  │   ├─ Body: {customerPhone, productDetails, paymentMethod}
  │   ├─ Returns: {success, order}
  │   └─ Functions:
  │        ├─ generatePOSInvoiceNumber()
  │        ├─ generatePOSOrderId()
  │        └─ reduceStockForPOS() ⚠️ CRITICAL
  │
  └─ /products/search/
       ├─ GET /
       ├─ Query: ?q=SKU123
       ├─ Headers: x-admin-id
       └─ Returns: {success, products[]}
```

---

## 🔄 State Management

```
POSModal Component State:

┌─────────────────────────────────────┐
│ Core State                          │
├─────────────────────────────────────┤
│ invoiceNumber: string               │
│ customerPhone: string               │
│ paymentMethod: "CASH"|"UPI"|"CARD"  │
│ cart: CartItem[]                    │
│ searchQuery: string                 │
│ searchResults: Product[]            │
│ isSearching: boolean                │
│ isProcessing: boolean               │
│ completedOrder: Order | null        │
└─────────────────────────────────────┘

State Transitions:

┌─────────┐  Open Modal   ┌──────────┐
│ Initial │ ────────────▶ │ Searching│
└─────────┘               └────┬─────┘
                               │
                               ▼ Add Product
                          ┌──────────┐
                          │ Building │
                          │   Cart   │
                          └────┬─────┘
                               │
                               ▼ Checkout
                          ┌──────────┐
                          │Processing│
                          └────┬─────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
              ┌──────────┐          ┌─────────┐
              │ Success  │          │  Error  │
              │ (Invoice)│          │(Retry)  │
              └──────────┘          └─────────┘
```

---

## 💾 Persistence Layer

```
MongoDB Collections:

┌─────────────┐
│   Product   │
│    (Read)   │
└──────┬──────┘
       │
       ├─ sizes[].stock (Read & Update -qty)
       ├─ sizes[].sellCount (Update +qty)
       └─ sellCount (Update +qty)

┌─────────────┐
│    Order    │
│  (Create)   │
└──────┬──────┘
       │
       ├─ order_type: "POS"
       ├─ stockUpdated: true
       └─ metadata: {...}

┌─────────────┐
│StockHistory │
│  (Create)   │
└──────┬──────┘
       │
       ├─ action: "SALE"
       ├─ changeAmount: -qty
       └─ reason: "POS Order..."

┌─────────────┐
│    Admin    │
│    (Read)   │
└──────┬──────┘
       │
       └─ Validation only
```

---

## 🎨 UI Component Tree

```
Dialog (Shadcn UI)
  │
  └─ DialogContent
       │
       ├─ DialogHeader
       │    └─ DialogTitle
       │         ├─ "🏪 Point of Sale (POS)"
       │         └─ Invoice Number
       │
       └─ Grid (3 columns)
            │
            ├─ Left Column (2/3 width)
            │    │
            │    ├─ Search Card
            │    │    ├─ Label + Icon (🔍)
            │    │    ├─ Input (auto-focus, barcode scan)
            │    │    └─ Results Dropdown
            │    │         └─ ProductItem[] (map)
            │    │
            │    └─ Cart Card
            │         ├─ Title (cart count)
            │         └─ CartItems[] (map)
            │              ├─ Image
            │              ├─ Details
            │              ├─ Quantity Controls
            │              └─ Remove Button
            │
            └─ Right Column (1/3 width)
                 │
                 ├─ Customer Info Card
                 │    ├─ Phone Input
                 │    └─ Payment Select
                 │
                 ├─ Totals Card
                 │    ├─ Subtotal
                 │    ├─ Discount
                 │    └─ Total (bold)
                 │
                 └─ Actions
                      ├─ Checkout Button (primary)
                      └─ Clear Cart Button (outline)
```

---

This architecture ensures:
- ✅ Atomic stock operations
- ✅ Zero impact on online checkout
- ✅ Complete audit trail
- ✅ Production-safe rollback
- ✅ Feature flag control
- ✅ Lazy loading (performance)
