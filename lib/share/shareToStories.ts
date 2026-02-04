/**
 * shareToStories – platform share helpers.
 *
 * react-native-share is a native module that only works after `expo prebuild`.
 * In Expo Go it won't resolve, so the module is lazy-loaded behind a try/catch.
 * Every public function returns a ShareResult so callers can decide what to do
 * when the native module is missing (auto-fallback to system share).
 */

import * as Sharing from 'expo-sharing';

// Lazy-load react-native-share (native, unavailable in Expo Go)
let RNShare: any = null;
try {
  RNShare = require('react-native-share').default;
} catch {}

export type ShareResult = 'success' | 'cancelled' | 'not_installed' | 'error';

// ── Instagram Stories ──────────────────────────────────────

export async function shareToInstagramStories(pngPath: string): Promise<ShareResult> {
  if (!RNShare) return 'not_installed';
  try {
    await RNShare.shareSingle({
      social:           'instagram-stories',
      backgroundImage:  pngPath,
      attributionURL:   'https://nabajk.si',
      appId:            process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
    });
    return 'success';
  } catch (e: any) {
    const msg = (e?.message ?? '').toLowerCase();
    if (msg.includes('cancel') || msg.includes('dismiss')) return 'cancelled';
    if (msg.includes('not installed') || msg.includes('not available')) return 'not_installed';
    return 'error';
  }
}

// ── Facebook Stories ───────────────────────────────────────

export async function shareToFacebookStories(pngPath: string): Promise<ShareResult> {
  if (!RNShare) return 'not_installed';
  try {
    await RNShare.shareSingle({
      social:           'facebook-stories',
      backgroundImage:  pngPath,
      attributionURL:   'https://nabajk.si',
      appId:            process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
    });
    return 'success';
  } catch (e: any) {
    const msg = (e?.message ?? '').toLowerCase();
    if (msg.includes('cancel') || msg.includes('dismiss')) return 'cancelled';
    if (msg.includes('not installed') || msg.includes('not available')) return 'not_installed';
    return 'error';
  }
}

// ── System share fallback ──────────────────────────────────

export async function shareFallback(pngPath: string): Promise<ShareResult> {
  try {
    await Sharing.shareAsync(pngPath, { mimeType: 'image/png' });
    return 'success';
  } catch {
    return 'error';
  }
}
