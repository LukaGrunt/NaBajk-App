# NaBajk Audit + TestFlight Plan

## Audit Findings

### PRIORITY 1 — XCODE ENVIRONMENT
- [x] ✅ `xcode-select -p` → `/Applications/Xcode.app/Contents/Developer` (correct)
- [x] ✅ Xcode 26.2, Build 17C52 installed correctly
- [x] ✅ iPhone 17 Pro simulator is Booted and ready
- [x] ✅ iOS native project exists (`ios/NaBajk.xcworkspace`)

### PRIORITY 2 — GOOGLE SIGN-IN (mostly good, one manual action)
- [x] ✅ AuthContext uses correct webClientId + iosClientId
- [x] ✅ Flow: `GoogleSignin.signIn()` → `idToken` → `signInWithIdToken()` — correct
- [x] ✅ All error codes handled (CANCELLED, IN_PROGRESS, PLAY_SERVICES_NOT_AVAILABLE, generic)
- [x] ✅ `iosUrlScheme` in app.json matches reversed iOS client ID
- [x] ✅ iOS Info.plist has all 3 URL schemes registered (nabajk, exp+nabajk, reversed Google client ID)
- [ ] ⚠️ MANUAL: Verify iOS client ID `968402921869-6g035oclj9ipjno4i77aqcoamqdrg1am` is listed in Supabase Dashboard → Authentication → Providers → Google → Authorized Client IDs
  - Confirmed via API: Google provider IS enabled in Supabase ✅
  - Cannot verify Authorized Client IDs list without service role key — must check in Dashboard

### PRIORITY 3 — EMAIL MAGIC LINK (two bugs found)
- [ ] 🐛 BUG #1: `handleDeepLink` only parses hash fragments (`#access_token=...`).
  Supabase v2 defaults to PKCE flow where the magic link returns `?code=...` query param.
  `handleDeepLink` returns early when there's no `#`, so PKCE magic links silently fail.
  **Fix:** Set `flowType: 'implicit'` in `lib/supabase.ts` auth config (matches current handleDeepLink logic)
- [ ] 🐛 BUG #2: No `app/auth/callback.tsx` route exists. When the app opens cold from a magic link,
  Expo Router tries to navigate to `/auth/callback` — shows the "This screen doesn't exist" 404 page.
  Even if auth session gets set, the user sees an error screen on cold start.
  **Fix:** Create a minimal `app/auth/callback.tsx` that shows a loading spinner.
- [x] ✅ `emailRedirectTo: 'nabajk://auth/callback'` set correctly
- [x] ✅ `nabajk` URL scheme registered in app.json and Info.plist

### PRIORITY 4 — MAPLIBRE STABILITY
- [x] ✅ RouteMap.tsx — clean, correct GeoJSON usage, `setAccessToken(null)` for free tiles
- [x] ✅ InteractiveRouteMap.tsx — clean, scroll/zoom enabled, same pattern
- [x] ✅ No lingering conflicts visible in code
- [x] ℹ️ `-lc++` duplicate library warnings are MapLibre's SPM side effect — harmless

### PRIORITY 5 — ANDROID (blocked, needs manual steps)
- [x] ✅ Android native project exists (`android/`)
- [x] ✅ AndroidManifest.xml has `nabajk` deep link scheme
- [ ] ⚠️ BLOCKER: No `google-services.json` in `android/app/` — required for Android Google Sign-In
- [ ] ⚠️ BLOCKER: SHA-1 fingerprint not registered in Google Cloud Console (needed for Android OAuth)
  - Debug SHA-1: need Java/keytool to extract from `android/app/debug.keystore` (Java not installed on this Mac)
- [ ] ⚠️ NOTE: `expo-auth-session` is still in package.json (unused, leftover from old OAuth approach) — low priority

### PRIORITY 6 — TESTFLIGHT READINESS
- [x] ✅ Bundle ID: `com.nabajk.app`
- [x] ✅ Version: `1.0.0`, Build: `6`
- [x] ✅ eas.json has production profile (`autoIncrement: true`, channel: production)
- [x] ✅ Apple ID + Team ID set in eas.json submit config
- [ ] ⚠️ EAS Build free quota exhausted — must use local Xcode Archive
- [ ] ⚠️ MANUAL: Also need `lib/supabase.ts` stale TODO comments removed (cosmetic)

---

## Fix Plan (ordered by priority)

### Code Fixes (do now, small effort)

- [x] **FIX 1**: `lib/supabase.ts` — Add `flowType: 'implicit'` to auth config
  - Effort: 1 line change
  - Why: Matches current handleDeepLink which reads hash fragments; Supabase v2 defaults to PKCE

- [x] **FIX 2**: Create `app/auth/callback.tsx` — minimal loading screen
  - Effort: ~15 lines
  - Why: Without this, cold-start from magic link shows "This screen doesn't exist" error
  - Also added `auth/callback` to Stack in `app/_layout.tsx`

- [x] **FIX 3**: `lib/supabase.ts` — Remove stale TODO comments + add flowType
  - Done as part of FIX 1

### Manual Actions (user must do)

- [ ] **MANUAL A**: Supabase Dashboard → Authentication → Providers → Google → Add iOS client ID
  `968402921869-6g035oclj9ipjno4i77aqcoamqdrg1am` to Authorized Client IDs

- [ ] **MANUAL B**: For TestFlight — Archive build in Xcode:
  1. Open `ios/NaBajk.xcworkspace` in Xcode
  2. Set scheme target to "Any iOS Device (arm64)"
  3. Product → Archive
  4. Distribute App → App Store Connect → Upload

- [ ] **MANUAL C** (Android only):
  - Install Java, get SHA-1 from debug keystore
  - Add SHA-1 to Google Cloud Console → OAuth client (Android type)
  - Download `google-services.json` → place in `android/app/`
  - Re-run `npx expo prebuild` to pick it up

---

## Review

(to be filled after changes are made)
