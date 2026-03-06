/**
 * shareToStories – platform share helpers.
 *
 * Uses the same direct-import approach as StoryShareSheet (the working
 * ride-recording share). The lazy-require was silently returning null in
 * native builds, causing every Instagram/Facebook attempt to fall through
 * to the system share without opening the target app.
 */

import Share, { Social } from 'react-native-share';
import * as Sharing from 'expo-sharing';

const FB_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ?? '';

// Story canvas background (matches StoryOverlay B.bg)
const STORY_BG = '#0A0A0B';

export type ShareResult = 'success' | 'cancelled' | 'not_installed' | 'error';

// ── Instagram Stories ──────────────────────────────────────

export async function shareToInstagramStories(pngPath: string): Promise<ShareResult> {
  try {
    await Share.shareSingle({
      social:                Social.InstagramStories,
      appId:                 FB_APP_ID,
      backgroundImage:       pngPath,
      backgroundTopColor:    STORY_BG,
      backgroundBottomColor: STORY_BG,
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
  try {
    await Share.shareSingle({
      social:          Social.FacebookStories,
      appId:           FB_APP_ID,
      backgroundImage: pngPath,
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
