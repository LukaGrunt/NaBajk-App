#!/bin/bash

echo "📦 Installing NaBajk Auth Dependencies..."

# Check if we're in an Expo project
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from your project root."
    exit 1
fi

echo ""
echo "Installing required packages..."

npx expo install expo-av
npx expo install expo-blur
npx expo install expo-notifications
npx expo install @supabase/supabase-js
npx expo install react-native-url-polyfill

echo ""
echo "✅ All dependencies installed!"
echo ""
echo "Next steps:"
echo "1. Add your video file to: /assets/video/welcome-placeholder.mp4"
echo "2. Create .env file with Supabase credentials (when ready)"
echo "3. Run: npx expo start"
echo ""
echo "📖 See AUTH_IMPLEMENTATION.md for complete setup guide"
