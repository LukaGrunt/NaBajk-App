/**
 * StoryShareSheet — ride-recording share modal.
 *
 * Mirrors ShareOverlaySheet (group rides) exactly:
 * - ONE Animated.View for all content (per-button animated wrappers block
 *   iOS touches at the native layer before animation completes)
 * - Captures ShareCard on open, stores URI, passes to lib share functions
 * - Instagram + Facebook via shareToStories lib (same as group rides)
 * - System share fallback
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,  // used by backdropOp
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { captureRef } from 'react-native-view-shot';
import {
  shareToInstagramStories,
  shareToFacebookStories,
  shareFallback,
  ShareResult,
} from '@/lib/share/shareToStories';
import Colors from '@/constants/Colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';
import { ShareCard } from './ShareCard';

interface Props {
  visible:          boolean;
  onSkip:           () => void;
  rideName:         string;
  distanceKm:       string;
  durationSeconds:  number;
  points?:          Array<{ lat: number; lng: number }>;
  isClimb?:         boolean;
  elevationProfile?: number[];
  avgGradient?:     number;
  elevationM?:      number;
}

export function StoryShareSheet({
  visible,
  onSkip,
  rideName,
  distanceKm,
  durationSeconds,
  points,
  isClimb,
  elevationProfile,
  avgGradient,
  elevationM,
}: Props) {
  const { language } = useLanguage();
  const cardRef = useRef<View>(null);
  const [loading,      setLoading]      = useState(false);
  const [capturedUri,  setCapturedUri]  = useState<string | null>(null);

  // Backdrop fades independently; all content animates as one block
  const backdropOp = useSharedValue(0);
  // Content slides up — NO opacity animation (opacity:0 blocks iOS touches at native layer)
  const contentY   = useSharedValue(80);

  useEffect(() => {
    if (visible) {
      backdropOp.value = withTiming(1, { duration: 250 });
      contentY.value   = withSpring(0, { damping: 18, stiffness: 200 });

      // Capture after a short delay so the offscreen card has rendered
      const t = setTimeout(async () => {
        try {
          const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
          setCapturedUri(uri);
        } catch {}
      }, 1200);
      return () => clearTimeout(t);
    } else {
      backdropOp.value = withTiming(0, { duration: 180 });
      contentY.value   = 80;
      setCapturedUri(null);
      setLoading(false);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOp.value }));
  const contentStyle  = useAnimatedStyle(() => ({
    transform: [{ translateY: contentY.value }],
  }));

  async function attempt(fn: (path: string) => Promise<ShareResult>, isFallback = false) {
    if (!capturedUri) return;
    setLoading(true);
    try {
      const result = await fn(capturedUri);
      if ((result === 'not_installed' || result === 'error') && !isFallback) {
        await shareFallback(capturedUri);
      } else if (result === 'success') {
        onSkip();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      {/* Hidden share card — offscreen, captured on open */}
      <View style={styles.offscreen}>
        <ShareCard
          ref={cardRef}
          rideName={rideName}
          distanceKm={distanceKm}
          durationSeconds={durationSeconds}
          points={points}
          isClimb={isClimb}
          elevationProfile={elevationProfile}
          avgGradient={avgGradient}
          elevationM={elevationM}
        />
      </View>

      <View style={StyleSheet.absoluteFill}>
        {/* Backdrop */}
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
          pointerEvents="none"
        />

        {/* ONE animated block — avoids iOS touch-blocking from per-button Animated.Views */}
        <Animated.View style={[styles.content, contentStyle]}>

          {/* Thumbnail preview */}
          {capturedUri && (
            <View style={styles.previewRow}>
              <Image source={{ uri: capturedUri }} style={styles.thumb} resizeMode="cover" />
              <View>
                <Text style={styles.thumbLabel}>{t(language, 'shareYourRide')}</Text>
                <Text style={styles.thumbSub}>{t(language, 'shareReadyRatio')}</Text>
              </View>
            </View>
          )}

          <Text style={styles.header}>{t(language, 'shareOnHeader')}</Text>

          {/* Instagram */}
          <View style={styles.cardsRow}>
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => !loading && attempt(shareToInstagramStories)}
              disabled={loading || !capturedUri}
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

          {/* System share fallback */}
          <Pressable
            style={({ pressed }) => [styles.moreBtn, pressed && styles.cardPressed]}
            onPress={() => !loading && attempt(shareFallback, true)}
            disabled={loading || !capturedUri}
          >
            <View style={styles.moreIconBox}>
              {loading
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <FontAwesome name="share-alt" size={17} color="#FFFFFF" />
              }
            </View>
            <Text style={styles.moreBtnText}>{t(language, 'shareElsewhere')}</Text>
          </Pressable>

          {/* Skip */}
          <Pressable style={styles.skipBtn} onPress={onSkip}>
            <Text style={styles.skipText}>{t(language, 'skip')}</Text>
          </Pressable>

        </Animated.View>
      </View>
    </Modal>
  );
}

const CARD_SIZE = 145;

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    top:      -9999,
    left:     -9999,
  },
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
