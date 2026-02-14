/**
 * ShareOverlaySheet – slide-up modal that lets the user choose where to
 * share the captured Story image.
 *
 * Share priority:
 *   1. Instagram Stories  (react-native-share, native)
 *   2. Facebook Stories   (react-native-share, native)
 *   3. More …             (expo-sharing system sheet)
 *
 * If the native module is missing (Expo Go) the IG / FB taps silently fall
 * back to the system sheet so the flow never dead-ends.
 */

import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet,
  TouchableOpacity, ActivityIndicator, Image, Platform,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  shareToInstagramStories,
  shareToFacebookStories,
  shareFallback,
  ShareResult,
} from '@/lib/share/shareToStories';

// ── props ──────────────────────────────────────────────────

interface ShareOverlaySheetProps {
  visible: boolean;
  pngPath: string | null;
  onClose: () => void;
}

// ── component ──────────────────────────────────────────────

export function ShareOverlaySheet({ visible, pngPath, onClose }: ShareOverlaySheetProps) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  /* ── attempt a share, with automatic fallback ──────────── */
  async function attempt(
    fn:       (path: string) => Promise<ShareResult>,
    isFallback = false,
  ) {
    if (!pngPath) return;
    setLoading(true);
    setError(null);

    const result = await fn(pngPath);

    if (result === 'not_installed' && !isFallback) {
      // native module missing → drop straight to system share
      await shareFallback(pngPath);
    } else if (result === 'success') {
      onClose();
    } else if (result === 'error') {
      setError('Could not share. Try "More …" instead.');
    }
    // 'cancelled' → do nothing, let user try again

    setLoading(false);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* dark backdrop – tap to dismiss */}
      <TouchableOpacity
        style={styles.backdrop}
        onPress={onClose}
        activeOpacity={1}
      />

      {/* sheet */}
      <View style={styles.sheet}>
        <View style={styles.handle} />

        {/* thumbnail + label */}
        {pngPath && (
          <View style={styles.thumbRow}>
            <Image source={{ uri: pngPath }} style={styles.thumb} />
            <View>
              <Text style={styles.thumbLabel}>Story preview</Text>
              <Text style={styles.thumbSub}>9 : 16  ·  ready to share</Text>
            </View>
          </View>
        )}

        {/* share buttons */}
        <ShareBtn
          icon="instagram"
          label="Instagram Stories"
          color="#E1306C"
          disabled={loading}
          onPress={() => attempt(shareToInstagramStories)}
        />
        <ShareBtn
          icon="facebook"
          label="Facebook Stories"
          color="#1877F2"
          disabled={loading}
          onPress={() => attempt(shareToFacebookStories)}
        />
        <ShareBtn
          icon="ellipsis-h"
          label="More …"
          color="#8A8A8F"
          disabled={loading}
          onPress={() => attempt(shareFallback, true)}
        />

        {/* feedback */}
        {loading && <ActivityIndicator color="#00BF76" style={styles.loader} />}
        {error   && <Text style={styles.errorText}>{error}</Text>}
      </View>
    </Modal>
  );
}

// ── ShareBtn ───────────────────────────────────────────────

// Proper type for FontAwesome icon names
type FAIconName = React.ComponentProps<typeof FontAwesome>['name'];

function ShareBtn({
  icon, label, color, disabled, onPress,
}: {
  icon:     FAIconName;
  label:    string;
  color:    string;
  disabled: boolean;
  onPress:  () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.shareBtn, disabled && styles.shareBtnDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={[styles.shareBtnIcon, { backgroundColor: color + '22' }]}>
        <FontAwesome name={icon} size={18} color={color} />
      </View>
      <Text style={styles.shareBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },

  sheet: {
    backgroundColor:      '#16161A',
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    paddingTop:           12,
    paddingBottom:        Platform.OS === 'ios' ? 40 : 24,
    paddingHorizontal:    20,
  },

  handle: {
    width:            40,
    height:           4,
    backgroundColor: '#2A2A2E',
    borderRadius:     2,
    alignSelf:        'center',
    marginBottom:     16,
  },

  /* thumbnail row */
  thumbRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
    marginBottom:  20,
  },
  thumb: {
    width:            54,
    height:           96,
    borderRadius:     8,
    backgroundColor: '#121214',
  },
  thumbLabel: { color: '#FAFAFA', fontSize: 14, fontWeight: '600' },
  thumbSub:   { color: '#8A8A8F', fontSize: 12, marginTop: 2 },

  /* share button row */
  shareBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             12,
    paddingVertical:  14,
    paddingHorizontal: 12,
    borderRadius:    14,
    backgroundColor: '#1A1A1D',
    marginBottom:    8,
  },
  shareBtnDisabled: { opacity: 0.4 },
  shareBtnIcon: {
    width:           40,
    height:          40,
    borderRadius:    12,
    alignItems:      'center',
    justifyContent:  'center',
  },
  shareBtnLabel: { color: '#FAFAFA', fontSize: 15, fontWeight: '500' },

  /* feedback */
  loader:    { marginTop: 12, alignSelf: 'center' },
  errorText: { color: '#FF6B35', fontSize: 13, textAlign: 'center', marginTop: 8 },
});
