# AI Handoff — Recording Feature Rebuild (Phases 1, 2, 3)

> **For the AI assistant in VS Code (Cursor / Copilot Chat / Claude Code):**
> Attach or paste this file into your chat context whenever you're working
> on the recording feature. It captures what just changed, why, and what
> not to undo.

**Date:** 2026-05-03
**Author of this changeset:** Cowork AI session, working on Luka's behalf
**Phase 1 commit:** `732fb08` (committed; pending push)
**Phases 2 + 3:** code on disk, **not yet committed** (sandbox couldn't get a git lock — Luka will commit + push from his terminal). See "How to commit + push" at the bottom of this doc.
**Scope:** All three phases of the recording-feature audit are now done. The next assistant should not need to do another full pass on this feature.

---

## TL;DR for the next assistant

The recording feature has been audited end-to-end and rebuilt in three phases. Headline changes:

1. **GPS accuracy fixed** — `Location.Accuracy.Balanced` → `Location.Accuracy.High` so Android actually uses the GPS chip instead of network/Wi-Fi.
2. **Foreground-service started** — `startLocationUpdatesAsync` now passes a `foregroundService: { ... }` block, so Android keeps the location task alive when the screen is off (the manifest perms alone weren't enough).
3. **Points are now SQLite-persisted** — every accepted point is mirrored to a small SQLite DB (`nabajk_recording.db`) by a new `lib/recordingStore.ts`. If Android kills the JS context mid-ride, the data survives.
4. **Cold-start recovery flow** — new `app/resume-ride.tsx` screen pops up if SQLite has an unsaved ride (Save / Discard), so users never silently lose a ride to a process kill.
5. **Moving time semantics** — `RecordingState.movingSeconds` (auto-paused for stops > 30 s) is now the displayed and saved duration. `elapsedSeconds` (raw wallclock) is still computed and exposed but no longer surfaced in UI.

**Do not revert any of the above.** Each one fixes a real user-visible bug. See "What was wrong" below for the full root-cause walkthrough.

---

## What was wrong

### Problem 1 — accuracy was set to `Balanced`

On Android, `Location.Accuracy.Balanced` maps to `PRIORITY_BALANCED_POWER_ACCURACY`, which is the network/Wi-Fi/cell-tower positioning tier — roughly 100 m accuracy and the GPS chip isn't even prioritized. iOS treats `Balanced` more like real GPS, which is why the same code was fine on iPhone but visibly broken on Android.

The rejection filter in the same file at the top:

```ts
const MAX_ACCURACY_M = 40;
```

means any point worse than 40 m gets thrown away. On Android with `Balanced`, almost every point fails this check. The user sees: distance counter stuck on `0.00`, GPS dot stuck orange/red, points list empty, "GPS WAITING" forever.

### Problem 2 — no Android foreground service config at runtime

`app.json` already has `isAndroidForegroundServiceEnabled: true` and the `AndroidManifest.xml` already declares `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_LOCATION`. **None of that is enough on its own.** `expo-location` only actually starts the typed foreground service when you also pass a `foregroundService: { ... }` object at runtime to `startLocationUpdatesAsync`.

Without it:
- Android 8+: location updates are throttled / killed when the screen locks (Doze).
- Android 12+: the call may throw at runtime due to stricter foreground-service-type rules (`FGS_TYPE_LOCATION` requires the typed service).

Symptom: ride starts fine while the user is staring at the screen, but the moment they pocket the phone, GPS goes silent and they come back to a half-recorded ride (or no ride).

---

## What changed in `lib/rideRecorder.ts`

```diff
     await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
-      accuracy:                         Location.Accuracy.Balanced,
+      accuracy:                         Location.Accuracy.High,
       timeInterval:                     4000,
       distanceInterval:                 15,
-      showsBackgroundLocationIndicator: true,   // required for App Store compliance
+      showsBackgroundLocationIndicator: true,   // iOS — App Store compliance
       activityType:                     Location.LocationActivityType.Fitness,
       pausesUpdatesAutomatically:       false,  // don't pause at red lights
+      foregroundService: {
+        notificationTitle: 'NaBajk',
+        notificationBody:  'Snemanje vožnje aktivno',
+        notificationColor: '#00BC7C',
+      },
     });
```

The notification body is hardcoded Slovenian for now. If you need to make it bilingual in a future change, the recorder is a singleton outside React, so you'll need to read the language preference from `AsyncStorage` synchronously (see `contexts/LanguageContext.tsx` for the storage key) before calling `startLocationUpdatesAsync`. Keep the change small.

`#00BC7C` is `Colors.brandGreen` — kept as a literal because the recorder doesn't import Colors.

---

## What you should NOT do

- **Don't change `accuracy` back to `Balanced` or `Low`.** That was the bug.
- **Don't remove the `foregroundService` block.** Android will silently kill background location.
- **Don't add `pausesUpdatesAutomatically: true`.** This was an intentional choice — cyclists stop at red lights and we don't want to pause the recording.
- **Don't move the recorder away from being a top-level module-loaded singleton** without updating `app/_layout.tsx`'s `import '@/lib/rideRecorder'`. The `TaskManager.defineTask` call must run during cold start so headless JS callbacks find the registered task.

---

## What was implemented in Phase 2 (point persistence)

### New file — `lib/recordingStore.ts`

Tiny SQLite wrapper, two tables, WAL journal mode for concurrent reads/writes:

```sql
CREATE TABLE active_recording (
  id INTEGER PRIMARY KEY CHECK (id = 1),  -- enforces single-row
  started_at INTEGER NOT NULL,
  is_climb INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE active_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lat REAL, lng REAL, alt REAL, timestamp INTEGER, accuracy REAL
);
```

Public API: `startActiveRecording`, `appendActivePoint`, `loadActiveRecording`, `clearActiveRecording`. **Every function is wrapped in try/catch** — if SQLite open ever fails, the recorder degrades gracefully to memory-only and logs a warning. The recorder's primary path remains the in-memory `rawPoints` array; SQLite is a write-through mirror.

### Changes to `lib/rideRecorder.ts`

- BG task callback is now `async` and `await`s `appendActivePoint(point)` after `accept(point)` succeeds. As a side benefit this also fixes the pre-existing `TaskManagerTaskExecutor wants Promise<any>` TS error.
- `startRecording()` now accepts an optional `{ isClimb }` and persists it into the recording row.
- `reset()` now also calls `clearActiveRecording()` so saving or discarding a ride wipes SQLite cleanly.
- Two new exports for the recovery flow:
  - `hasRecoverableRecording(): Promise<boolean>` — fast yes/no for `app/index.tsx` cold-start gate.
  - `hydrateFromActiveRecording(): Promise<{ isClimb: boolean } | null>` — pulls the rows back into `rawPoints` + `uiState`, sets `status: 'stopped'`, `stoppedReason: 'recovered'`, recomputes distance + moving time. The recovery screen calls this before navigating to `/ride-summary`.

### New file — `app/resume-ride.tsx`

Cold-start screen shown when `hasRecoverableRecording()` returns `true`. Two buttons:
- **Save** → calls `hydrateFromActiveRecording()`, then `router.replace('/ride-summary')` (with `?isClimb=true` if applicable). Ride-summary picks up the points via the existing `getPoints()` / `getState()` synchronous calls — same flow as a normal stop.
- **Discard** → confirmation alert → `reset()` → `router.replace('/(tabs)')`.

Deliberately **no "Resume" option**. If the OS killed the app mid-ride, there's already a gap in the GPS data; resuming would produce a track with a teleport in it.

### Changes to `app/index.tsx`

The auth/terms gate now also checks `hasRecoverableRecording()` after both pass and routes to `/resume-ride` instead of `/(tabs)` when there's an unsaved ride. The `'/resume-ride' as any` cast is there because expo-router's typed-routes generator hasn't picked up the new path yet at first tsc; it goes away on next `expo start` / `prebuild`.

### Changes to `app/_layout.tsx`

One new line — `<Stack.Screen name="resume-ride" options={{ headerShown: false }} />` next to the recording screen.

### i18n additions (`constants/i18n.ts`)

Three keys × two languages: `recoverTitle`, `recoverBody`, `recoverSaveBtn`. The Discard button reuses the existing `summaryDiscardBtn` / `summaryDiscardTitle` / `summaryDiscardBody`.

---

## What was implemented in Phase 3 (moving time / auto-pause)

### `RecordingState` gained a `movingSeconds` field

`elapsedSeconds` semantics are unchanged — wallclock since `startTimestamp`, including stops. `movingSeconds` is the sum of inter-point time gaps that are < `MOVING_GAP_S` (= 30 s). So a 5-minute café stop produces a 5-minute gap, which is correctly excluded from moving time. This is the standard cycling-app convention (Strava "Moving Time").

`computeMovingSeconds(points)` is a pure helper inside `rideRecorder.ts`. It runs:
- Every time a point is accepted in the BG task (so the live cockpit timer reflects current moving time)
- Once on `stopRecording()` to finalize the value
- Once during `hydrateFromActiveRecording()` so recovered rides also have correct moving time

### UI consumers switched to `movingSeconds`

- `app/recording.tsx` — cockpit timer now shows `formatTime(state.movingSeconds)`, and the avg-speed calculation uses `movingSeconds` so a long stop doesn't drag the number down.
- `app/ride-summary.tsx` — `durSec` snapshot prefers `movingSeconds` (with `elapsedSeconds` as fallback when 0). This is what gets saved as `SavedRide.durationSeconds` and what gets uploaded to Supabase via `uploadRecordedRide`.
- `components/record/FloatingRideButton.tsx` — FAB badge timer also uses moving time so it matches the cockpit when the user navigates back to the home screen during an active ride.

### Auto-pause for distance was already correct

The existing point filter already drops sub-3 m moves within a 5-second window via `MIN_JITTER_M`. So a stationary cyclist's distance counter doesn't grow — that's auto-pause for distance. Phase 3 just added the time half of the equation.

### What's NOT included

- **Live elapsed time inside the foreground-service notification body.** `expo-location` doesn't support updating notification text after `startLocationUpdatesAsync` is called without restarting the location service (which would reset GPS state). Doable via a parallel `expo-notifications` channel updating every 30 s — punted to keep Phase 3 small.
- **Bilingual notification body.** The recorder is a singleton outside React; reading the language from `AsyncStorage` synchronously in `startRecording` would work but adds coupling. Hardcoded Slovenian for now (primary user base).

---

## How to commit + push (manual step for Luka)

The Cowork sandbox couldn't get a git lock to commit Phase 2 + 3 (a `.git/index.lock` left from an earlier sandbox bash call became unremovable from inside the sandbox). The Phase 1 commit `732fb08` did go through. Phase 2 + 3 changes are on disk but uncommitted.

From a real terminal in the project root:

```sh
# 1. clear the stale lock (if it's still there)
rm -f .git/index.lock

# 2. push the 4 prior commits + Phase 1 first
git push origin main

# 3. stage ONLY the Phase 2 + 3 files (don't grab unrelated working-copy edits)
git add lib/rideRecorder.ts \
        lib/recordingStore.ts \
        app/recording.tsx \
        app/ride-summary.tsx \
        app/resume-ride.tsx \
        app/index.tsx \
        app/_layout.tsx \
        constants/i18n.ts \
        components/record/FloatingRideButton.tsx \
        tasks/todo.md \
        docs/release-notes-recording-fix.md \
        docs/AI-HANDOFF-recording-fix.md

git commit -m "Add SQLite point persistence, recovery flow, and moving-time semantics

Phase 2 + 3 of the recording-feature audit (see tasks/todo.md).

Phase 2 — persistence
- New lib/recordingStore.ts: SQLite wrapper, WAL mode, two tables for the
  active recording. BG task mirrors every accepted point.
- rideRecorder: BG callback is now async, hydrateFromActiveRecording() and
  hasRecoverableRecording() exports, reset() clears SQLite.
- New app/resume-ride.tsx: cold-start recovery screen (Save / Discard).
- app/index.tsx: routes to /resume-ride when SQLite has an unsaved ride.

Phase 3 — moving time
- RecordingState.movingSeconds = sum of inter-point gaps < 30s.
- recording.tsx, ride-summary.tsx, FloatingRideButton.tsx now use moving
  time for display and saving (Strava convention)."

git push origin main
```

After the push, run `npx expo start --clear` once locally so the typed-routes generator picks up `/resume-ride`. The `'/resume-ride' as any` cast in `app/index.tsx` will then become unnecessary (but harmless if left in place).

---

## Pre-existing TypeScript errors (NOT introduced by this change)

`npx tsc --noEmit` reports these — they were there before Phase 1:

- `app/route/[id].tsx:72` — `RecordedPoint` shape mismatch (missing `timestamp`, `accuracy`)
- `components/climbs/ClimbListItem.tsx:94` — same as above
- `app/time/[duration].tsx:50` — `RiderLevel` type cast issue
- `components/EditScreenInfo.tsx:40` — `Colors.light` doesn't exist
- `lib/rideRecorder.ts:92` — `TaskManager.defineTask` signature wants `Promise<any>` return; the callback returns `void`. Runtime-safe but TS-strict.

These don't block Metro bundling (TS errors are non-fatal in the RN build pipeline) but they should be cleaned up in a separate, focused pass — not as part of recording work.

---

## Files relevant to the recording feature (read these first)

| File | Role |
|---|---|
| `lib/rideRecorder.ts` | The singleton GPS recorder. Background task lives here. **You almost always want to start here.** |
| `app/recording.tsx` | The cockpit screen — sonar rings, timer, stop button. Subscribes to recorder via `useRideRecorder()`. |
| `app/ride-summary.tsx` | Post-ride screen. Captures points + distance + duration on mount via `useState(() => ...)`. Calls `correctElevations()` and `saveRide()`. |
| `lib/rideStorage.ts` | AsyncStorage CRUD for *saved* rides. Phase 2 will introduce a parallel SQLite store for the *active* ride. |
| `lib/elevationCorrection.ts` | DEM-based altitude correction (Open Topo Data SRTM 30m). Free API, no key. **Don't replace this with anything paid.** |
| `repositories/routesRepo.ts` | `calcElevationGainFromPoints`, `computeElevationProfileFromPoints`, `uploadRecordedRide` to Supabase. |
| `components/record/FloatingRideButton.tsx` | The home-screen FAB that launches recording. Has a "stopped" guard that routes to `/ride-summary` instead of starting fresh. |
| `app/_layout.tsx` | `import '@/lib/rideRecorder'` at the top (line 1) — this is what registers the BG task on cold start. **Don't remove it.** |
| `app.json` | The `expo-location` plugin block at the bottom controls Android FG service + iOS background mode. |
| `android/app/src/main/AndroidManifest.xml` | Auto-generated by Expo prebuild. Has `FOREGROUND_SERVICE_LOCATION`. |
| `tasks/todo.md` | The full audit + multi-phase plan. Read the bottom section. |

---

## How to verify Phase 1 worked

You need a physical Android device (the emulator gives you faked location and won't reproduce the bug). On any Android 8+ phone:

1. Run `eas build --platform android --profile preview` (or production)
2. Install on a Pixel / Samsung / Xiaomi
3. Open NaBajk → tap Record → accept disclaimer → grant location perms
4. Confirm:
   - GPS dot turns **green** within ~10 seconds (was stuck orange/red before)
   - Distance counter **increments** as you walk/ride
   - The Android notification shade shows **"NaBajk — Snemanje vožnje aktivno"** with a green icon
5. Lock the phone. Walk for 60 seconds.
6. Unlock. Distance should reflect the walk; timer should be ~60s further along.
7. Tap Stop → confirm → ride summary should show points and elevation.

If any of step 4–7 fails, **check logcat for `expo-location`** before assuming the fix is broken — the most common culprit is the user denying background permission, in which case foreground recording still works but locked-screen recording does not.

---

## Open questions for the human

(None for the immediate fix. For Phase 2/3 see `tasks/todo.md` open questions section.)

---

## Where to put follow-up changes

- **Phase 2** code goes in a new file: `lib/recordingStore.ts` (SQLite wrapper). The recorder will import from there. Keep `lib/rideRecorder.ts` mostly unchanged in shape — just make `rawPoints` a getter that reads from SQLite.
- **Phase 3 auto-pause** lives inside the `accept()` filter or as a sibling function in `lib/rideRecorder.ts`. Keep it small.
- **Phase 3 live notification timer** — pass `notificationBody` based on `uiState.elapsedSeconds`, but `expo-location` can't update notification text after `startLocationUpdatesAsync` is called without restarting the service. Workaround: a separate `expo-notifications` channel that updates every 30 seconds. Don't update every second — that drains battery.

---

## Commit message conventions in this repo

Looking at recent history, Luka's pattern is:

```
<Verb> <Scope>: <one-line summary>

<optional multi-line body explaining the why>
```

Examples from his log:
- `Fix Android grey screen after stopping recording`
- `Fix Android location permission retry: always request if not granted`
- `Add race type picker, prominent create card on Tekme screen + elevation DEM correction`

Keep this style. Don't include AI-credit footers.
