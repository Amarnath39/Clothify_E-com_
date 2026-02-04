#!/bin/bash

# ========================================
# Production Server Rebuild Script
# POS System Deployment
# ========================================

echo "🚀 Starting POS System Deployment..."
echo ""

# Step 1: Navigate to project directory
echo "📁 Step 1: Navigating to project directory..."
cd /root/swya-ecom-stack || { echo "❌ Directory not found!"; exit 1; }
echo "✅ In directory: $(pwd)"
echo ""

# Step 2: Pull latest code
echo "📥 Step 2: Pulling latest code from GitHub..."
git pull origin main
if [ $? -eq 0 ]; then
    echo "✅ Code pulled successfully"
else
    echo "❌ Git pull failed!"
    exit 1
fi
echo ""

# Step 3: Stop and remove old container
echo "🛑 Step 3: Stopping old container..."
CONTAINER_NAME=$(docker ps --filter "ancestor=swaarasya-ecom" --format "{{.Names}}" | head -n 1)

if [ -z "$CONTAINER_NAME" ]; then
    echo "⚠️  No running container found (this is okay for first deployment)"
else
    echo "Found container: $CONTAINER_NAME"
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
    echo "✅ Old container removed"
fi
echo ""

# Step 4: Remove old image (optional but recommended)
echo "🗑️  Step 4: Removing old Docker image..."
docker rmi swaarasya-ecom 2>/dev/null && echo "✅ Old image removed" || echo "⚠️  No old image to remove"
echo ""

# Step 5: Build new Docker image
echo "🔨 Step 5: Building new Docker image with POS enabled..."
echo "This will take a few minutes..."
echo ""

docker build \
  --no-cache \
  --progress=plain \
  -t swaarasya-ecom . 2>&1 | tee build.log

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Docker image built successfully!"
    
    # Check if POS env was set during build
    if grep -q "NEXT_PUBLIC_ENABLE_POS=true" build.log; then
        echo "✅ POS feature flag detected in build"
    else
        echo "⚠️  POS feature flag might not be set properly"
    fi
else
    echo ""
    echo "❌ Docker build failed! Check build.log for details"
    exit 1
fi
echo ""

# Step 6: Start new container
echo "🚀 Step 6: Starting new container..."
docker run -d \
  --name swaarasya-app-$(date +%Y%m%d-%H%M%S) \
  -p 3000:3000 \
  --restart unless-stopped \
  swaarasya-ecom

if [ $? -eq 0 ]; then
    echo "✅ Container started successfully!"
else
    echo "❌ Failed to start container!"
    exit 1
fi
echo ""

# Step 7: Verify container is running
echo "🔍 Step 7: Verifying deployment..."
sleep 5
RUNNING_CONTAINER=$(docker ps --filter "ancestor=swaarasya-ecom" --format "{{.Names}}" | head -n 1)

if [ -z "$RUNNING_CONTAINER" ]; then
    echo "❌ Container is not running!"
    docker logs $(docker ps -a --filter "ancestor=swaarasya-ecom" --format "{{.Names}}" | head -n 1)
    exit 1
else
    echo "✅ Container is running: $RUNNING_CONTAINER"
fi
echo ""

# Step 8: Show container logs
echo "📋 Step 8: Container logs (last 20 lines)..."
docker logs --tail 20 $RUNNING_CONTAINER
echo ""

# Step 9: Final verification
echo "=========================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "🔍 Next Steps for Verification:"
echo "1. Visit: https://www.swaarasya.com/admin/debug-env"
echo "   → Should show: ✅ POS is ENABLED"
echo ""
echo "2. Login to admin panel as SuperAdmin"
echo "   → Email: swethasarin2@gmail.com"
echo ""
echo "3. Check sidebar for 💵 POS menu item"
echo ""
echo "4. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)"
echo ""
echo "=========================================="
echo "Running containers:"
docker ps --filter "ancestor=swaarasya-ecom"
echo "=========================================="
