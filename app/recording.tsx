import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, Modal, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView }  from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import * as Location       from 'expo-location';
import AsyncStorage        from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import FontAwesome         from '@expo/vector-icons/FontAwesome';
import Colors              from '@/constants/Colors';
import { useLanguage }     from '@/contexts/LanguageContext';
import { t }               from '@/constants/i18n';
import { useRideRecorder } from '@/lib/rideRecorder';

const DISCLAIMER_KEY = 'nabajk_disclaimer_accepted';

// Ring expands from RING_BASE px to RING_SCALE_MAX × RING_BASE ≈ full screen width
const RING_BASE      = 50;
const RING_SCALE_MAX = 8;   // 50 × 8 = 400 px — fills most phone screens
const RING_DURATION  = 3500; // ms — slower, more cinematic
const RING_STAGGER   = RING_DURATION / 3; // even spacing between 3 rings

function pad2(n: number) { return n.toString().padStart(2, '0'); }

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

export default function RecordRideScreen() {
  const { language }                  = useLanguage();
  const router                        = useRouter();
  const params                        = useLocalSearchParams<{ isClimb?: string }>();
  const isClimb                       = params.isClimb === 'true';
  const { state, start, stop, reset } = useRideRecorder();

  const [phase, setPhase] = useState<'loading' | 'disclaimer' | 'ready' | 'permDenied'>('loading');

  // Sonar ring animation values
  const ring1Scale   = useSharedValue(1);
  const ring1Opacity = useSharedValue(0.0);
  const ring2Scale   = useSharedValue(1);
  const ring2Opacity = useSharedValue(0.0);
  const ring3Scale   = useSharedValue(1);
  const ring3Opacity = useSharedValue(0.0);

  // Stop button breathing glow
  const stopGlow = useSharedValue(0.3);

  // ── init: disclaimer → permission ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const accepted = await AsyncStorage.getItem(DISCLAIMER_KEY);
      if (accepted) await doPermCheck();
      else          setPhase('disclaimer');
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-start when ready + idle; recover from error state
  useEffect(() => {
    if (phase !== 'ready') return;
    if (state.status === 'idle') {
      start();
    } else if (state.status === 'error') {
      reset(); // → sets status to 'idle' → triggers this effect again → start()
    }
  }, [phase, state.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sonar + stop-glow animations (only while recording)
  useEffect(() => {
    if (state.status !== 'recording') return;

    const scaleSeq = withRepeat(
      withSequence(
        withTiming(RING_SCALE_MAX, { duration: RING_DURATION, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 0 }),
      ), -1, false
    );
    const opacitySeq = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 0 }),   // snap visible
        withTiming(0, { duration: RING_DURATION }),
      ), -1, false
    );

    ring1Scale.value   = scaleSeq;
    ring1Opacity.value = opacitySeq;
    ring2Scale.value   = withDelay(RING_STAGGER,     scaleSeq);
    ring2Opacity.value = withDelay(RING_STAGGER,     opacitySeq);
    ring3Scale.value   = withDelay(RING_STAGGER * 2, scaleSeq);
    ring3Opacity.value = withDelay(RING_STAGGER * 2, opacitySeq);

    stopGlow.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 }),
      ), -1, false
    );
  }, [state.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── helpers ───────────────────────────────────────────────────────────────

  async function acceptDisclaimer() {
    await AsyncStorage.setItem(DISCLAIMER_KEY, '1');
    await doPermCheck();
  }

  async function doPermCheck() {
    // Foreground (required)
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === 'undetermined') {
      const { status: s2 } = await Location.requestForegroundPermissionsAsync();
      if (s2 !== 'granted') { setPhase('permDenied'); return; }
    } else if (status !== 'granted') {
      setPhase('permDenied');
      return;
    }

    // Background (optional — recording works without it, just won't update while screen is off)
    const { status: bgStatus } = await Location.getBackgroundPermissionsAsync();
    if (bgStatus === 'undetermined') {
      await Location.requestBackgroundPermissionsAsync();
      // Result intentionally ignored — recording starts regardless
    }

    setPhase('ready');
  }

  function handleStop() {
    Alert.alert(
      t(language, 'recordConfirmStopTitle'),
      t(language, 'recordConfirmStopBody'),
      [
        { text: t(language, 'cancel'), style: 'cancel' },
        { text: t(language, 'recordConfirmStopBtn'), style: 'destructive', onPress: () => {
          stop();
          router.replace(isClimb ? '/ride-summary?isClimb=true' : '/ride-summary');
        }},
      ]
    );
  }

  function handleBack() {
    if (state.status === 'recording') {
      handleStop();
    } else {
      router.back();
    }
  }

  // ── animated styles ───────────────────────────────────────────────────────

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opacity.value,
    borderWidth: interpolate(ring1Scale.value, [1, RING_SCALE_MAX], [0.8, 5], Extrapolation.CLAMP),
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
    borderWidth: interpolate(ring2Scale.value, [1, RING_SCALE_MAX], [0.8, 5], Extrapolation.CLAMP),
  }));
  const ring3Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring3Scale.value }],
    opacity: ring3Opacity.value,
    borderWidth: interpolate(ring3Scale.value, [1, RING_SCALE_MAX], [0.8, 5], Extrapolation.CLAMP),
  }));
  const stopBtnAnimStyle = useAnimatedStyle(() => ({
    shadowOpacity: stopGlow.value,
  }));

  // ── derived values ────────────────────────────────────────────────────────

  const gpsColor =
    state.gpsStatus === 'good' ? Colors.brandGreen :
    state.gpsStatus === 'ok'   ? '#FB923C' :
    state.gpsStatus === 'poor' ? Colors.errorRed :
    Colors.textMuted;

  const gpsLabel =
    state.gpsStatus === 'good' ? t(language, 'recordGpsGood') :
    state.gpsStatus === 'ok'   ? t(language, 'recordGpsOk') :
    state.gpsStatus === 'poor' ? t(language, 'recordGpsPoor') :
    t(language, 'recordWaitingGPS');

  const distKm  = state.distanceMeters / 1000;
  const distStr = distKm.toFixed(2);
  const avgSpeed = state.elapsedSeconds >= 10 && state.distanceMeters > 0
    ? (distKm / (state.elapsedSeconds / 3600)).toFixed(1)
    : null;

  // ── disclaimer modal ──────────────────────────────────────────────────────

  const disclaimerModal = (
    <Modal visible={phase === 'disclaimer'} transparent animationType="fade" onRequestClose={() => {}}>
      <Pressable style={styles.disclaimerBackdrop} onPress={() => {}}>
        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>{t(language, 'recordDisclaimerTitle')}</Text>
          <Text style={styles.disclaimerBody}>{t(language, 'recordDisclaimer')}</Text>
          <Pressable style={styles.greenBtn} onPress={acceptDisclaimer}>
            <Text style={styles.greenBtnText}>{t(language, 'recordDisclaimerAccept')}</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );

  // ── permission denied ─────────────────────────────────────────────────────

  if (phase === 'permDenied') {
    return (
      <SafeAreaView style={styles.root}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <Text style={styles.permText}>{t(language, 'recordPermissionDenied')}</Text>
          <Pressable style={[styles.greenBtn, styles.retryMargin]} onPress={doPermCheck}>
            <Text style={styles.greenBtnText}>{t(language, 'recordPermissionRetry')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── loading / disclaimer / waiting for recording to start ─────────────────

  if (
    phase === 'loading' ||
    phase === 'disclaimer' ||
    (phase === 'ready' && state.status !== 'recording' && state.status !== 'stopped')
  ) {
    return (
      <SafeAreaView style={styles.root}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <ActivityIndicator color={Colors.brandGreen} size="large" />
        </View>
        {disclaimerModal}
      </SafeAreaView>
    );
  }

  // ── background-stopped banner ─────────────────────────────────────────────

  if (state.status === 'stopped') {
    return (
      <SafeAreaView style={styles.root}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <View style={styles.bgBanner}>
            <Text style={styles.bgBannerText}>{t(language, 'recordBackgroundWarning')}</Text>
            <View style={styles.bgBannerButtons}>
              <Pressable style={styles.bgSaveBtn} onPress={() => router.replace(isClimb ? '/ride-summary?isClimb=true' : '/ride-summary')}>
                <Text style={styles.bgSaveBtnText}>{t(language, 'recordBackgroundSave')}</Text>
              </Pressable>
              <Pressable style={styles.bgDiscardBtn} onPress={() => { reset(); router.replace('/(tabs)'); }}>
                <Text style={styles.bgDiscardBtnText}>{t(language, 'recordBackgroundDiscard')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── COCKPIT (recording) ───────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Zone 1 — GPS Sonar Beacon (full area above timer, rings clip here) */}
      <View style={styles.sonarZone}>

        {/* Back button — absolute overlay at top of zone */}
        <View style={styles.topBar}>
          <Pressable style={styles.backBtn} onPress={handleBack}>
            <FontAwesome name="chevron-left" size={14} color={Colors.textSecondary} />
            <Text style={styles.backBtnText}>{t(language, 'recordBack')}</Text>
          </Pressable>
        </View>

        {/* Expanding rings — centered at 50%/50% of zone, clipped by overflow:hidden */}
        <Animated.View style={[styles.sonarRing, { borderColor: gpsColor }, ring1Style]} pointerEvents="none" />
        <Animated.View style={[styles.sonarRing, { borderColor: gpsColor }, ring2Style]} pointerEvents="none" />
        <Animated.View style={[styles.sonarRing, { borderColor: gpsColor }, ring3Style]} pointerEvents="none" />

        {/* GPS labels — float above the rings */}
        <View style={styles.sonarCenter}>
          <Text style={styles.gpsSignalLabel}>{t(language, 'recordGpsSignalLabel')}</Text>
          <Text style={[styles.gpsStatusText, { color: gpsColor }]}>{gpsLabel}</Text>
        </View>

      </View>

      {/* Zone 2 — Timer */}
      <View style={styles.timerZone}>
        {isClimb && (
          <View style={styles.climbBadge}>
            <Text style={styles.climbBadgeText}>{t(language, 'recordClimbBadge')}</Text>
          </View>
        )}
        <Text style={styles.timerText}>{formatTime(state.elapsedSeconds)}</Text>
        <Text style={styles.timerLabel}>{t(language, 'recordDurationLabel')}</Text>
      </View>

      {/* Zone 3 — Stats Strip */}
      <View style={styles.statsStrip}>
        <View style={styles.statCell}>
          <Text style={styles.statValue}>{distStr}</Text>
          <Text style={styles.statUnit}>KM</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <Text style={styles.statValue}>{avgSpeed ?? '—'}</Text>
          <Text style={styles.statUnit}>KM/H</Text>
        </View>
      </View>

      {/* Zone 4 — Stop Button */}
      <View style={styles.stopZone}>
        <Animated.View style={[styles.stopBtnGlow, stopBtnAnimStyle]}>
          <Pressable
            style={({ pressed }) => [styles.stopBtn, pressed && styles.stopBtnPressed]}
            onPress={handleStop}
          >
            <Text style={styles.stopBtnText}>■  {t(language, 'recordStopBtnText').toUpperCase()}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  // ── Sonar Zone (full area above timer) ──
  sonarZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',         // clips rings at zone boundaries
  },

  // Back button — absolute within sonarZone
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingRight: 12,
  },
  backBtnText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // Rings — absolutely centered at 50%/50% of sonarZone
  sonarRing: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: RING_BASE,
    height: RING_BASE,
    marginTop: -RING_BASE / 2,
    marginLeft: -RING_BASE / 2,
    borderRadius: RING_BASE / 2,
    // borderWidth set dynamically via interpolate in useAnimatedStyle
  },

  // GPS labels — flex child, floats above rings via zIndex
  sonarCenter: {
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
  },
  gpsSignalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  gpsStatusText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // ── Climb Badge ──
  climbBadge: {
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF6B35',
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 8,
  },
  climbBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B35',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // ── Timer Zone ──
  timerZone: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  timerText: {
    fontSize: 80,
    fontWeight: '700',
    color: Colors.brandGreen,
    fontVariant: ['tabular-nums'],
    letterSpacing: -2,
  },
  timerLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 4,
  },

  // ── Stats Strip ──
  statsStrip: {
    flexDirection: 'row',
    marginHorizontal: 24,
    backgroundColor: Colors.surface1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    gap: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  statUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 14,
  },

  // ── Stop Zone ──
  stopZone: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 20,
  },
  stopBtnGlow: {
    borderRadius: 20,
    shadowColor: Colors.errorRed,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    shadowOpacity: 0.4,
    elevation: 12,
  },
  stopBtn: {
    backgroundColor: Colors.errorRed,
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtnPressed: {
    opacity: 0.85,
  },
  stopBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  // ── Disclaimer ──
  disclaimerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disclaimerCard: {
    backgroundColor: Colors.cardSurface,
    borderRadius: 16,
    padding: 24,
    width: '85%',
  },
  disclaimerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  disclaimerBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 10,
    lineHeight: 20,
  },

  // ── Green button ──
  greenBtn: {
    backgroundColor: Colors.brandGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  greenBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  retryMargin:  { width: '100%', maxWidth: 280 },

  // ── Permission denied ──
  permText: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22 },

  // ── Background-stopped banner ──
  bgBanner: {
    backgroundColor: Colors.cardSurface,
    borderRadius: 16,
    padding: 20,
    width: '90%',
  },
  bgBannerText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  bgBannerButtons: { flexDirection: 'row', gap: 12, marginTop: 16, justifyContent: 'center' },
  bgSaveBtn: { backgroundColor: Colors.brandGreen, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  bgSaveBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  bgDiscardBtn: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  bgDiscardBtnText: { color: Colors.textMuted, fontSize: 15 },
});
