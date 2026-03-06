/**
 * ShareOverlaySheet – centered floating modal for sharing a group ride Story.
 *
 * Animation: backdrop fades in, entire content block slides up as ONE unit.
 * Per-button Animated.View wrappers are intentionally avoided — Reanimated's
 * opacity:0 start value blocks touches on iOS at the native layer even before
 * the animation completes, making every wrapped button unresponsive.
 */

import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, StyleSheet,
  Pressable, ActivityIndicator, Image,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  shareToInstagramStories,
  shareToFacebookStories,
  shareFallback,
  ShareResult,
} from '@/lib/share/shareToStories';
import { t, Language } from '@/constants/i18n';

interface ShareOverlaySheetProps {
  visible:  boolean;
  pngPath:  string | null;
  language: Language;
  onClose:  () => void;
}

export function ShareOverlaySheet({ visible, pngPath, language, onClose }: ShareOverlaySheetProps) {
  const [loading, setLoading] = useState(false);

  // Backdrop fades in independently
  const backdropOp = useSharedValue(0);
  // Content slides up — NO opacity animation (opacity:0 blocks iOS touches at native layer)
  const contentY  = useSharedValue(80);

  useEffect(() => {
    if (visible) {
      backdropOp.value = withTiming(1, { duration: 250 });
      contentY.value   = withSpring(0, { damping: 18, stiffness: 200 });
    } else {
      backdropOp.value = withTiming(0, { duration: 180 });
      contentY.value   = 80;
      setLoading(false); // always reset so re-open is clean
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOp.value }));
  const contentStyle  = useAnimatedStyle(() => ({
    transform: [{ translateY: contentY.value }],
  }));

  async function attempt(fn: (path: string) => Promise<ShareResult>, isFallback = false) {
    if (!pngPath) return;
    setLoading(true);
    try {
      const result = await fn(pngPath);
      if ((result === 'not_installed' || result === 'error') && !isFallback) {
        // native module unavailable or threw unexpectedly → open system share
        await shareFallback(pngPath);
      } else if (result === 'success') {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={StyleSheet.absoluteFill}>

        {/* Backdrop — pointerEvents="none" so it never intercepts touches */}
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
          pointerEvents="none"
        />

        {/* ONE animated wrapper for all content — no per-button Animated.Views */}
        <Animated.View style={[styles.content, contentStyle]}>

          {/* Story thumbnail preview */}
          {pngPath && (
            <View style={styles.previewRow}>
              <Image source={{ uri: pngPath }} style={styles.thumb} resizeMode="cover" />
              <View>
                <Text style={styles.thumbLabel}>{t(language, 'shareStoryPreview')}</Text>
                <Text style={styles.thumbSub}>9 : 16  ·  {t(language, 'shareReadyLabel')}</Text>
              </View>
            </View>
          )}

          <Text style={styles.header}>{t(language, 'shareRide')}</Text>

          {/* Instagram */}
          <View style={styles.cardsRow}>
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => !loading && attempt(shareToInstagramStories)}
              disabled={loading}
            >
              <LinearGradient
                colors={['#F58529', '#DD2A7B', '#8134AF', '#515BD4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
              />
              <FontAwesome name="instagram" size={38} color="#FFFFFF" style={styles.cardIcon} />
              <Text style={styles.cardTitle}>Instagram</Text>
              <Text style={styles.cardSub}>Stories</Text>
            </Pressable>
          </View>

          {/* System share */}
          <Pressable
            style={({ pressed }) => [styles.moreBtn, pressed && styles.cardPressed]}
            onPress={() => !loading && attempt(shareFallback, true)}
            disabled={loading}
          >
            <View style={styles.moreIconBox}>
              {loading
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <FontAwesome name="share-alt" size={17} color="#FFFFFF" />
              }
            </View>
            <Text style={styles.moreBtnText}>{t(language, 'shareForward')}</Text>
          </Pressable>

          {/* Skip */}
          <Pressable style={styles.skipBtn} onPress={onClose}>
            <Text style={styles.skipText}>{t(language, 'skip')}</Text>
          </Pressable>

        </Animated.View>
      </View>
    </Modal>
  );
}

const CARD_SIZE = 145;

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.82)',
  },

  content: {
    flex:              1,
    justifyContent:    'center',
    alignItems:        'center',
    paddingHorizontal: 24,
  },

  previewRow: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             12,
    marginBottom:    24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius:    14,
    padding:         12,
    width:           '100%',
  },
  thumb: {
    width:           54,
    height:          96,
    borderRadius:    8,
    backgroundColor: '#121214',
  },
  thumbLabel: { color: '#FAFAFA', fontSize: 14, fontWeight: '600' },
  thumbSub:   { color: '#8A8A8F', fontSize: 12, marginTop: 2 },

  header: {
    fontSize:     22,
    fontWeight:   '700',
    color:        '#FAFAFA',
    marginBottom: 24,
  },

  cardsRow: {
    flexDirection: 'row',
    gap:           16,
    marginBottom:  16,
  },
  card: {
    width:          CARD_SIZE,
    height:         CARD_SIZE,
    borderRadius:   22,
    alignItems:     'center',
    justifyContent: 'center',
    overflow:       'hidden',
  },
  cardFB:      { backgroundColor: '#1877F2' },
  cardPressed: { opacity: 0.82 },
  cardIcon:    { marginBottom: 8 },
  cardTitle: {
    fontSize:     16,
    fontWeight:   '700',
    color:        '#FFFFFF',
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 12,
    color:    'rgba(255,255,255,0.70)',
  },

  moreBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
    backgroundColor:   'rgba(255,255,255,0.08)',
    borderRadius:      16,
    paddingVertical:   14,
    paddingHorizontal: 16,
    marginBottom:      8,
    width:             '100%',
  },
  moreIconBox: {
    width:           40,
    height:          40,
    borderRadius:    10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  moreBtnText: {
    color:      '#FAFAFA',
    fontSize:   15,
    fontWeight: '500',
    flex:        1,
  },

  skipBtn: {
    marginTop:         16,
    paddingVertical:   12,
    paddingHorizontal: 32,
  },
  skipText: {
    fontSize:   16,
    color:      '#8A8A8F',
    fontWeight: '500',
  },
});
