# Release Notes — Recording Feature Fix (Phase 1)

Build target: next iOS + Android release after commit `732fb08`.

---

## "What's New" — store description (user-facing)

### Slovenian (sl)

```
Izboljšano snemanje vožnje:
• Bistveno bolj zanesljiv GPS na Android napravah – razdalja in signal se zdaj posodabljata pravilno.
• Snemanje deluje tudi, ko je zaslon ugasnjen, brez prekinitev.
• Stabilna obvestilna ikona med vožnjo, da telefon ne ustavi sledenja.
```

### English (en)

```
Improved ride recording:
• Much more reliable GPS on Android — distance and signal now update correctly.
• Recording keeps running with the screen off, without dropouts.
• Persistent ride notification keeps the phone from killing tracking in the background.
```

Keep both under 170 characters per bullet for App Store; Play Store allows longer.

---

## App Store reviewer notes (Apple)

Use this in **App Store Connect → Version → App Review Information → Notes**.

```
This release fixes a regression in our GPS ride recording feature affecting
primarily Android users; iOS behavior is unchanged in production.

Background location is used solely for the user-initiated ride recording
feature (cycling tracker). Recording is started only when the user taps the
"Record" button on the home screen, accepts the safety disclaimer, and grants
foreground (and optionally background) location permission. While recording,
NSLocationWhenInUseUsageDescription is shown for foreground use, and
NSLocationAlwaysAndWhenInUseUsageDescription is shown only when the user
opts into background recording so the ride can continue with the screen off.

The recorded GPS trace is stored locally on device and is never transmitted
unless the user explicitly chooses to save the ride to their public profile.

Test credentials: reviewer@nabajk.app / NaBajk2026!
(Tap the small "Tester" button in the bottom-right of the welcome screen to
sign in with these credentials directly.)
```

---

## Play Store release notes (Android)

Use this in **Play Console → Releases → Release notes**.

### Slovenian

```
Popravki za snemanje vožnje:
• GPS na Android napravah zdaj uporablja natančen način (prej se je signal prikazoval slabše).
• Snemanje med zaklenjenim zaslonom ne vrže več podatkov stran (dodana je tipična obvestilna ikona).
• Splošno bolj zanesljivo sledenje razdalji in trajanju.
```

### English

```
Recording fixes:
• Android GPS now uses high-accuracy mode (signal previously read worse than reality).
• Locked-screen recording no longer drops points (persistent foreground notification added).
• Overall more reliable distance and duration tracking.
```

---

## Play Console — Data safety + permissions justification

When Google asks why you need `ACCESS_BACKGROUND_LOCATION` + `FOREGROUND_SERVICE_LOCATION`:

```
NaBajk records cycling routes on behalf of the user. Background location is
used only while the user has actively started a ride from inside the app, so
that the GPS trace continues to be recorded when the phone screen is off
during the ride. A persistent notification is displayed for the entire
duration of the foreground service so the user can see at any time that
recording is active. The recording stops as soon as the user taps Stop in
the app or in the persistent notification. No location data is sent to
servers unless the user explicitly chooses to upload the completed ride.
```

---

## Internal version-bump checklist

Before triggering `eas build`:

- [ ] Bump `app.json` `expo.ios.buildNumber` (currently `"9"`) → `"10"`
- [ ] `eas.json` has `autoIncrement: true` for Android, so `versionCode` is automatic
- [ ] Run `eas build --platform all --profile production`
- [ ] Test the `.aab` on a Pixel + a Samsung (different OEM Doze policies)
- [ ] Test the `.ipa` on TestFlight to confirm no iOS regression
- [ ] Submit via `eas submit -p ios` and Play Console upload

---

## What's NOT in this release

Phase 2 (SQLite-backed point persistence so app-kill mid-ride is recoverable) and Phase 3 (auto-pause, live notification timer) are deferred. See `tasks/todo.md` § "Record Ride / Climb — Deep Audit & Rebuild Plan" for the full roadmap.
