#!/bin/bash

# WhatsApp Clone Deployment Script

echo "🚀 Starting WhatsApp Clone deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    exit 1
fi

# Install all dependencies
echo "📦 Installing all dependencies..."
npm run install-all

# Check if MongoDB URI is set
if [ -z "$MONGODB_URI" ]; then
    echo "⚠️  Warning: MONGODB_URI environment variable is not set"
    echo "   Please set it before running the application"
fi

# Build the React application
echo "🏗️  Building React application..."
cd client
npm run build
cd ..

echo "✅ Build completed successfully!"
echo "🌐 Ready to deploy to Vercel"

# Optional: Run the payload processor if sample_payloads directory exists
if [ -d "sample_payloads" ]; then
    echo "📄 Processing sample webhook payloads..."
    npm run process-payloads
fi

echo "🎉 Deployment preparation completed!"
echo ""
echo "To deploy to Vercel:"
echo "1. Install Vercel CLI: npm i -g vercel"
echo "2. Login: vercel login"
echo "3. Deploy: vercel --prod"
echo "4. Set environment variables in Vercel dashboard"
