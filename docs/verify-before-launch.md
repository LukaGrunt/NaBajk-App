# Verify Before Launch — NaBajk Android

Checklist of things to verify before every major Android release.

---

## 1. Android Google Sign-In

**Why this breaks:** Google Play re-signs the APK with their own App Signing key (different from the EAS upload key). Google Sign-In on Android validates the installed app's signing certificate SHA-1 against what's registered in Google Cloud Console. If the Play signing key SHA-1 isn't there, sign-in silently fails.

**How to check it's set up:**
- Google Cloud Console → NaBajk project → APIs & Services → Credentials
- Should have an **Android** OAuth client with package `com.nabajk.app` and the Play SHA-1

**How to fix if broken:**
1. Play Console → NaBajk → Test and release → **Application integrity** → scroll down to "Application signature key certificate" → copy the **SHA-1**
2. Google Cloud Console → NaBajk project → APIs & Services → Credentials → **+ Create Credentials → OAuth 2.0 Client ID**
3. Type: Android, Package: `com.nabajk.app`, SHA-1: (from step 1)
4. Save — no rebuild needed, takes effect within minutes

**Play App Signing SHA-1 (registered 2026-03-20):**
```
D4:E4:7E:B2:52:C3:48:70:36:2E:D2:AB:19:6F:E7:09:CF:A4:04:BF
```

---

## 2. OAuth Consent Screen (before going fully public)

- Google Cloud Console → NaBajk → APIs & Services → OAuth consent screen
- Currently in "Testing" mode — only added test users can sign in with Google
- Before production launch: click **Publish App** to make it available to all users
- Google may require a verification review if sensitive scopes are used

---

## 3. EAS Environment Variables

Run before every build:
```bash
eas env:list --environment production
```
Both must be present as **plaintext** visibility:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

If missing, the app silently falls back to `placeholder.supabase.co` and all auth fails.

---

## 4. Account Deletion URL (Google Play requirement)

- Play Console → NaBajk → Policy and programs → App content → Data safety
- "URL for account deletion" must be filled in: `https://nabajk.si/delete-account`
- Required for all apps that allow account creation

---

## 5. versionCode

- `autoIncrement: true` in `eas.json` handles this automatically
- Google Play does not allow reusing a versionCode across any track (internal, closed, production)
- Check current versionCode: EAS dashboard → latest Android build → `appBuildVersion`
