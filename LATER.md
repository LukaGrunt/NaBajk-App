# NaBajk – tasks blocked on developer accounts / production build

Everything here is either impossible in Expo Go or requires an account
that hasn't been created yet.  Nothing in this file needs code changes
*now* — it's a reference for when you're ready to ship.

---

## 1. Developer accounts (do these first — everything else depends on them)

- [ ] **Apple Developer** – $99 / year → <https://developer.apple.com>
- [ ] **Google Play Console** – $25 one-time → <https://play.google.com/console>
- [ ] Link EAS to both: `eas login` (already have an EAS project ID in app.json)

---

## 2. First real build

```bash
eas build -p ios      # requires Apple account
eas build -p android  # requires Google account
```

- [ ] Install the `.ipa` / `.aab` on a physical device
- [ ] Smoke-test the full flow before submitting to stores

---

## 3. Auth – replace mocks with real Supabase

`contexts/AuthContext.tsx` has three stubbed methods.  All three
need wiring to the Supabase client that's already configured in the
repo (`EXPO_PUBLIC_SUPABASE_URL` is in `.env`).

| Method | What to do | Supabase dashboard prerequisite |
|---|---|---|
| `signInWithGoogle` | `supabase.auth.signInWithOAuth({ provider: 'google' })` | Enable Google provider, paste Google OAuth client-ID + secret |
| `signInWithEmail` | `supabase.auth.signInWithOtp({ email })` | Enable Email provider; configure SMTP or use Supabase built-in |
| `signOut` | `supabase.auth.signOut()` | — |

- [ ] Replace the `AsyncStorage`-only session with Supabase's session listener (`supabase.auth.onAuthStateChange`)
- [ ] The existing `User` interface only has `email` — extend it if you need `id`, `display_name`, etc.

---

## 4. Push notifications – finish the wiring

The permission modal (`components/auth/PushPermissionModal.tsx`) is
built and asks the user.  The token-registration code is commented out
at **lines 55-59**.  Steps:

- [ ] Run `eas push:setup` (needs Apple account for APNs certificate)
- [ ] Create a Supabase table to store tokens:
  ```sql
  create table push_tokens (
    id           uuid generated always as identity primary key,
    user_id      uuid references auth.users(id) on delete cascade,
    token        text not null,
    platform     text check (platform in ('ios','android')),
    created_at   timestamptz default now()
  );
  ```
- [ ] Uncomment + finish the token block in `PushPermissionModal.tsx`:
  - `Notifications.getExpoPushTokenAsync()` → POST token + platform to Supabase
- [ ] Write a Supabase Edge Function (or use any backend) to send notifications via Expo Push API
- [ ] **Push does not work in Expo Go or on simulator** — test on physical device only

---

## 5. Facebook / Meta app – Stories share

The Facebook App ID is already in `.env` (`820735547692883`).
`react-native-share` is installed.  The native IG/FB Stories composer
only opens in a real build.  Before it will work end-to-end:

- [ ] Open Meta developer console → your app → **Settings → Basic**
- [ ] Add bundle ID `com.nabajk.app` under **iOS** app
- [ ] Add package name `com.nabajk.app` under **Android** app
- [ ] Check if Instagram / Facebook Stories permissions need **App Review** — if so, submit
- [ ] Do a dev build and test on device:
  ```bash
  eas build -p ios --profile development
  ```
- [ ] Tap Share → Instagram Stories on the ride-summary screen; verify the blue "Add to Story" composer opens

---

## 6. App Store & Play Store listing

- [ ] **Privacy policy** – write one and host it (e.g. a page on nabajk.si).  Both stores require a URL.
- [ ] **App name** – "NaBajk" (confirm final name)
- [ ] **Description** – write in English + Slovenian
- [ ] **Keywords** – cycling, route, ride, Slovenia, …
- [ ] **Screenshots** – minimum 3 per device size
  - iOS needs exact pixel sizes (6.5″ and 5.5″ at minimum)
  - Android needs at least one phone screenshot
- [ ] **Age rating** – likely 4+ / Everyone
- [ ] **Google Play Data Safety form** – declare what data you collect and why (location, email, push token)
- [ ] **Background location justification** – if §10 is enabled, Apple requires a clear privacy explanation in the submission (see §10 for details)
- [ ] Submit:
  ```bash
  eas submit -p ios
  eas submit -p android
  ```

---

## 7. Production environment hygiene

- [ ] `SUPABASE_SERVICE_ROLE_KEY` in `.env` is a **server-only** secret — make sure no client code imports it.  If it's only used in `scripts/`, that's fine.
- [ ] Set production secrets via EAS so they don't live in the repo: `eas env:push --scope project`
- [ ] Review **Row Level Security (RLS)** on every Supabase table (routes, group_rides, push_tokens, …)
- [ ] Make sure the Supabase URL in `.env` points to your production project (or use EAS env vars per build profile)

---

## 8. Crash reporting (recommended before first public release)

- [ ] Sign up for **Sentry** (free tier is fine to start)
- [ ] `npm install @sentry/react-native @sentry/expo`
- [ ] Init in `app/_layout.tsx` before the app renders
- [ ] Wrap the default export: `export default Sentry.wrap(RootLayout)`
- [ ] Errors will show up in the Sentry dashboard automatically

---

## 9. Maps – migrate to MapLibre (free, no API keys)

A full migration plan already exists in the repo at
`.claude/plans/dapper-rolling-eclipse.md`.  Summary:

- [ ] `npm install @maplibre/maplibre-react-native`
- [ ] Rewrite `components/RouteMap.tsx` to use MapLibre + OpenFreeMap tiles
- [ ] MapLibre is native → needs prebuild, can't test in Expo Go
- [ ] Tile URL: `https://tiles.openfreemap.org/styles/liberty`

---

## 10. Background location (nice to have for longer rides)

Currently recording stops when the app goes to background (`AppState` listener in `lib/rideRecorder.ts`).  To keep recording in the background:

- [ ] Add to `app.json` → `ios.infoPlist`:
  ```json
  "UIBackgroundModes": ["location"]
  ```
- [ ] Add `NSLocationAlwaysAndWhenInUseUsageDescription` to infoPlist
- [ ] Change `expo-location` accuracy to `Location.Accuracy.BestForNavigation` when background mode is active
- [ ] Remove (or make conditional) the `AppState` stop-on-background listener
- [ ] Apple requires a clear justification in the App Store submission for always-on location — explain in the privacy description
