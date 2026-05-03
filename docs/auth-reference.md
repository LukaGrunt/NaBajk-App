# NaBajk Auth — Complete Reference

> Written after Build 27 fixed auth (2026-03-12). Both Google Sign-In and magic link email now work in production.

---

## The One Thing That Kills Everything

**If auth is broken in a production build but works in dev → check EAS env vars first.**

```bash
eas env:list --environment production
```

If `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are missing, the app falls back to `placeholder.supabase.co` (hardcoded in `lib/supabase.ts`) and every single auth call fails with "Network request failed". This burned 5+ builds before it was caught.

**To recreate env vars:**
```bash
eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_URL \
  --value "https://zymssfxffkymkkfndssf.supabase.co" \
  --environment production --visibility plaintext

eas env:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY \
  --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5bXNzZnhmZmt5bWtrZm5kc3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3Njk2OTMsImV4cCI6MjA4NTM0NTY5M30.2TH7S-Zlq0WmxZP-NG_ViYSuvaFu-CxA2Vrtqm676yI" \
  --environment production --visibility plaintext
```

**CRITICAL**: Must use `--visibility plaintext`. Secret/sensitive vars are NOT inlined into the JS bundle — the app never reads them.

---

## Architecture Overview

```
User taps "Sign in with Google" or enters email
         │
         ▼
app/auth-welcome.tsx
  → calls signInWithGoogle() or signInWithEmail() from useAuth()
         │
         ▼
contexts/AuthContext.tsx
  → Google: GoogleSignin.signIn() → idToken → supabase.auth.signInWithIdToken()
  → Email:  supabase.auth.signInWithOtp() → sends magic link email
         │
         ▼ (magic link only)
User taps email link → deep link opens app → nabajk://auth/callback?code=...
         │
         ▼
contexts/AuthContext.tsx → handleDeepLink()
  → reads ?code= param → supabase.auth.exchangeCodeForSession(code)
         │
         ▼ (both flows)
supabase.auth.onAuthStateChange fires → setUser() → app re-renders → user is in
```

---

## File-by-File Breakdown

### `lib/supabase.ts`
```ts
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',  // ← fallback = doom
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',   // ← PKCE flow (magic link returns ?code=)
    },
  }
);
```

Key: `flowType: 'pkce'` — Supabase v2 sends magic links with `?code=` query param (not `#access_token=` hash). Must be pkce.

---

### `contexts/AuthContext.tsx`

**Google Sign-In config** (top of file, outside component):
```ts
GoogleSignin.configure({
  webClientId: '968402921869-0sot9ovufftpjqb9orjvsfnn8vnvspd2.apps.googleusercontent.com',
  iosClientId: '968402921869-6g035oclj9ipjno4i77aqcoamqdrg1am.apps.googleusercontent.com',
});
```

**Google flow:**
```ts
const userInfo = await GoogleSignin.signIn();
if (userInfo.type === 'cancelled') return;  // v16+: no throw on cancel
const { error } = await supabase.auth.signInWithIdToken({
  provider: 'google',
  token: userInfo.data.idToken,
});
```

**Magic link flow:**
```ts
await supabase.auth.signInWithOtp({
  email,
  options: { emailRedirectTo: 'nabajk://auth/callback' },
});
```

**Deep link handler (handles both flows):**
```ts
const handleDeepLink = async (url: string) => {
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');

  if (hashIndex !== -1) {
    // Implicit flow (legacy): #access_token=...
    const params = new URLSearchParams(url.substring(hashIndex + 1));
    const accessToken = params.get('access_token');
    if (accessToken) {
      await supabase.auth.setSession({ access_token, refresh_token });
    }
  } else if (queryIndex !== -1) {
    // PKCE flow (current): ?code=...
    const params = new URLSearchParams(url.substring(queryIndex + 1));
    const code = params.get('code');
    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
    }
  }
};
```

---

### `app.json` — URL Scheme + Google Plugin

```json
"scheme": "nabajk"
```
This registers `nabajk://` deep links. Without this, magic links can't open the app.

```json
["@react-native-google-signin/google-signin", {
  "iosUrlScheme": "com.googleusercontent.apps.968402921869-6g035oclj9ipjno4i77aqcoamqdrg1am"
}]
```
The `iosUrlScheme` is the **reversed** iOS client ID. This is what gets registered in Info.plist for Google OAuth callback.

---

### `eas.json`

```json
"production": {
  "autoIncrement": true,
  "channel": "production"
}
```

`appVersionSource: "remote"` in `cli` section means build numbers are managed by EAS, not app.json. Don't edit `buildNumber` in app.json manually — it's ignored for incrementing but still shown in the manifest.

---

## Google Cloud Console Setup

Project: **NaBajk** (linked to Apple Team 43359GLTZ9)

| Client Type | Client ID |
|-------------|-----------|
| Web (for idToken) | `968402921869-0sot9ovufftpjqb9orjvsfnn8vnvspd2.apps.googleusercontent.com` |
| iOS (bundle: com.nabajk.app) | `968402921869-6g035oclj9ipjno4i77aqcoamqdrg1am.apps.googleusercontent.com` |

The iOS client ID must be listed in **Supabase Dashboard → Authentication → Providers → Google → Authorized Client IDs**.

---

## Supabase Dashboard Setup

- **Project ref**: `zymssfxffkymkkfndssf`
- **URL**: `https://zymssfxffkymkkfndssf.supabase.co`
- **Google provider**: Enabled ✅
- **Skip nonce checks**: ON ✅ (required for native Google Sign-In)
- **Redirect URLs** (Authentication → URL Configuration):
  - `nabajk://auth/callback` ✅

---

## EAS / App Store Setup

| Field | Value |
|-------|-------|
| EAS Project ID | `df3fd1bb-6e93-4a90-ac6c-9f7a99d08250` |
| Bundle ID | `com.nabajk.app` |
| Apple ID | `ravnikar.luka@gmail.com` |
| Apple Team ID | `43359GLTZ9` |
| App Store Connect App ID | `6758962078` |

---

## Build Command

```bash
eas build --platform ios --profile production --auto-submit
```

Must be run **interactively in a terminal** — EAS will prompt for Apple ID login. Cannot be run non-interactively.

---

## Debugging Checklist

If auth breaks in a production build:

1. **Check EAS env vars first:**
   ```bash
   eas env:list --environment production
   ```
   Both `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` must be present as `plaintext`.

2. **Check the Supabase client fallback** (`lib/supabase.ts`):
   The `|| 'https://placeholder.supabase.co'` fallback is the tell. If the app hits this, nothing works.

3. **Google Sign-In "Prijava ni uspela" / error thrown**:
   - Is `userInfo.type === 'cancelled'` check present in `signInWithGoogle`? (v16 API — no throw on cancel)
   - Is the iOS client ID in Supabase Authorized Client IDs?
   - Is `skip nonce checks` ON in Supabase?

4. **Magic link "Network request failed"**:
   - Almost certainly EAS env vars missing (see step 1)
   - If env vars are present: check `flowType: 'pkce'` in `lib/supabase.ts`
   - Check `nabajk://auth/callback` is in Supabase Redirect URLs

5. **Magic link opens app but doesn't sign in**:
   - Check `handleDeepLink` has the `?code=` PKCE branch
   - Check `nabajk` scheme is in `app.json` and Info.plist
   - Check `app/auth/callback.tsx` exists (prevents 404 screen on cold start)

6. **Session not persisted across restarts**:
   - Check `persistSession: true` in supabase.ts
   - Check `storage: AsyncStorage` in supabase.ts
