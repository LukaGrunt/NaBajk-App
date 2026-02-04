# NaBajk Authentication Implementation

Complete authentication system with video background welcome screen, mock auth, and Supabase preparation.

## ✅ What Was Implemented

### 1. Authentication Context (`/contexts/AuthContext.tsx`)
- Full auth state management with React Context
- Mock sign-in methods for Google and Email
- AsyncStorage persistence for user email
- Push notification permission state tracking
- Clear TODO markers for Supabase integration

### 2. Supabase Client Stub (`/lib/supabase.ts`)
- Configured Supabase client ready for credentials
- TODO comments explaining exactly where to wire real auth
- Environment variables placeholder

### 3. Premium Auth UI Components

#### `/components/auth/VideoBackground.tsx`
- Full-screen looping video background
- Proper cover mode (no stretching/distortion)
- Dark overlay for text readability
- Graceful fallback to gradient if video missing

#### `/components/auth/GlassTile.tsx`
- Reusable glass morphism tile with BlurView
- Subtle brand accent
- Clean, premium styling

#### `/components/auth/LanguageToggle.tsx`
- SLO/ENG toggle
- Persists to AsyncStorage (`nb_language`)
- Matches brand styling

#### `/components/auth/AuthButton.tsx`
- Glass-style auth buttons
- Loading states
- Consistent sizing

#### `/components/auth/EmailSignInModal.tsx`
- Clean modal for email input
- Email validation
- Localized strings (SLO/ENG)
- Keyboard-aware

#### `/components/auth/PushPermissionModal.tsx`
- iOS/Android permission request
- Localized strings
- Stores permission state
- TODO for backend token registration

#### `/components/auth/PushPermissionGate.tsx`
- Shows push modal after sign-in
- Only asks once per user
- Automatic language detection

### 4. Auth Welcome Screen (`/app/auth-welcome.tsx`)
- Video background with fallback
- Logo on glass tile
- Large headline: "Gremo Na Bajk" / "Let's ride"
- Language toggle
- Google and Email sign-in buttons
- Subtle fade-in animations
- Responsive (no scroll on normal phones)

### 5. Updated Routing (`/app/index.tsx` + `app/_layout.tsx`)
- Auth gate: checks if user signed in
- Flow:
  1. Not signed in → `auth-welcome`
  2. Signed in but not onboarded → `welcome` (existing)
  3. Signed in and onboarded → `(tabs)` (main app)
- Wrapped app in AuthProvider
- Added PushPermissionGate

### 6. Settings Screen Updates (`/app/(tabs)/settings.tsx`)
- Account section showing user email
- Sign-out button
- Confirmation alert on sign-out

## 📦 Required Dependencies

Install these if not already present:

```bash
npx expo install expo-av
npx expo install expo-blur
npx expo install expo-notifications
npx expo install @supabase/supabase-js
npx expo install react-native-url-polyfill
```

## 🎥 Video Setup

1. Place your video file at: `/assets/video/welcome-placeholder.mp4`
2. Video specs:
   - Resolution: 1080p or 720p
   - Format: MP4 (H.264)
   - Duration: 10-30 seconds
   - Loop seamlessly
   - Keep under 10MB

See `/assets/video/README.md` for detailed requirements.

## 🔐 Supabase Integration (Next Steps)

### 1. Add Environment Variables

Create `.env` file:
```
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Wire Real Auth in AuthContext

Replace mock implementations in `/contexts/AuthContext.tsx`:

```typescript
import { supabase } from '@/lib/supabase';

// Google Sign-In
const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });
  if (error) throw error;
};

// Email Sign-In (Magic Link/OTP)
const signInWithEmail = async (email: string) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: 'nabajk://auth-callback',
    },
  });
  if (error) throw error;
};

// Sign Out
const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  // Clear local state...
};

// Listen to auth state changes
useEffect(() => {
  const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      setUser({ email: session.user.email! });
    } else {
      setUser(null);
    }
  });

  return () => {
    listener.subscription.unsubscribe();
  };
}, []);
```

### 3. Configure OAuth Providers in Supabase

- Go to Supabase Dashboard → Authentication → Providers
- Enable Google OAuth
- Add redirect URLs:
  - Development: `exp://localhost:8081/--/auth-callback`
  - Production: `nabajk://auth-callback`

### 4. Handle Deep Links

Update `app.json`:
```json
{
  "expo": {
    "scheme": "nabajk",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [{ "scheme": "nabajk" }],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

## 🔔 Push Notifications (Next Steps)

### 1. Test in Standalone Build

Push permissions don't work fully in Expo Go. Build standalone:
```bash
eas build --profile development --platform ios
```

### 2. Register Push Token with Backend

In `/components/auth/PushPermissionModal.tsx`, uncomment and implement:

```typescript
if (finalStatus === 'granted') {
  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // Send to your backend
  await fetch('your-backend/api/push-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.id,
      token,
    }),
  });
}
```

## 🧪 Testing the Auth Flow

### Mock Auth (Current)

1. Launch app → see auth-welcome screen
2. Tap "Prijava z Google" → signs in with mock email
3. Push notification modal appears (if not asked before)
4. Allow or deny permissions
5. App navigates to onboarding or main app
6. In Settings → see user email + sign-out button
7. Sign out → returns to auth-welcome

### With Real Supabase

1. User taps Google → OAuth flow in browser
2. Returns to app signed in
3. Email flow sends magic link to user's inbox
4. User clicks link → returns to app signed in

## 📝 TODO Markers

Search codebase for `TODO` to find:
- Supabase integration points
- Push notification backend registration
- Profile tab migration notes
- Video file instructions

## 🎨 Styling Notes

- All components match NaBajk brand (#00BC7C green, dark theme)
- Glass morphism used throughout
- Responsive design (tests for short screens)
- No scrolling on typical phones
- Subtle animations (fade, translate)

## 🚀 Current Flow

```
App Launch
    ↓
Check Auth State
    ↓
┌─────────────────┐
│ Not Signed In?  │ → auth-welcome → Sign In → Push Permissions
└─────────────────┘
    ↓ Signed In
┌──────────────────┐
│ Onboarding Done? │ → No → welcome (original onboarding)
└──────────────────┘
    ↓ Yes
Main App (tabs)
```

## 🔄 Next Steps

1. ✅ Add video file to `/assets/video/`
2. ⬜ Install required dependencies
3. ⬜ Set up Supabase project
4. ⬜ Add environment variables
5. ⬜ Wire real Supabase auth
6. ⬜ Configure OAuth providers
7. ⬜ Test standalone build for push notifications
8. ⬜ Set up backend for push token registration
9. ⬜ (Future) Move Account section to Profile tab in bottom nav

## 📂 File Structure

```
/app
  /_layout.tsx (wrapped in AuthProvider, PushPermissionGate)
  /index.tsx (auth gate + routing logic)
  /auth-welcome.tsx (new auth screen)
  /welcome.tsx (existing onboarding)
  /(tabs)/settings.tsx (updated with account section)

/components/auth
  /VideoBackground.tsx
  /GlassTile.tsx
  /LanguageToggle.tsx
  /AuthButton.tsx
  /EmailSignInModal.tsx
  /PushPermissionModal.tsx
  /PushPermissionGate.tsx

/contexts
  /AuthContext.tsx (new)

/lib
  /supabase.ts (new stub)

/assets/video
  /README.md
  /welcome-placeholder.mp4 (user needs to add)
```

## ⚠️ Important Notes

- App runs without video file (fallback to gradient)
- Mock auth works immediately for testing
- All Supabase integration is stubbed with clear TODOs
- Push permissions only fully work in standalone builds
- Language toggle only affects auth screens (for now)
- Sign-out clears all local auth state

---

**Status**: ✅ Fully implemented and ready for testing with mock auth. Ready for Supabase integration when credentials are available.
