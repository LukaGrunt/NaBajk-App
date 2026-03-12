# Chat — Floating Button + Full-Screen Modal

## Tasks
- [x] Step 1: Rewrite `RideChatSection.tsx` — floating button with violent shake+pulse, full-screen WhatsApp-style modal, keyboard-safe input
- [x] Step 2: Update `GroupRideDetailScreen.tsx` — move chat outside ScrollView as absolute overlay

## Review
- `RideChatSection`: FAB is `position:absolute` bottom-right. Glow ring scales+fades. Button shakes ±18° with scale pop, repeating every ~2.2s. Modal is 92% screen height, slides up from bottom, `KeyboardAvoidingView` is the root so input lifts properly. Send on `returnKeyType="send"` works. Name prompt overlays the modal itself.
- `GroupRideDetailScreen`: removed `<RideChatSection>` from inside the ScrollView section, added it as a direct child of `SafeAreaView` so it floats above everything.

---

# Onboarding Walkthrough

## Tasks
- [x] Step 1: i18n — add 11 onboarding keys (sl + en)
- [x] Step 2: NEW `components/OnboardingOverlay.tsx` — 4-step modal with SVG arrows + glowing rings
- [x] Step 3: `app/(tabs)/_layout.tsx` — check onboarding flag on mount, render overlay

## Review
3 files changed. `OnboardingOverlay` is a self-contained Modal with fixed-position callout cards,
SVG dashed lines from callout anchor to target element, glowing green ring at target, step dots,
and skip/next/start buttons. Positions use `Dimensions.get('window')` fractions — no element
measuring needed. `setOnboardingDone(true)` is persisted to AsyncStorage on finish or skip.
The overlay is triggered once from `_layout.tsx` via `getOnboardingDone()` on mount.

---

# Climbs (Vzponi) Feature

## Tasks
- [x] Step 1: DB schema — add is_climb, avg_gradient, elevation_profile columns
- [x] Step 2: Route type — add isClimb, avgGradient, elevationProfile fields
- [x] Step 3: Repository — map new fields + add computeElevationProfileFromPoints utility
- [x] Step 4: i18n — add climb-related keys (both sl/en)
- [x] Step 5: GradientProfile component — SVG colour-coded gradient chart
- [x] Step 6: ClimbListItem component — climb row with mini chart
- [x] Step 7: climbs.tsx screen — list screen for vzponi category
- [x] Step 8: Home screen — add Vzponi banner card above time picks
- [x] Step 9: FloatingRideButton — add Vzpon card + confirmation modal
- [x] Step 10: recording.tsx — accept isClimb param, show VZPON badge
- [x] Step 11: ride-summary.tsx — compute elevation profile, pass to share sheet
- [x] Step 12: route/[id].tsx — gradient chart + navigate to start for climbs
- [x] Step 13: ShareCard.tsx — show gradient chart when isClimb
- [x] Step 14: StoryShareSheet.tsx — pass isClimb + elevationProfile through

## Review
All 14 steps implemented. Key changes:
- DB schema: 3 new columns (is_climb, avg_gradient, elevation_profile)
- Route type & repo: 3 new optional fields, computeElevationProfileFromPoints utility
- 7 new i18n keys in sl and en
- GradientProfile: SVG bars colour-coded green→lime→orange→dark orange→red
- ClimbListItem: row with mini chart + avg gradient badge
- /climbs screen: fetches vzponi routes, shows ClimbListItem list
- Home screen: full-width Vzponi banner card navigates to /climbs
- FAB menu: 2-row layout — Snemaj+Vzpon in row 1, Naloži GPX in row 2; confirmation modal for Vzpon
- Recording: VZPON badge shown when isClimb=true param; navigates to ride-summary?isClimb=true on stop
- Ride summary: computes elevation profile for climbs, shows mini GradientProfile preview
- Route detail: shows full GradientProfile + "Navigate to start" button for isClimb routes
- ShareCard: shows GradientProfile instead of route polyline for climbs
- StoryShareSheet: threads isClimb/elevationProfile/avgGradient props through to ShareCard

---

# NaBajk Full Code Audit Fix Plan

## Todo

- [x] 1a. `app/upload-route.tsx` + `repositories/routesRepo.ts` — Pass `region` to `submitRoute()`
- [x] 1b. `repositories/routesRepo.ts` — Fix `parseFloat(String(null))` → NaN
- [x] 2a. `components/InteractiveRouteMap.tsx` — Add `coordsProp` to `useMemo` dep array
- [x] 3a. `components/RegionalWeatherCard.tsx` — Store + clear AnimatedRain timeout IDs
- [x] 3b. `components/RandomRouteOverlay.tsx` — Store + clear 1880ms setTimeout ID
- [x] 3c. `components/record/FloatingRideButton.tsx` — Store + clear closeMenu setTimeout via useRef
- [x] 4a. `components/RouteCard.tsx` — Switch bare `Image` → `expo-image` with cachePolicy + transition
- [x] 5a. `app/(tabs)/settings.tsx` — Add "Moje vožnje" nav button
- [x] 6a. `app/saved-rides.tsx` — Add `.catch()` to listSavedRides chain
- [x] 6b. `app/auth-welcome.tsx` — Show Alert on Google sign-in failure
- [x] 6c. `components/share/StoryShareSheet.tsx` — Broaden error catch in share functions
- [x] 7a. `components/auth/VideoBackground.tsx` — Remove redundant gradient layer

## Review

All 12 bugs fixed across 11 files:

- **Data bugs (1a, 1b)**: Region is now submitted when uploading a GPX route. `distance_km: null` from Supabase no longer produces NaN — defaults to 0.
- **Map correctness (2a)**: `coordsProp` added to the `useMemo` dep array so the map redraws when raw coordinates change, not just when polyline changes.
- **Memory leaks (3a, 3b, 3c)**: All untracked `setTimeout` calls now store their IDs and are cancelled in cleanup functions, preventing state updates on unmounted components.
- **Image caching (4a)**: `RouteCard` now uses `expo-image` with `cachePolicy="memory-disk"` and a 200ms fade transition, matching `RouteListItem` behaviour.
- **Navigation (5a)**: "Moje vožnje" row added to Settings → Account section so users can always reach their saved rides.
- **Error handling (6a, 6b, 6c)**: `saved-rides` no longer hangs if AsyncStorage throws. Google sign-in shows an `Alert` on failure. Share sheet shows a generic alert for any non-cancel error.
- **Visual bug (7a)**: Removed the redundant second `LinearGradient` in `VideoBackground` that was wasting a GPU compositing layer.

---

# Upload Recorded Ride to Supabase Routes

## Todo

- [ ] Step 1: Add `uploadRecordedRide()` to `repositories/routesRepo.ts`
- [ ] Step 2: Update `app/ride-summary.tsx` — call upload after save (non-blocking)

---

# Instagram/Facebook Story Sharing (Strava-style)

## Todo

- [ ] Step 1: Install `react-native-view-shot` and `react-native-share`
- [ ] Step 2: Update `app.json` — add `instagram-stories` + `facebook-stories` to `LSApplicationQueriesSchemes`
- [ ] Step 3: Create `components/share/ShareCard.tsx` — styled hidden view (NaBajk brand + ride stats) with `collapsable={false}` ref
- [ ] Step 4: Update `components/share/StoryShareSheet.tsx` — accept ride stats props, capture ShareCard with `captureRef`, share via `Share.shareSingle`
- [ ] Step 5: Update `app/ride-summary.tsx` — pass `rideName`, `distanceKm`, `durationSeconds` to `StoryShareSheet`
- [ ] Step 6: Run `npx expo prebuild --clean` + pod install + rebuild on device

---

# Background Location Tracking

## Todo

- [x] Step 1: Install `expo-task-manager`
- [x] Step 2: Update `app.json` — add `expo-location` plugin with background config, remove duplicate `NSLocationWhenInUseUsageDescription`
- [x] Step 3: Update `lib/rideRecorder.ts` — swap to `startLocationUpdatesAsync`, define background task, remove AppState listener
- [x] Step 4: Update `app/recording.tsx` — request background permission after foreground
- [x] Step 5: Update `app/_layout.tsx` — import rideRecorder at startup
- [x] Step 6: Run `npx expo prebuild --clean` + `pod install`

## Review

### Changes Made

1. **`package.json`** — `expo-task-manager` added via `npx expo install`.

2. **`app.json`** — Replaced bare `NSLocationWhenInUseUsageDescription` infoPlist key with the `expo-location` plugin entry that enables `isIosBackgroundLocationEnabled` and `isAndroidBackgroundLocationEnabled`. Prebuild now injects `UIBackgroundModes → location` into Info.plist automatically (verified: ✅).

3. **`lib/rideRecorder.ts`** — Replaced `watchPositionAsync` + `AppState` listener with `startLocationUpdatesAsync` backed by a named `TaskManager` background task (`nabajk-background-location`). Task callback processes batched location arrays and updates singleton state. Removed `locationWatcher` and `appStateSubscription` vars. `stopRecording` now calls `Location.stopLocationUpdatesAsync`.

4. **`app/recording.tsx`** — `doPermCheck` now also requests `BackgroundPermissionsAsync` (result silently ignored so recording starts regardless). Foreground permission check restructured to handle all cases explicitly.

5. **`app/_layout.tsx`** — Added `import '@/lib/rideRecorder'` at top so the background task is registered on cold background launch.

6. **Prebuild** — `npx expo prebuild --clean` regenerated native iOS/Android files. `UIBackgroundModes` now includes `location` ✅.

---

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

---

# Events Screen Redesign

## Todo

- [x] 1. Update `components/races/RaceRow.tsx` — grouped card style, day-of-week badge, remove external-link icon
- [x] 2. Update `app/(tabs)/tekme.tsx` — pass isFirst/isLast, add event count chip to section header

## Review

**`components/races/RaceRow.tsx`**
- Added `isFirst` / `isLast` props; card no longer has a fixed `borderRadius: 14`. Instead: `cardFirst` applies top radii only, `cardLast` applies bottom radii + 8px `marginBottom`, `cardDivider` (when NOT last) draws a `hairlineWidth` bottom border.
- Day badge expanded from 38×38 → 48×44. Now shows 3-letter weekday abbreviation (locale-aware via `Intl.DateTimeFormat`) above the day number. Both texts flip to `Colors.background` when `isToday`.
- Removed the `external-link` icon; right column now holds only the chevron.

**`app/(tabs)/tekme.tsx`**
- `renderItem` destructures `index` and `section` to compute `isFirst` / `isLast`.
- `renderSectionHeader` now renders as a row: title takes `flex: 1`, followed by a small count chip showing `section.data.length`.
- Two new styles added: `countChip` + `countText`.

---

# Record Ride Screen — Full UI/UX Redesign

## Todo

- [x] Update `FloatingRideButton.tsx` — call `startRecording()` in `handleRecord` before navigating
- [x] Update `app/recording.tsx` — full cockpit redesign:
  - [x] GPS Sonar Beacon (3 animated rings + center dot + status label)
  - [x] Large HH:MM:SS timer (88px tabular bold)
  - [x] Stats strip (distance + avg speed)
  - [x] Solid red stop button with breathing glow
  - [x] Custom top bar with back button (with confirmation alert)
  - [x] Auto-start when `phase === 'ready'` (remove idle Start button)
  - [x] headerShown: false (full screen cockpit)
- [x] Update `app/_layout.tsx` — set recording screen `headerShown: false`

## Review

**`components/record/FloatingRideButton.tsx`**
Added `startRecording` import and call it fire-and-forget in `handleRecord`. For repeat users (perms granted), recording begins immediately before the screen mounts so the cockpit is ready on arrival. The recording screen handles first-launch/permission recovery.

**`app/_layout.tsx`**
Changed `recording` Stack.Screen from `headerShown: true` → `headerShown: false`. The cockpit owns its own top bar.

**`app/recording.tsx`** — Full rewrite. Four cockpit zones:
1. **GPS Sonar Beacon**: 3 concentric rings expand + fade using `withRepeat(withSequence(...))` with 600ms stagger via `withDelay`. Center dot and status text use GPS color (green/orange/red/grey).
2. **Timer**: 80px bold tabular `HH:MM:SS` format, increments live from the recorder singleton.
3. **Stats Strip**: `surface1` card with distance (KM) and avg speed (KM/H). Speed shows `—` until 10s elapsed. Calculated inline from `distanceMeters / elapsedSeconds`.
4. **Stop Button**: Solid red, borderRadius 20, full-width. Glow shadow breathes 0.3↔0.5 via Reanimated. Tapping shows `Alert.alert` confirmation before stopping.

Auto-start logic: when `phase === 'ready'`, a `useEffect` calls `start()` if status is `idle`, or `reset()` if status is `error` (which sets it back to idle, re-triggering the effect to call `start()`). The idle "Start" button is removed entirely.

Back button shows the same confirmation alert as the stop button when recording is active.

---

# Rider-Level-Aware Cycling Time Calculator

## Todo

- [x] Create `utils/rideTimeCalculator.ts` — EFD formula + speed lookup
- [x] Create `contexts/RiderLevelContext.tsx` — reactive context mirroring LanguageContext
- [x] Update `app/_layout.tsx` — wrap with `<RiderLevelProvider>`
- [x] Update `components/RouteCard.tsx` — use `calculateRideMinutes` + `useRiderLevel`
- [x] Update `components/RouteListItem.tsx` — use `calculateRideMinutes` + `useRiderLevel`
- [x] Update `app/route/[id].tsx` — use `calculateRideMinutes` + `useRiderLevel`
- [x] Update `app/(tabs)/settings.tsx` — replace local state with context setter
- [x] Patch TEST route in DB — `duration_minutes = 162`

## Review

### Summary of changes

**`utils/rideTimeCalculator.ts`** (new)
Pure function that converts distance + elevation into ride minutes using the Equivalent Flat Distance formula. Speed per rider level: Beginner=22 km/h, Intermediate=26, Hardcore=31.

**`contexts/RiderLevelContext.tsx`** (new)
Reactive context that reads the rider level from AsyncStorage on mount and exposes a setter. When the user changes level in settings, all consumers re-render immediately without needing an app restart.

**`app/_layout.tsx`**
Added `<RiderLevelProvider>` wrapper alongside the existing LanguageProvider/FavouritesProvider etc.

**`components/RouteCard.tsx`, `components/RouteListItem.tsx`, `app/route/[id].tsx`**
All three now call `calculateRideMinutes(route.distanceKm, route.elevationM, riderLevel)` instead of reading the raw `route.durationMinutes` from the DB. Duration display is now always live-calculated and rider-level-aware.

**`app/(tabs)/settings.tsx`**
Removed the local `useState` / `useEffect` for rider level. Now reads from and writes to the shared context — the level change propagates to all route cards instantly.

**Supabase DB**
Patched TEST route `duration_minutes` from `null` → `162` (intermediate speed baseline). This keeps the time-filter chips working correctly.

### Verification
- TEST route at intermediate → **2h 42min** ✓
- Change to Beginner → **3h 11min** ✓
- Change to Hardcore → **2h 16min** ✓
- Detail screen matches list item ✓
- Level persists across hot reloads ✓

---

# Fix: Region Display — All Regions, All Over The App

## Root Cause
- `app/route/[id].tsx` line 166: region badge **hardcoded** to `t(language, 'gorenjska')` — every route shows "Gorenjska" regardless of actual data.
- `types/GroupRide.ts`: region type limited to only 3 regions (`gorenjska | dolenjska | stajerska`) — missing Primorska, Prekmurje, Osrednja Slovenija.
- `screens/GroupRidesScreen.tsx` + `screens/CreateGroupRideScreen.tsx`: REGIONS const also only lists 3.
- DB schema `supabase-setup/01-schema.sql`: `CHECK (region IN ('gorenjska', 'dolenjska', 'stajerska'))` blocks the other 3 regions from being saved.

## Todo

- [x] **Fix 1** — `app/route/[id].tsx`: Replace hardcoded `t(language, 'gorenjska')` with actual `route.region`. Hide badge if no region.
- [x] **Fix 2** — `types/GroupRide.ts`: Expand region union type to all 6 regions.
- [x] **Fix 3** — `screens/GroupRidesScreen.tsx`: Expand REGIONS to all 6, update `getRegionLabel`.
- [x] **Fix 4** — `screens/CreateGroupRideScreen.tsx`: Expand REGIONS to all 6, update `getRegionLabel` and type cast in `handleSubmit`.
- [x] **Fix 5** — `supabase-setup/01-schema.sql`: Update group_rides CHECK constraint to all 6 regions.

## Review

**`app/route/[id].tsx`** — Location badge now renders `route.region` directly (the DB already stores display-ready values like "Gorenjska"). Badge is hidden if the route has no region set.

**`types/GroupRide.ts`** — Region union expanded from 3 → 6: added `primorska | prekmurje | osrednjaSlovenija`.

**`screens/GroupRidesScreen.tsx`** — REGIONS const expanded to all 6. `getRegionLabel` replaced with a one-liner using the existing `t()` i18n function (all 6 region keys already exist in i18n.ts).

**`screens/CreateGroupRideScreen.tsx`** — Same REGIONS/getRegionLabel expansion. Type cast in `handleSubmit` updated from the inline 3-region union to `GroupRide['region']` so it stays in sync with the type automatically.

**`supabase-setup/01-schema.sql`** — CHECK constraint updated to include all 6 regions. Note: apply this to the live Supabase DB with: `ALTER TABLE group_rides DROP CONSTRAINT IF EXISTS group_rides_region_check; ALTER TABLE group_rides ADD CONSTRAINT group_rides_region_check CHECK (region IN ('gorenjska', 'dolenjska', 'stajerska', 'primorska', 'prekmurje', 'osrednjaSlovenija'));`

---

# Privacy Policy & Terms of Service

## Todo

- [x] 1. `utils/localSettings.ts` — Add `getTermsAccepted` / `setTermsAccepted`
- [x] 2. `constants/i18n.ts` — Add strings for acceptance screen, PP/ToS titles
- [x] 3. `app/privacy-policy.tsx` — New bilingual Privacy Policy screen
- [x] 4. `app/terms-of-service.tsx` — New bilingual Terms of Service screen
- [x] 5. `app/terms-acceptance.tsx` — New first-launch acceptance gate
- [x] 6. `app/index.tsx` — Check terms flag; redirect to acceptance if not accepted
- [x] 7. `app/(tabs)/settings.tsx` — Wire up onPress for both legal buttons
- [x] 8. `app/_layout.tsx` — Register three new Stack screens

## Review

**`utils/localSettings.ts`** — Added `TERMS_ACCEPTED` key and two helpers: `getTermsAccepted()` returns `true` when the stored value is `'true'`; `setTermsAccepted()` writes `'true'`. Same pattern as `getOnboardingDone`.

**`constants/i18n.ts`** — Added 6 strings to both `sl` and `en`: `privacyPolicyTitle`, `termsOfServiceTitle`, `termsAcceptanceTitle`, `termsCheckboxTerms`, `termsCheckboxPrivacy`, `termsContinue`.

**`app/privacy-policy.tsx`** (new) — Full Slovenian + English Privacy Policy rendered in a `ScrollView`. Uses `useLanguage()` to pick the correct content array. Sections: what we collect, how it's used, storage & security, user rights, contact.

**`app/terms-of-service.tsx`** (new) — Full Slovenian + English Terms of Service. Sections: acceptance, free service / no warranties, inherent risk, route accuracy disclaimer, traffic law compliance, group rides, liability limitation, user content, governing law (Slovenia).

**`app/terms-acceptance.tsx`** (new) — Acceptance gate with two checkboxes. Tapping the link text opens the respective screen; tapping the row (or checkbox area) toggles the check. Continue button is disabled (grey) until both are checked. On Continue: calls `setTermsAccepted()` then `router.replace('/(tabs)')`. No back button (`headerShown: false`).

**`app/index.tsx`** — Converted from `<Redirect>` to `useEffect`-based routing so we can `await getTermsAccepted()`. Signed-in users who haven't accepted terms are redirected to `/terms-acceptance`; others go to `/(tabs)`.

**`app/(tabs)/settings.tsx`** — Added `onPress` handlers to both legal buttons: Privacy Policy → `router.push('/privacy-policy')`, Terms of Service → `router.push('/terms-of-service')`.

**`app/_layout.tsx`** — Registered three new `Stack.Screen` entries: `terms-acceptance` (headerShown: false), `privacy-policy` (headerShown: true), `terms-of-service` (headerShown: true).

---

# Fix Elevation Gain Over-Reporting (DEM Correction)

## Todo

- [x] Create `lib/elevationCorrection.ts` with DEM correction function
- [x] Add `useEffect` in `app/ride-summary.tsx` to call DEM correction on mount
- [x] Update elevation display in `ride-summary.tsx` to use corrected points
- [x] Reduce MIN_DELTA to 1 in `repositories/routesRepo.ts`
- [ ] Test: verify corrected elevation is close to Garmin on a test ride

## Review

**Root cause**: Raw GPS altitude is ±10–30 m accurate. Even with 7-point smoothing and a 2 m delta threshold, noise accumulates over hundreds of points → massive over-reporting.

**`lib/elevationCorrection.ts`** (new) — Calls Open Topo Data SRTM 30 m API after ride ends. Downsamples points to ~1 per 50 m before sending (keeps 10 km ride to 1–2 API requests). Batches up to 100 pts/request. Linearly interpolates DEM elevations back onto every original point. Falls back to raw GPS on any error.

**`app/ride-summary.tsx`** — Added `useEffect` on mount that calls `correctElevations(points)` → stores in `correctedPoints`. All elevation calculations (`elevationM`, `elevationProfile`) use `correctedPoints ?? points`. A D+ stat cell with `ActivityIndicator` loading spinner shows in the stats card while the API call is in flight.

**`repositories/routesRepo.ts`** — `MIN_DELTA` reduced from 2 → 1. DEM data is noise-free so 1 m threshold is fine and avoids under-counting real small climbs.

---

# ShareCard Climb Redesign

## Todo

- [x] Step 1: `GradientProfile.tsx` — add `showBarLabels` prop; render % inside bars when true and showLabels=false
- [x] Step 2: `ShareCard.tsx` — add `elevationM` prop; climb branch shows elevation as primary stat, distance secondary, no duration; chart height 240, showBarLabels=true
- [x] Step 3: `StoryShareSheet.tsx` — add and forward `elevationM` prop
- [x] Step 4: `app/route/[id].tsx` — pass `elevationM={route.elevationM}` to StoryShareSheet
- [x] Step 5: `ClimbListItem.tsx` — pass `elevationM={route.elevationM}` to StoryShareSheet

## Review

5 files changed. Key changes:
- **GradientProfile**: new `showBarLabels` prop renders gradient % labels inside coloured bars without needing axis padding (complements existing `showLabels` prop).
- **ShareCard climb branch**: elevation (`747`) shown large in orange `#FF6B35` with "M VZPON" label; distance shown smaller in grey; duration hidden; chart taller (240px) with bar labels; avg gradient badge kept.
- **Regular route branch**: completely unchanged (KM + duration still shown).
- **StoryShareSheet → ShareCard**: `elevationM` threaded through.
- **Callers**: both `route/[id].tsx` and `ClimbListItem.tsx` now pass `elevationM` from the route object.

---

# Share Card Improvements (Round 2)

## Issues
1. **Instagram transparent = purple**: `stickerImage` without background colors → Instagram default purple. Fix: add `backgroundTopColor/BottomColor: Colors.background` to the stickerImage call.
2. **Facebook broken**: Inline code vs `shareToFacebookStories` from lib. Use the same function the group ride uses.
3. **Route line**: Add SVG polyline trace (brand green) to ShareCard using `react-native-svg`.
4. **Logo**: Replace `<Text>NaBajk</Text>` with `logo-navbar.png` image.

## Todo

- [ ] Fix 1 — `components/share/StoryShareSheet.tsx`: add background colors to transparent Instagram share + use `shareToFacebookStories` for Facebook
- [ ] Fix 2 — `components/share/ShareCard.tsx`: replace brand text with logo-navbar.png + add route SVG polyline
- [ ] Fix 3 — `components/share/StoryShareSheet.tsx`: accept + forward `points` prop to both ShareCards
- [ ] Fix 4 — `app/ride-summary.tsx`: pass `points={points}` to `<StoryShareSheet>`

---

# Recording Bug Fix + Description Fields + Story Share Sheet

## Todo

- [x] **FIX 1** — `app/recording.tsx`: Replace 3x `router.push` with `router.replace` + discard button navigates to `/(tabs)`
- [x] **FIX 2** — `components/record/FloatingRideButton.tsx`: Guard `handleRecord` when `status === 'stopped'` → redirect to ride-summary
- [x] **FIX 3** — `lib/rideStorage.ts`: Add 3 optional fields (`traffic?`, `roadCondition?`, `whyGood?`) to `SavedRide` interface
- [x] **FIX 4** — `components/share/StoryShareSheet.tsx`: NEW reusable modal with Instagram + Facebook cards and Preskoči button
- [x] **FIX 5** — `app/ride-summary.tsx`: Replace single "notes" field with 3 description fields + show StoryShareSheet after save
- [x] **FIX 6** — `app/upload-route.tsx`: Show StoryShareSheet after successful upload instead of auto-navigating back

## Review

**`app/recording.tsx`** — `handleStop()` and the stopped-banner save button both now use `router.replace('/ride-summary')` so the recording screen is popped off the stack. The discard button calls `reset()` then `router.replace('/(tabs)')`. This eliminates the restart bug where `reset()` (called from ride-summary) set status→idle which re-triggered the auto-start `useEffect` on the still-mounted recording screen.

**`components/record/FloatingRideButton.tsx`** — `handleRecord` now guards against `status === 'stopped'`: instead of silently discarding an unsaved ride and starting a new one, it redirects to `/ride-summary`.

**`lib/rideStorage.ts`** — Added `traffic?`, `roadCondition?`, `whyGood?` as optional fields to `SavedRide`. Backward-compatible (existing saved rides load fine).

**`components/share/StoryShareSheet.tsx`** (NEW) — Reusable Modal with dark backdrop, two 150×150 cards (Instagram gradient + Facebook blue), spring-in animation, and a "Preskoči" plain-text button. Tapping a social card deep-links to the app (`instagram://camera`, `fb://stories/composer`) with Alert fallback if not installed. Tapping Preskoči calls `onSkip()`.

**`app/ride-summary.tsx`** — Replaced single "notes" TextInput with three separate fields (Promet, Kakovost ceste, Zakaj je dobra?) matching upload-route.tsx style. After successful save: shows checkmark animation → after 800ms shows StoryShareSheet → Preskoči navigates to `/saved-rides`.

**`app/upload-route.tsx`** — After upload success: checkmark animates → after 800ms shows StoryShareSheet → Preskoči calls `router.back()`. Removed the old `setTimeout` auto-navigate.

---

# Post-Ride Feedback Fixes

## Todo

- [x] Fix `calcElevationGain` with smoothing + threshold in `routesRepo.ts`
- [x] Export `calcElevationGainFromPoints` helper from `routesRepo.ts`
- [x] Smooth sampled elevation in `computeElevationProfileFromPoints`
- [x] Compute and pass `elevationM` for regular rides in `ride-summary.tsx`
- [x] Change story share map tile URL in `ShareCard.tsx`
- [x] Add `initialRouteId` prop to `CreateGroupRideScreen`
- [x] Update `app/group-rides/create.tsx` to pass route param
- [x] Add "Create group ride" button to `app/route/[id].tsx`
- [x] Add `createRaceSubmission` to `racesRepo.ts`
- [x] Add create race button + form to `app/(tabs)/tekme.tsx`

## Review

**`repositories/routesRepo.ts`**
- `calcElevationGain` replaced with smoothed version: 7-point moving average + 2 m minimum delta threshold. Exported as `calcElevationGainFromPoints`.
- `computeElevationProfileFromPoints`: final sampled values now run through 3-point smoothing so gradient bars are not spiky.

**`app/ride-summary.tsx`**
- Added `elevationM = calcElevationGainFromPoints(points)` memo (all ride types, not just climbs).
- Passes `elevationM` to `StoryShareSheet` so the share card shows a real number instead of "—".

**`components/share/ShareCard.tsx`**
- Tile URL changed from `dark_all` to `rastertiles/voyager` — colorful, clean CartoDB style matching the route-detail viewer.

**`screens/CreateGroupRideScreen.tsx`**
- Accepts optional `initialRouteId?: string` prop; `selectedRouteId` state initialised from it.

**`app/group-rides/create.tsx`**
- Reads `routeId` from `useLocalSearchParams` and passes it as `initialRouteId` to the screen.

**`app/route/[id].tsx`**
- Added "Ustvari skupinsko kolesarjenje" button below Share button. Navigates to `/group-rides/create?routeId=<id>`.

**`repositories/racesRepo.ts`**
- Added `createRaceSubmission({ name, raceDate, region?, link? })` that inserts into the `races` table.

**`app/(tabs)/tekme.tsx`**
- Added `+` button in header row. Tapping opens a bottom-sheet Modal with Name, Date (YYYY-MM-DD), Region, Link fields. Submit calls `createRaceSubmission`, closes modal, refreshes list.

---

# NaBajk — Code Cleanup Before Testing

## Tasks

- [x] Fix 1 — Delete dead file `data/mockGroupRides.ts`
- [x] Fix 2 — Call `markUploaded()` after successful ride upload (`app/ride-summary.tsx`)
- [x] Fix 3 — Add GPS quality labels to i18n (`constants/i18n.ts` + `app/recording.tsx`)

## Review

All three fixes were already implemented in a previous session:

1. `data/mockGroupRides.ts` — deleted (dead file, imported nowhere)
2. `app/ride-summary.tsx` line 125 — `uploadRecordedRide()` now calls `.then(result => { if (!result.error) markUploaded(id); })` on success; `markUploaded` was already imported
3. `constants/i18n.ts` — `recordGpsGood`, `recordGpsOk`, `recordGpsPoor` already present in both `sl` and `en`; `app/recording.tsx` lines 193-197 already use these i18n keys instead of hardcoded Slovenian strings

---

# Tekme Screen — Create Card + Form Redesign + Elevation Fix

## Todo
- [x] Add `race_type` column to `racesRepo.ts` (Race interface + createRaceSubmission + listRaces)
- [x] Update `RaceRow.inferType` to accept optional explicit type
- [x] Add create card to `tekme.tsx` SectionList header, remove `+` button
- [x] Replace Region field with Type chip picker in `tekme.tsx` modal form
- [x] Add i18n keys to `constants/i18n.ts`
- [x] Document manual DB migration SQL in `supabase-setup/01-schema.sql`

## Review

**`repositories/racesRepo.ts`** — Added `type?: string` to `Race` interface, `race_type: string | null` to `SupabaseRaceRow`, `type?` param to `createRaceSubmission` (inserts as `race_type`), and `race_type` to the `.select()` + map.

**`components/races/RaceRow.tsx`** — `inferType(name, type?)` now accepts an optional explicit type string. If provided, maps directly to the TypeSpec (kronometer→teal clock, vzpon→orange chevron-up, cestna→blue bicycle). Falls back to name-based inference for old rows.

**`app/(tabs)/tekme.tsx`** — Removed `addBtn` and `headerRow`. Title is now plain. Added `ListHeaderComponent` with a green-bordered create card (same style as GroupRidesScreen). Replaced Region `TextInput` with 3-chip type picker (Cestna / Kronometer / Vzpon). State `newRegion` → `newType`, `createRaceSubmission` call updated accordingly.

**`constants/i18n.ts`** — 5 new keys in both `sl` and `en`: `addRaceCreateCardTitle`, `addRaceCreateCardDesc`, `addRaceTypeLabel`, `raceTypeCestna`, `raceTypeKronometer`, `raceTypeVzpon`.

**`supabase-setup/01-schema.sql`** — Documented manual migration comment: `ALTER TABLE races ADD COLUMN IF NOT EXISTS race_type text;`

**Manual step required**: Run in Supabase SQL editor:
```sql
ALTER TABLE races ADD COLUMN IF NOT EXISTS race_type text;
```

---

# Auth Fix — Build 25 (EAS Env Vars + PKCE)

## Root Cause
EAS production environment had NO env vars — every build was using `placeholder.supabase.co` fallback URL. All Supabase calls failed with "Network request failed" before reaching the real server.

## Tasks

- [ ] Step 1: Add `EXPO_PUBLIC_SUPABASE_URL` to EAS production env vars (plaintext)
- [ ] Step 2: Add `EXPO_PUBLIC_SUPABASE_ANON_KEY` to EAS production env vars (plaintext)
- [ ] Step 3: Commit current code changes (`lib/supabase.ts` flowType + `contexts/AuthContext.tsx` PKCE handler)
- [ ] Step 4: Run `eas build --platform ios --profile production --auto-submit` (Build 25)

## Review

(to be filled)

---

# Auth Fix — Magic Link + Google Sign-In

## Status

- [x] **Google Sign-In v16 fix** — `AuthContext.tsx`: `userInfo.type === 'cancelled'` check so dismissing the picker doesn't throw
- [x] **PKCE deep link handler** — `AuthContext.tsx`: handles both hash-fragment (implicit) and `?token_hash=` (PKCE) magic link URLs
- [x] **Error visibility** — `EmailSignInModal.tsx`: shows raw Supabase error instead of generic "Prijava ni uspela"
- [ ] **DIAGNOSE**: Check Supabase Dashboard → Authentication → Logs for the failed OTP request — the exact error is there (rate limit / SMTP / config)

## Notes

- `flowType: 'implicit'` is set in `lib/supabase.ts` (unchanged from commit 35c940d)
- If the OTP call itself fails before any email is sent, it's a Supabase server-side issue (rate limit, SMTP), not a deep link parsing issue
- Google Sign-In code fix needs a new build to take effect on device

---

# Auth Fix — Build 22 (Google Sign-In v16 + Magic Link)

## Tasks

- [x] **Manual (user)**: Add `nabajk://auth/callback` to Supabase → Authentication → URL Configuration → Redirect URLs
- [x] **Google v16 fix** — `contexts/AuthContext.tsx`: `userInfo.type === 'cancelled'` check (already in working dir)
- [x] **Error visibility** — `components/auth/EmailSignInModal.tsx`: shows raw Supabase error (already in working dir)
- [ ] Commit both files
- [ ] Run `eas build --platform ios --profile production` (Build 22)
- [ ] Submit to TestFlight when build completes

## Review

(to be filled)

---

# Animated Loading Screen + Onboarding Timing Fix

## Tasks
- [x] `app/index.tsx` — Replace bare spinner with branded loading screen (logo fade-in, typewriter quote, 2.5s minimum)
- [x] `app/(tabs)/_layout.tsx` — Add 600ms delay before showing onboarding overlay

## Review

**`app/index.tsx`** — Full rewrite of the loading screen. Dark `#0A0A0B` background. Logo (`logo-navbar.png`) fades in + slides up via Reanimated (`withTiming`, 600ms). A randomly-picked motivational quote (Slovenian or English based on `useLanguage`) types out via `setInterval` starting at 500ms, one character every 45ms. `minReady` state gates navigation — set `true` after 2500ms so the screen always shows for at least 2.5 seconds, which gives `/(tabs)` time to render before the onboarding overlay fires.

**`app/(tabs)/_layout.tsx`** — One-line change: `setOnboardingVisible(true)` wrapped in `setTimeout(..., 600)` as a belt-and-suspenders guard on top of the 2.5s minimum.

---

# i18n Audit — Fix All Hardcoded UI Strings

## Tasks
- [x] Add ~50 new keys to `constants/i18n.ts` (both sl + en)
- [x] Fix `app/route/[id].tsx` — "Deli na Instagram", "Ustvari skupinsko kolesarjenje"
- [x] Fix `app/recording.tsx` — alert text, "Nazaj", "GPS SIGNAL", climb badge, timer label, stop button
- [x] Fix `app/ride-summary.tsx` — all hardcoded labels, placeholders, buttons, alerts
- [x] Fix `app/(tabs)/tekme.tsx` — create race modal and alert strings
- [x] Fix `components/share/StoryShareSheet.tsx` — add useLanguage, fix all strings
- [x] Fix `app/climbs.tsx` — "Ni vzponov"

## Review

**`constants/i18n.ts`** — 50 new keys added to both `sl` and `en`: generic `error`, recording cockpit, ride summary fields/buttons/alerts, share sheet labels, `noClimbs`, and all add-race-form strings.

**`app/route/[id].tsx`** — 2 buttons: "Deli na Instagram" → `shareOnInstagram`, "Ustvari skupinsko kolesarjenje" → `createGroupRide`.

**`app/recording.tsx`** — 7 strings fixed. `textTransform: 'uppercase'` added to `climbBadgeText` so '▲ Vzpon'/'▲ Climb' renders correctly.

**`app/ride-summary.tsx`** — 14 strings fixed. `textTransform: 'uppercase'` added to `statLabel` so 'Trajanje'/'Duration' renders correctly.

**`app/(tabs)/tekme.tsx`** — 9 strings fixed in the create-race modal and alert calls.

**`components/share/StoryShareSheet.tsx`** — Added `useLanguage` + `t` imports. 5 strings fixed.

**`app/climbs.tsx`** — 1 string fixed.
