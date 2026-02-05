#!/bin/bash

# POS Stock Fix - Emergency Deployment Script

echo "🚀 POS Stock Fix - Emergency Deployment"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Commit and Push
echo "📦 Step 1: Committing changes..."
git add .
git commit -m "CRITICAL FIX: Remove all MongoDB transactions from stock manager - works on ANY MongoDB setup"
git push origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Git push failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Code pushed to main${NC}"
echo ""

# Step 2: Instructions for server deployment
echo "🖥️  Step 2: Deploy on your server"
echo "=================================="
echo ""
echo "Run these commands on your server:"
echo ""
echo -e "${YELLOW}cd /path/to/swya-ecom-stack${NC}"
echo -e "${YELLOW}git pull origin main${NC}"
echo -e "${YELLOW}npm install${NC}"
echo -e "${YELLOW}npm run build${NC}"
echo -e "${YELLOW}pm2 restart all  # or your restart command${NC}"
echo ""

# Step 3: Health Check
echo "🏥 Step 3: After deployment, check health"
echo "========================================="
echo ""
echo "Visit this URL in your browser:"
echo  -e "${GREEN}https://www.swaarasya.com/api/admin/pos/health${NC}"
echo ""
echo "You should see:"
echo "  ✅ mongodb: Connected"
echo "  ✅ MONGO_URI: Set"
echo "  ✅ JWT_SECRET: Set"
echo ""

# Step 4: Test POS
echo "🧪 Step 4: Test POS Order"
echo "========================="
echo ""
echo "1. Open POS in admin panel"
echo "2. Add a product to cart"
echo "3. Enter phone: 9999999999"
echo "4. Select payment: Cash"
echo "5. Click Checkout"
echo ""
echo "Expected: Order completes, stock reduces"
echo ""

# Step 5: Check Logs
echo "📋 Step 5: Monitor Logs"
echo "======================="
echo ""
echo "On your server, watch logs:"
echo -e "${YELLOW}pm2 logs --lines 100${NC}"
echo ""
echo "Look for:"
echo "  📦 POS Request Body"
echo "  ✅ Request validation passed"
echo "  📦 Stock Update: Product -> Old: X, New: Y"
echo "  ✅ Stock Updated Successfully"
echo ""

echo "=========================================="
echo -e "${GREEN}✅ Deployment script complete!${NC}"
echo ""
echo "IMPORTANT: The stock manager now works WITHOUT MongoDB transactions."
echo "This means it will work on:"
echo "  ✅ Standalone MongoDB"
echo "  ✅ Replica Sets"  
echo "  ✅ MongoDB Atlas"
echo "  ✅ Any MongoDB setup"
echo ""
echo "If you still get errors, run the health check and send me the output."
echo "=========================================="
