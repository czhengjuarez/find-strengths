#!/bin/bash

# Development Environment Setup Script
# This script helps developers set up their local environment securely

echo "🚀 Setting up Find Your Strengths development environment..."

# Check if .dev.vars exists
if [ -f ".dev.vars" ]; then
    echo "⚠️  .dev.vars already exists. Backing up to .dev.vars.backup"
    cp .dev.vars .dev.vars.backup
fi

# Create .dev.vars template
cat > .dev.vars << EOF
# Development Environment Variables
# Replace these values with your actual development credentials

# Google OAuth Credentials (Development)
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# JWT Secret (Development Only)
JWT_SECRET=dev-jwt-secret-$(openssl rand -hex 32)

# Vite Environment Variables
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
EOF

echo "✅ Created .dev.vars template"
echo ""
echo "📝 Next steps:"
echo "1. Edit .dev.vars with your actual development credentials"
echo "2. Get Google OAuth credentials from: https://console.cloud.google.com"
echo "3. Configure OAuth redirect URI: http://localhost:3000/auth/google/callback"
echo "4. Run 'npm run dev' to start development server"
echo ""
echo "🔒 Security reminder: .dev.vars is gitignored and should never be committed"
