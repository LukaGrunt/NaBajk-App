# Ride Metrics & Functional Audit — Phase 1 (report) + Phase 2 (fix plan)

Full triaged report: `tasks/audit-2026-06-10.md`. Phase 1 (investigation) is done;
Phase 2 tasks below are **awaiting approval** before any code change.

## Tasks
- [x] Phase 1: trace every metric end-to-end, audit feature flows, run `npx tsc --noEmit`, write triaged report
- [x] Step 1: NEW `lib/rideMetrics.ts` — `finalizeRide()`: one pass computing distance, elapsed, moving (gap-clamped, speed-aware), avg speed, elevation gain (hysteresis), `elevationCorrected` flag, canonical processed track
- [x] Step 2: Fix elevation gain — replace per-step `MIN_DELTA=1` with hysteresis between local extrema; threshold 2 m (DEM) / 5 m (raw)
- [x] Step 3: `ride-summary.tsx` — drop the 5 s `Promise.race`; await DEM correction with honest timeout; save + upload + GPX all use the ONE `RideMetrics` object (no recompute in `uploadRecordedRide`)
- [x] Step 4: `rideStorage.ts` — add `elevationGainM`, `elevationCorrected`, `elapsedSeconds`, `avgSpeedKmh` to SavedRide; show elevation + avg speed on saved-ride detail
- [x] Step 5: Recorded routes show recorded `duration_minutes` on cards/detail; estimate only when no recorded time; `ShareCard` renders the real `durationSeconds` prop
- [x] Step 6: `rideRecorder.ts` — stationary-drift rejection in accept(); cockpit timer advances every second
- [x] Step 7: Unit tests for the metric calcs (15 tests, jest + ts-jest)
- [x] Step 8: Fix the 5 `tsc` errors
- [x] Step 9 (P2 batch): upload retry + status surfacing; GPX file-existence check on export; chat polling + failed-send UI; RSVP error feedback; async-button disable guards; message-cap error logging
- [ ] MANUAL: verify the live DB has a `gpx_data text` column on `routes` (repo SQL only defines `gpx_file_url`). Run in Supabase SQL editor: `select column_name from information_schema.columns where table_name = 'routes';` — if missing, every recorded-ride upload is failing; add the column or switch to the gpx-files bucket.

## Review
All metric math now lives in `lib/rideMetrics.ts`; `finalizeRide()` is the single source of truth.

- **NEW `lib/rideMetrics.ts`** — `computeDistanceMeters`, `computeMovingSeconds` (gaps <30 s count; longer gaps count only when implied speed ≥0.8 m/s, so GPS dropouts no longer delete ride time but café stops still auto-pause), `calcElevationGain` (hysteresis between local extrema — steady gentle climbs accumulate fully, noise below threshold contributes nothing), `finalizeRide()` (awaits DEM correction up to 30 s, returns one `RideMetrics` object incl. the corrected track and an `elevationCorrected` flag that selects the 2 m/5 m gain threshold).
- **`lib/elevationCorrection.ts`** — returns `{ points, corrected }` so callers know which path ran; downsampling adapts to ride length (≤500 samples / ≤5 API batches) so correction actually finishes on long rides instead of always losing the timeout race.
- **`app/ride-summary.tsx`** — instant stats from the same pure functions; elevation cell shows a spinner until `finalizeRide` resolves; `handleSave` awaits the *same* promise, so displayed = saved = uploaded = GPX. Added a `savingRef` double-tap guard. GPX is generated from the corrected track.
- **`repositories/routesRepo.ts`** — `uploadRecordedRide` now takes precomputed `elevationM` (old raw-recompute + per-step gain deleted); `created_by` mapped to `Route.createdBy`; `computeElevationProfileFromPoints` accepts a minimal point type (fixes 2 tsc errors).
- **`lib/rideRecorder.ts`** — imports the shared distance/moving functions (local copies deleted); accept() rejects stationary drift (implied speed <0.8 m/s within the GPS error circle) so long stops no longer inflate distance; the 1 s tick computes a provisional moving time so the cockpit timer no longer stutters in 4 s jumps.
- **`lib/rideStorage.ts`** — SavedRide gains optional `elapsedSeconds`, `avgSpeedKmh`, `elevationGainM`, `elevationCorrected` (old rides still parse); `app/saved-rides/[id].tsx` shows the new row.
- **`utils/rideTimeCalculator.ts`** — new `displayRideMinutes()`: recorded routes (createdBy set, duration >0) show real ride time; estimate only otherwise. Wired into RouteCard, RouteListItem, ClimbListItem, route detail, time-filter screen and all share sheets. `ShareCard` now renders the actual `durationSeconds` instead of always predicting.
- **Tests** — `__tests__/rideMetrics.test.ts` (15 tests, all passing) incl. regression tests for the two headline bugs: gentle-climb gain no longer ~0, flat-ride noise no longer accumulates. jest 29 + ts-jest devDeps, `npm test`.
- **tsc** — 0 errors (was 5; deleted unused Expo template files `EditScreenInfo.tsx`, `ExternalLink.tsx`).

Behaviour notes: recorded `duration_minutes` semantics unchanged (moving time). Curated-route cards still show the rider-level estimate — only routes with `created_by` switch to real time. DEM display-only bug is gone: when correction succeeds the corrected gain is what gets uploaded; when it fails the noise-tolerant threshold is used and the ride is marked `elevationCorrected: false` locally.

### Step 9 (P2 batch)
- **`app/saved-rides/[id].tsx`** — export resolves the GPX path first (`getInfoAsync`, then same filename under the current `documentDirectory` — handles iOS container-path changes across updates) and alerts instead of silently doing nothing; new upload-status row: "Published to NaBajk routes" when uploaded, otherwise a "Publish" retry button that re-runs `uploadRecordedRide` from the SavedRide (using persisted `elevationGainM`) and calls `markUploaded`. Both buttons disable + spin while busy.
- **`app/saved-rides.tsx`** — pending-upload cloud icon on rides not yet uploaded.
- **`RideChatSection.tsx`** — 5 s polling while the chat modal is open (cleaned up on close/unmount) so other riders' messages appear live; failed send shows an alert and keeps the typed text; `handleSend` ignores taps while a send is in flight.
- **`RSVPModule.tsx`** — RSVP failure now alerts (`rsvpFailed` i18n key added sl/en) instead of failing silently.
- **`groupRidesRepo.ts`** — message-cap count/delete and expired-message cleanup now check and log their errors; housekeeping failures never block sending.
- **Button guards** — route detail Export GPX disables + spins while exporting; FloatingRideButton navigation actions go through a `navigateOnce` ref guard (no more double-pushed screens); ride-summary back button disabled while saving; StoryShareSheet capture guards against setState after close.
- **NOT done here (needs dashboard access):** live-DB check that `routes.gpx_data` exists — see the MANUAL task above. Retry-upload note: if the original background upload succeeded but `markUploaded` failed, retrying can create a duplicate route row; true idempotency needs a client-generated unique key on the row (server-side change).

`npx tsc --noEmit`: 0 errors. `npm test`: 15/15 passing.

---

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

---

# Fix: Remove RECORD_AUDIO permission (Google Play rejection)

## Tasks
- [x] Step 1: Add `["expo-av", { "microphonePermission": false }]` to `app.json` plugins
- [x] Step 2: Rebuild for Android (`eas build --platform android --profile production`)
- [ ] Step 3: Download new AAB and re-upload to Google Play Console

## Review
- `app.json`: Added `["expo-av", { "microphonePermission": false }]` to plugins — suppresses RECORD_AUDIO injection by expo-av's config plugin.
- Build `versionCode 5` completed successfully: https://expo.dev/artifacts/eas/vMEzXSnqqFjQotgfWx4JQv.aab
- Manual: download AAB and upload to Google Play Console.

---

# Apple Sign-In + Tester Button Fix (App Store Resubmission)

## Tasks
- [x] Step 1: Install expo-apple-authentication
- [x] Step 2: app.json — add expo-apple-authentication plugin
- [x] Step 3: contexts/AuthContext.tsx — add signInWithApple
- [x] Step 4: components/auth/EmailSignInModal.tsx — add initialTesterMode prop, pre-fill creds, remove old hidden Testers button
- [x] Step 5: app/auth-welcome.tsx — add Tester button (bottom-right, visible) + Apple auth button (iOS only)
- [x] Step 6: Build and resubmit via EAS

## Review
- **expo-apple-authentication** installed and added to plugins
- **AuthContext**: `signInWithApple` calls `AppleAuthentication.signInAsync` → `signInWithIdToken(provider: 'apple')`. Added to interface + value.
- **EmailSignInModal**: Added `initialTesterMode` prop. When true, email/password pre-filled with `reviewer@nabajk.app` / `NaBajk2026!`, testerMode starts true. Removed the invisible "Testers" text button from title row.
- **auth-welcome**: Added Apple `AuthButton` (iOS-only via `Platform.OS === 'ios'`) above Google button. Added visible "Tester" button absolutely positioned bottom-right (opacity 0.8, white text). Tapper opens a separate EmailSignInModal with `initialTesterMode` so credentials are pre-filled. ERR_CANCELED from Apple auth is silently ignored.
- **Manual step needed**: Supabase Dashboard → Auth → Providers → Apple → set Client ID `com.nabajk.app`, save.

---

# Multi-fix: Partners, Instagram, Crash, Story logos

## Tasks
- [x] Fix 1: Partner button equal size — remove hardcoded aspectRatio, use fixed height 64 on both cards
- [x] Fix 2: Instagram story direct open — strip `file://` prefix before passing to Share.shareSingle
- [x] Fix 3: Group ride crash (Vector 2) — replace Reanimated in ShareOverlaySheet with RN Animated
- [x] Fix 4: Story partner logos bigger + higher opacity in StoryOverlay footer

## Review

**`components/PartnerStrip.tsx`** — Removed `aspectRatio: 297/96` from `logoImage`, replaced with `height: 64`. Added `height: 64` to `card` style. Both partner cards now always render at the same fixed 64px height regardless of the actual PNG dimensions.

**`lib/share/shareToStories.ts`** — Added `file://` prefix stripping in both `shareToInstagramStories` and `shareToFacebookStories`. `react-native-view-shot` returns `file:///path/...` but react-native-share on iOS expects the raw absolute path without the scheme prefix. The stripping is a one-liner applied before each `Share.shareSingle` call.

**`components/share/ShareOverlaySheet.tsx`** — Replaced all Reanimated 4 primitives (`useSharedValue`, `useAnimatedStyle`, `withTiming`, `withSpring`) with React Native's built-in `Animated` API (`useRef(new Animated.Value(...))`, `Animated.timing`, `Animated.spring`). This eliminates the second Reanimated crash vector on group ride detail screen — Reanimated was running hooks on component mount (with `visible=false`), which conflicted with New Architecture initialization. Now uses `useNativeDriver: true` throughout so the animations still run on the native thread.

**`components/share/StoryOverlay.tsx`** — Sponsor logo size increased from `72×20` → `96×28`, opacity raised from `0.75` → `0.92`. Logos are now noticeably larger and more visible in the story footer.

---

# Record Ride / Climb — Deep Audit & Rebuild Plan (May 2026)

## Why this audit
Users (especially on Android) report:
- Recording feels broken — distance / GPS quality stuck on "waiting" or "poor"
- Ride duration is sometimes wrong
- Whole feature feels unreliable enough that Luka was considering rebuilding it
- Open question: is MapLibre / the free map stack to blame?

## TL;DR
**No, the map stack is not the problem.** GPS recording (`expo-location` + OS APIs) and map rendering (MapLibre + tile provider) are independent systems. GPS is free on both iOS and Android via the OS — Apple/Google do not charge to read the GPS chip, and that has never changed.

The bugs are 100% in our recorder code. Architecture is fine. Three concrete root causes plus a few smaller issues. Phase-1 fix is one file, ~15 lines. Phase-2 (persistence) is half a day. Phase-3 (polish to Strava-grade) is optional follow-up.

## What I read
- `lib/rideRecorder.ts` (singleton GPS module)
- `app/recording.tsx` (cockpit screen)
- `app/ride-summary.tsx` (post-ride screen)
- `lib/rideStorage.ts` (AsyncStorage CRUD for saved rides)
- `lib/elevationCorrection.ts` (DEM elevation post-process)
- `repositories/routesRepo.ts` (elevation gain calc + Supabase upload)
- `components/record/FloatingRideButton.tsx` (FAB)
- `app/_layout.tsx` (recorder import at startup ✓)
- `app.json` (expo-location plugin config)
- `android/app/src/main/AndroidManifest.xml` (perms)
- `android/app/build.gradle`
- Git log of `lib/rideRecorder.ts` + `app/recording.tsx` (8 commits ever; 4 of them are Android-specific bandaids)

## Architecture today (one-line summary)
A module-level singleton holds `rawPoints[]`, `uiState`, and a `setInterval` tick timer. `expo-task-manager` registers a background task that pushes points into `rawPoints` whenever `expo-location` emits a batch. UI subscribes via `useRideRecorder()`. On stop, the recording screen captures `getPoints()` + `getState()` into local React state and navigates to ride-summary, which writes to AsyncStorage.

The architecture is reasonable. The bugs are in the configuration and lifecycle, not the design.

## Root causes — ordered by impact

### RC-1 — GPS accuracy set to `Balanced` (the killer)
**File:** `lib/rideRecorder.ts:147`

```ts
accuracy: Location.Accuracy.Balanced,
```

On Android, `Balanced` maps to `PRIORITY_BALANCED_POWER_ACCURACY` — Wi-Fi / cell-tower based, ~100 m typical accuracy, GPS chip not even prioritized. iOS's `Balanced` is closer to real GPS, which is why the same code "works on iPhone, broken on Android."

Then `lib/rideRecorder.ts:39` filters:
```ts
const MAX_ACCURACY_M = 40;
```

Result on Android: nearly every point is rejected. Distance counter stays at 0.00, GPS dot stays orange/red, points list is empty. Symptom matches the user reports exactly.

**Fix:** `Location.Accuracy.High` (≈10 m, real GPS, reasonable battery for cycling). `BestForNavigation` is overkill and burns battery.

---

### RC-2 — No Android foreground service config (the second killer)
**File:** `lib/rideRecorder.ts:146-153`

`app.json` has `isAndroidForegroundServiceEnabled: true` and the manifest has `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_LOCATION`. But expo-location only actually starts the foreground service if you pass a `foregroundService: { notificationTitle, notificationBody, notificationColor }` object to `startLocationUpdatesAsync` at runtime. We don't.

Without it, on Android 8+ the OS treats this as plain background location, throttles updates to ~once per several minutes when the screen is off (Doze mode), and on Android 12+ may outright kill the service. The Expo issue tracker is full of "background location stops working on Android" reports, all of which resolve by adding the foregroundService block.

**Fix:** add to the options object:
```ts
foregroundService: {
  notificationTitle: 'NaBajk',
  notificationBody:  'Snemanje vožnje aktivno',
  notificationColor: '#00BC7C',
},
```

---

### RC-3 — All ride state lives in module memory (the persistence gap)
**File:** `lib/rideRecorder.ts:59-66`

```ts
let uiState = { status: 'idle', ... };
let rawPoints: RecordedPoint[] = [];
let startTimestamp = 0;
```

These are JS module variables. The moment the OS kills the JS context — which Android does aggressively without RC-2's foreground service — everything is gone.

Worse: when `expo-task-manager` later wakes a headless JS context to deliver a queued location batch, the module reloads with `uiState.status = 'idle'`, and the BG task callback drops every point at line 94:
```ts
if (uiState.status !== 'recording') return;
```

So even if RC-2 keeps the BG task alive, points are silently discarded on cold-launched task callbacks.

**This is also the most plausible explanation for the "wrong duration" reports.** Two scenarios:
1. App killed mid-ride → user reopens → fresh module → recorder is idle, ride lost. They blame the timer.
2. App paused mid-ride (not killed) → JS thread suspended → `setInterval` doesn't fire → user opens app, sees stale time, sees few points. Distance is far behind duration. Looks like time is wrong; really, the *ratio* is wrong because BG points were thrown away by RC-2.

**Fix:** persist points to SQLite (`expo-sqlite`, already in deps) directly from the BG task. Add a `nabajk_recording` row with `started_at`, `status`. On app start, check if a recording was active and offer to resume / save / discard.

---

### RC-4 — Live timer uses `setInterval`
**File:** `lib/rideRecorder.ts:132-136`

```ts
tickTimer = setInterval(() => {
  uiState = { ...uiState, elapsedSeconds: Math.floor((Date.now() - startTimestamp) / 1000) };
  notify();
}, 1000);
```

`setInterval` does not fire while the JS thread is suspended. The display value can drift while the screen is locked. The *final* `elapsedSeconds` on stop is recomputed from `Date.now() - startTimestamp` (line 185), so the saved duration is correct as long as `startTimestamp` survives — which it doesn't if the app gets killed (see RC-3).

**Fix:** the wallclock-based stop computation is already correct; the visible timer just needs to recompute on every render or on screen focus. Trivial change in `recording.tsx`.

---

### RC-5 — Background permission is requested but the result is ignored
**File:** `app/recording.tsx:152-156`

```ts
if (bgStatus === 'undetermined') {
  await Location.requestBackgroundPermissionsAsync();
  // Result intentionally ignored — recording starts regardless
}
```

OK as a UX choice (recording-while-screen-on still works), but combined with RC-2/RC-3 means a user who declines bg perm gets a worse Android experience than they need to. With foreground service in place, the app can keep recording in the foreground service indefinitely without bg perm — but only if we set things up that way. Worth keeping but documenting clearly.

---

### Smaller findings
- **`accept()` jitter filter** at line 75–86: with `Balanced` accuracy this also rejects real movement at slow climb pace because raw GPS noise is bigger than the 3 m jitter threshold. After RC-1 fix, this should behave correctly. Verify on a test ride.
- **Final 1–3 points lost on stop**: `stopRecording` immediately flips `uiState.status = 'stopped'`; in-flight BG batches arriving milliseconds later are dropped at line 94. Minor.
- **`MainApplication.kt` is stock**, no custom service handling. Fine.
- **`versionCode 1` in build.gradle** — fine, EAS overrides it via `autoIncrement`.
- **4 commits ahead of origin** locally + uncommitted changes in `app/recording.tsx` and others. Worth pushing to GitHub before more changes pile up.

---

## How Strava / Komoot / Garmin do it (the patterns worth borrowing)

| Pattern | What pros do | Are we doing it? |
|---|---|---|
| GPS accuracy | High / Best for navigation | ❌ Balanced — RC-1 |
| Foreground service | Persistent notification with elapsed time | ❌ Not started — RC-2 |
| Point storage | Write each point to SQLite as it arrives | ❌ Module memory — RC-3 |
| Crash recovery | "Resume previous ride?" prompt on app start | ❌ No |
| Timer | Wallclock diff, recomputed on render | ⚠️ setInterval — RC-4 |
| Auto-pause | Pause recording when speed < threshold for N seconds | ❌ No (and `pausesUpdatesAutomatically: false` opts out) |
| Smoothing | Apply at end of ride, keep raw points | ✅ DEM correction in elevationCorrection.ts |
| Filtering | Reject by accuracy + speed + jitter | ✅ Already doing this |
| Elevation | DEM correction post-ride | ✅ SRTM 30m via Open Topo Data |

We're closer than the user thinks. Two big gaps + one persistence gap.

---

## Fix plan (proposed, awaiting approval)

### Phase 1 — The two killers (single file, ~15 lines)
- [ ] **P1.1** `lib/rideRecorder.ts:147` — `Balanced` → `High`
- [ ] **P1.2** `lib/rideRecorder.ts:146-153` — add `foregroundService: { notificationTitle, notificationBody, notificationColor }`
- [ ] **P1.3** Test on a physical Android device: walk/ride a known distance, confirm GPS dot turns green, distance counter increments, screen-locked recording continues with persistent notification visible

**Stops the bleeding for 95% of Android users. Should ship as a hotfix.**

### Phase 2 — Persistence (1 file new, 2 files touched, ~half day)
- [ ] **P2.1** New `lib/recordingStore.ts`: thin SQLite wrapper, `appendPoint()`, `getActiveRide()`, `clearActiveRide()`. Schema: one `recordings` row + many `points` rows.
- [ ] **P2.2** `lib/rideRecorder.ts`: BG task callback writes each point to SQLite synchronously (await `db.runAsync`). On `startRecording` create a recording row; on `stopRecording` mark it complete.
- [ ] **P2.3** `app/_layout.tsx`: on mount, check `getActiveRide()` — if found and last point is < 10 min old, route user to a "Resume / Save / Discard" screen. Otherwise clear it.
- [ ] **P2.4** New `app/resume-ride.tsx`: simple 3-button screen.
- [ ] **P2.5** Migrate `getPoints()` to read from SQLite so ride-summary always sees the full set.

**Eliminates RC-3 entirely. After this, killing the app mid-ride is no longer catastrophic.**

### Phase 3 — Polish to Strava-grade (optional, can defer)
- [ ] **P3.1** Recompute `elapsedSeconds` on every render from `Date.now() - startTimestamp` so locked-screen drift disappears (RC-4)
- [ ] **P3.2** Foreground-service notification shows live elapsed time (Android 14+ supports notification updates without OS spam)
- [ ] **P3.3** Auto-pause logic: if speed < 1 m/s for 30s, pause distance accumulation (still tick time). Resume on movement. Strava behavior.
- [ ] **P3.4** Migrate `tickTimer` to a Reanimated frame-callback for smoother timer updates while screen is on
- [ ] **P3.5** Add a "ride debug" hidden screen accessible from settings: shows last N points, accuracy histogram, BG task fire count. Invaluable for diagnosing user reports.

### Out of scope (not changing in this audit)
- MapLibre / map rendering — not the problem
- Tile provider — OpenFreeMap is fine and free
- DEM elevation correction — already working
- Filtering thresholds — revisit only if RC-1 fix doesn't restore healthy points
- Auth / Google Sign-In / etc.

---

## Open questions for Luka
1. Push the 4 unpushed commits + commit working-copy changes before Phase 1, or ship Phase 1 as part of the next batch?
2. Phase 2 changes data shape — saved rides stay in AsyncStorage but ACTIVE recordings move to SQLite. OK?
3. Phase 3.3 (auto-pause): worth doing for cyclists who stop at red lights? Or do users prefer raw time including stops?
4. After Phase 1 + 2, do you want me to write a short "what changed and why" note for in-app release notes / a TestFlight announcement?

---

## Review

All three phases implemented in a single Cowork session on 2026-05-03.

### Phase 1 — shipped as commit `732fb08`
Single-file edit to `lib/rideRecorder.ts`:
- `Location.Accuracy.Balanced` → `Location.Accuracy.High` (the Android killer)
- Added `foregroundService: { notificationTitle, notificationBody, notificationColor }` block so expo-location actually starts the typed `FOREGROUND_SERVICE_LOCATION` service on Android instead of silently relying on plain background-location (which gets killed in Doze)

### Phase 2 — point persistence + recovery flow
- **NEW** `lib/recordingStore.ts` — thin SQLite wrapper, two tables (`active_recording`, `active_points`), WAL mode for concurrent BG-task + foreground writes, all calls wrapped in try/catch so the recorder degrades to memory-only if SQLite ever fails to open
- **`lib/rideRecorder.ts`**: BG task callback is now `async` and awaits `appendActivePoint()` per accepted point (also incidentally fixes the pre-existing `TaskManagerTaskExecutor` TS error). Added `hasRecoverableRecording()` and `hydrateFromActiveRecording()` exports for the recovery flow. `reset()` now also clears SQLite. `startRecording` accepts an `{ isClimb }` option and persists it.
- **NEW** `app/resume-ride.tsx` — cold-start recovery screen with two buttons: **Save** (hydrates the recorder, routes to `/ride-summary` so the user names + saves the ride normally) and **Discard** (clears SQLite, routes home). Deliberately no "Resume" — there's already a gap in the GPS data when the OS killed the app, so resuming would produce a bad track.
- **`app/index.tsx`**: cold start now calls `hasRecoverableRecording()` after auth + terms gate, routes to `/resume-ride` instead of `/(tabs)` if there's an unsaved ride.
- **`app/_layout.tsx`**: registered the new `resume-ride` Stack screen (no header, like the cockpit).
- **`constants/i18n.ts`**: 3 new keys in both `sl` and `en` (`recoverTitle`, `recoverBody`, `recoverSaveBtn`).

### Phase 3 — moving time (auto-pause) + better timer semantics
- **`RecordingState`** gained a `movingSeconds` field. `elapsedSeconds` is unchanged (wallclock since start, including stops); `movingSeconds` sums inter-point gaps that are < 30 s. So a 5-minute café stop produces a 5-minute gap, which is correctly excluded from moving time.
- **`computeMovingSeconds()`** is a pure helper inside `rideRecorder.ts`. The BG task recomputes it every time a new point is accepted and on every tick; on stop it's recomputed once from the final point list.
- **`app/recording.tsx`**: cockpit timer shows `state.movingSeconds`; avg-speed calculation also uses moving seconds so a long pause doesn't drag the number down.
- **`app/ride-summary.tsx`**: the snapshot captured on mount now uses `movingSeconds` for `durSec` (with `elapsedSeconds` fallback if 0). The saved `SavedRide.durationSeconds` therefore reflects moving time, which is the standard cycling-app convention (Strava "Moving Time").
- **`components/record/FloatingRideButton.tsx`**: FAB badge timer also reads `movingSeconds` so it matches the cockpit when the user pops back to the home screen.

### TypeScript health
`npx tsc --noEmit` reports the same 4 pre-existing errors as before this work — none introduced by Phase 1, 2, or 3. The previously-flagged `TaskManager.defineTask` TS error is **resolved** as a side-effect of making the BG callback `async` for SQLite writes.

### Files touched (all phases)
| File | Phase | Notes |
|---|---|---|
| `lib/rideRecorder.ts` | 1, 2, 3 | Core recorder |
| `lib/recordingStore.ts` | 2 | New SQLite layer |
| `app/recording.tsx` | 3 | Cockpit shows moving time + passes isClimb |
| `app/ride-summary.tsx` | 3 | Saves moving seconds as durationSeconds |
| `app/resume-ride.tsx` | 2 | New recovery screen |
| `app/index.tsx` | 2 | Cold-start recovery routing |
| `app/_layout.tsx` | 2 | Registered resume-ride route |
| `constants/i18n.ts` | 2 | 3 new keys × 2 languages |
| `components/record/FloatingRideButton.tsx` | 3 | FAB badge → moving time |
| `docs/release-notes-recording-fix.md` | meta | NEW — store + reviewer notes |
| `docs/AI-HANDOFF-recording-fix.md` | meta | NEW — VS Code chat context |
| `tasks/todo.md` | meta | This audit |

### What was NOT changed
- `app.json` / Android manifest — already correct since previous build (FOREGROUND_SERVICE_LOCATION etc.)
- MapLibre / map rendering — confirmed not the problem
- DEM elevation correction (`lib/elevationCorrection.ts`) — already working correctly
- Filter constants (`MAX_ACCURACY_M`, `MAX_SPEED_MS`, `MIN_JITTER_M`) — left untouched; should now behave correctly with `Accuracy.High`. Revisit only if a real-ride test shows points still being over-rejected.

### Open follow-ups (not blocking ship)
- Live elapsed-time in the foreground-service notification body (would require restarting the location service to update, or a parallel `expo-notifications` channel — punted).
- Bilingual notification body (currently hardcoded Slovenian; recorder is a singleton outside React so we'd need to read `AsyncStorage` for the language pref).
- Pre-existing TS errors in `app/route/[id].tsx`, `components/climbs/ClimbListItem.tsx`, `app/time/[duration].tsx`, `components/EditScreenInfo.tsx` — separate cleanup pass.
- Pushing all of this to GitHub: **deferred to Luka** (sandbox shell has no GitHub credentials).
