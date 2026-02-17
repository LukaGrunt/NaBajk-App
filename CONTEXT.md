# NaBajk App - Session Context

## What We've Done

### 1. MapLibre Integration (Completed)
- Replaced the old map solution with MapLibre React Native + OpenFreeMap (free, MIT licensed)
- Updated `components/RouteMap.tsx` and `components/InteractiveRouteMap.tsx`
- Added GPS error handling to `lib/rideRecorder.ts`
- Added `@maplibre/maplibre-react-native` to plugins in `app.json`

### 2. Native Build Setup (Completed)
- MapLibre requires native builds (no Expo Go)
- EAS Build free quota was exhausted, so we switched to local Xcode builds
- Installed Xcode, set up iOS 26.2 simulator
- Fixed multiple missing native modules:
  - Added `expo-secure-store` to package.json and app.json plugins
  - Added `expo-sqlite` to package.json and app.json plugins
- Fixed MapLibre SPM (Swift Package Manager) resolution issue by:
  - Clearing all Xcode caches and DerivedData
  - Deleting `Package.resolved` and re-resolving via `xcodebuild -resolvePackageDependencies`
  - Building from command line with `xcodebuild` instead of Xcode GUI

### 3. Google Sign-In - Switched to Native SDK (Completed)
- **Old approach**: `expo-web-browser` opening Safari for OAuth → failed because URL scheme redirects weren't working
- **New approach**: `@react-native-google-signin/google-signin` native SDK → signs in natively, then uses `supabase.auth.signInWithIdToken()` with the Google ID token
- Installed `@react-native-google-signin/google-signin` package
- Rewrote `contexts/AuthContext.tsx` to use native Google Sign-In

### 4. Google Sign-In - Fixed iOS Client ID (Completed)
- **Problem**: Using the same Web OAuth client ID for both `webClientId` and `iosClientId`
- **Error**: "Custom scheme URIs are not allowed for 'WEB' client type. Error 400: invalid_request"
- **Root cause**: The native Google Sign-In SDK on iOS uses a custom URL scheme callback, which Google only allows for iOS-type OAuth clients, not Web-type
- **Fix**: Created a separate iOS OAuth client ID in Google Cloud Console:
  - Web client ID (unchanged): `968402921869-0sot9ovufftpjqb9orjvsfnn8vnvspd2.apps.googleusercontent.com`
  - New iOS client ID: `968402921869-6g035oclj9ipjno4i77aqcoamqdrg1am.apps.googleusercontent.com`
- Updated `contexts/AuthContext.tsx` with both client IDs
- Updated `app.json` plugin config with `iosUrlScheme` matching the iOS client's reversed ID

### 5. Other Fixes
- **Skip (Dev) button**: Fixed to navigate to `/(tabs)` instead of `/welcome` onboarding screen
- **Xcode 2317 warnings**: Confirmed these are normal nullability warnings from React Native/Expo pods — harmless

## Current State

- App builds and runs successfully on iOS simulator (iPhone 17 Pro)
- Auth welcome screen loads correctly with Google and Email buttons
- Google Sign-In opens the Google sign-in sheet (no more "WEB client type" error)
- Email sign-in sends magic link emails successfully
- Skip (Dev) button navigates directly to main app tabs

## Files Modified (from original)

| File | Changes |
|------|---------|
| `app.json` | Added plugins: expo-secure-store, expo-sqlite, @maplibre/maplibre-react-native, @react-native-google-signin/google-signin (with iosUrlScheme) |
| `contexts/AuthContext.tsx` | Rewrote to use native Google Sign-In SDK with separate web + iOS client IDs |
| `app/auth-welcome.tsx` | Fixed Skip (Dev) button to go to /(tabs) |
| `components/RouteMap.tsx` | Replaced with MapLibre implementation |
| `components/InteractiveRouteMap.tsx` | Replaced with MapLibre implementation |
| `lib/rideRecorder.ts` | Added GPS error handling |
| `package.json` | Added @maplibre/maplibre-react-native, @react-native-google-signin/google-signin, expo-secure-store, expo-sqlite |

## Next Steps

1. **Supabase check**: Verify the new iOS client ID (`968402921869-6g035oclj9ipjno4i77aqcoamqdrg1am`) is in the authorized client IDs list in Supabase Dashboard → Authentication → Providers → Google
2. **Test Google Sign-In end-to-end**: Verify sign-in completes and user lands on main app
3. **Test on real device**: Connect iPhone via USB, build from Xcode to real device for proper testing (Google account, email links, etc.)
4. **Test Email Sign-In**: On real device, magic link should open the app via `nabajk://auth/callback` URL scheme

## Build Commands Reference

```bash
# Prebuild (regenerate native projects)
npx expo prebuild --clean

# Resolve SPM packages
cd ios && xcodebuild -resolvePackageDependencies -workspace NaBajk.xcworkspace -scheme NaBajk

# Build for simulator
xcodebuild -workspace NaBajk.xcworkspace -scheme NaBajk -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 17 Pro' -derivedDataPath build_output build

# Install on simulator
xcrun simctl install "iPhone 17 Pro" ios/build_output/Build/Products/Debug-iphonesimulator/NaBajk.app

# Launch on simulator
xcrun simctl launch "iPhone 17 Pro" com.nabajk.app

# Start Metro bundler
npx expo start --dev-client
```
