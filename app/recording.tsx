import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView }  from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import * as Location       from 'expo-location';
import AsyncStorage        from '@react-native-async-storage/async-storage';
import Colors              from '@/constants/Colors';
import { useLanguage }     from '@/contexts/LanguageContext';
import { t }               from '@/constants/i18n';
import { useRideRecorder } from '@/lib/rideRecorder';

const DISCLAIMER_KEY = 'nabajk_disclaimer_accepted';

// ── helpers ───────────────────────────────────────────────

function pad2(n: number) { return n.toString().padStart(2, '0'); }

// ── screen ────────────────────────────────────────────────

export default function RecordRideScreen() {
  const { language }                  = useLanguage();
  const router                        = useRouter();
  const { state, start, stop, reset } = useRideRecorder();

  const [phase, setPhase] = useState<'loading' | 'disclaimer' | 'ready' | 'permDenied'>('loading');

  /* ── init: disclaimer → permission ─────────────────── */
  useEffect(() => {
    (async () => {
      const accepted = await AsyncStorage.getItem(DISCLAIMER_KEY);
      if (accepted) await doPermCheck();
      else          setPhase('disclaimer');
    })();
  }, []);                                            // eslint-disable-line react-hooks/exhaustive-deps

  async function acceptDisclaimer() {
    await AsyncStorage.setItem(DISCLAIMER_KEY, '1');
    await doPermCheck();
  }

  async function doPermCheck() {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === 'granted') { setPhase('ready'); return; }
    if (status === 'undetermined') {
      const { status: s2 } = await Location.requestForegroundPermissionsAsync();
      setPhase(s2 === 'granted' ? 'ready' : 'permDenied');
      return;
    }
    setPhase('permDenied');
  }

  /* ── handlers ──────────────────────────────────────── */
  function handleStop() {
    stop();
    router.push('/ride-summary');
  }

  /* ── sub-renders ───────────────────────────────────── */

  // Disclaimer modal (bottom-sheet card on dark backdrop)
  const disclaimerModal = (
    <Modal visible={phase === 'disclaimer'} transparent animationType="fade" onRequestClose={() => {}}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => {}}>
        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>{t(language, 'recordDisclaimerTitle')}</Text>
          <Text style={styles.disclaimerBody}>{t(language, 'recordDisclaimer')}</Text>
          <TouchableOpacity style={styles.greenBtn} onPress={acceptDisclaimer}>
            <Text style={styles.greenBtnText}>{t(language, 'recordDisclaimerAccept')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Permission denied
  if (phase === 'permDenied') {
    return (
      <SafeAreaView style={styles.root}>
        <Stack.Screen options={headerOpts(language)} />
        <View style={styles.center}>
          <Text style={styles.permText}>{t(language, 'recordPermissionDenied')}</Text>
          <TouchableOpacity style={[styles.greenBtn, styles.retryMargin]} onPress={doPermCheck}>
            <Text style={styles.greenBtnText}>{t(language, 'recordPermissionRetry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Loading / disclaimer (show disclaimer modal on top of dark background)
  if (phase === 'loading' || phase === 'disclaimer') {
    return (
      <SafeAreaView style={styles.root}>
        <Stack.Screen options={headerOpts(language)} />
        <View style={styles.center}>
          {phase === 'loading' && <ActivityIndicator color={Colors.brandGreen} />}
        </View>
        {disclaimerModal}
      </SafeAreaView>
    );
  }

  /* phase === 'ready' — show recorder UI based on singleton state */

  // ── idle ──
  if (state.status === 'idle') {
    return (
      <SafeAreaView style={styles.root}>
        <Stack.Screen options={headerOpts(language)} />
        <View style={styles.center}>
          <TouchableOpacity style={styles.startBtn} onPress={start}>
            <Text style={styles.startBtnText}>{t(language, 'recordStart')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── recording ──
  if (state.status === 'recording') {
    const gpsColor =
      state.gpsStatus === 'good' ? Colors.brandGreen :
      state.gpsStatus === 'ok'   ? '#FB923C'         :
      state.gpsStatus === 'poor' ? Colors.errorRed   :
                                   Colors.textMuted;  // waiting

    const min = Math.floor(state.elapsedSeconds / 60);
    const sec = state.elapsedSeconds % 60;
    const distStr = state.distanceMeters >= 1000
      ? `${(state.distanceMeters / 1000).toFixed(2)} km`
      : `${Math.round(state.distanceMeters)} m`;

    return (
      <SafeAreaView style={styles.root}>
        <Stack.Screen options={{ ...headerOpts(language), headerLeft: () => null, gestureEnabled: false }} />
        <View style={styles.center}>
          {/* GPS status */}
          <View style={styles.gpsRow}>
            <View style={[styles.gpsDot, { backgroundColor: gpsColor }]} />
            <Text style={[styles.gpsLabel, { color: gpsColor }]}>
              {state.gpsStatus === 'waiting'
                ? t(language, 'recordWaitingGPS')
                : state.gpsStatus.toUpperCase()}
            </Text>
          </View>

          {/* elapsed — large */}
          <Text style={styles.elapsedTime}>{`${min}:${pad2(sec)}`}</Text>
          <Text style={styles.elapsedLabel}>{t(language, 'recordElapsed')}</Text>

          {/* distance */}
          <Text style={styles.distText}>{distStr}</Text>
          <Text style={styles.distLabel}>{t(language, 'recordDistance')}</Text>

          {/* foreground notice */}
          <Text style={styles.foregroundNotice}>{t(language, 'recordForegroundOnly')}</Text>

          {/* stop */}
          <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
            <Text style={styles.stopBtnText}>{t(language, 'recordStop')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── stopped (background) — Save / Discard banner ──
  return (
    <SafeAreaView style={styles.root}>
      <Stack.Screen options={headerOpts(language)} />
      <View style={styles.center}>
        <View style={styles.bgBanner}>
          <Text style={styles.bgBannerText}>{t(language, 'recordBackgroundWarning')}</Text>
          <View style={styles.bgBannerButtons}>
            <TouchableOpacity style={styles.bgSaveBtn} onPress={() => router.push('/ride-summary')}>
              <Text style={styles.bgSaveBtnText}>{t(language, 'recordBackgroundSave')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bgDiscardBtn} onPress={() => reset()}>
              <Text style={styles.bgDiscardBtnText}>{t(language, 'recordBackgroundDiscard')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ── shared header options ─────────────────────────────────

function headerOpts(language: Parameters<typeof t>[0]) {
  return {
    title:           t(language, 'recordTitle'),
    headerStyle:     { backgroundColor: Colors.background },
    headerTintColor: Colors.textPrimary,
  };
}

// ── styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  /* disclaimer */
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  disclaimerCard: {
    backgroundColor: Colors.cardSurface,
    borderRadius:    16,
    padding:         24,
    width:           '85%',
  },
  disclaimerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  disclaimerBody: {
    fontSize:   14,
    color:      Colors.textSecondary,
    marginTop:  10,
    lineHeight: 20,
  },

  /* shared green button */
  greenBtn: {
    backgroundColor: Colors.brandGreen,
    borderRadius:    12,
    paddingVertical: 14,
    alignItems:      'center',
    marginTop:       20,
  },
  greenBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  retryMargin:  { width: '100%', maxWidth: 280 },

  /* permission denied */
  permText: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22 },

  /* idle – start button */
  startBtn: {
    backgroundColor: Colors.brandGreen,
    width:           280,
    height:          56,
    borderRadius:    28,
    alignItems:      'center',
    justifyContent:  'center',
  },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  /* recording */
  gpsRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 28 },
  gpsDot:  { width: 10, height: 10, borderRadius: 5 },
  gpsLabel: { fontSize: 14, fontWeight: '600' },

  elapsedTime:  { fontSize: 72, fontWeight: '700', color: Colors.textPrimary },
  elapsedLabel: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },

  distText:  { fontSize: 24, color: Colors.textSecondary, fontWeight: '600', marginTop: 20 },
  distLabel: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },

  foregroundNotice: { fontSize: 12, color: Colors.textMuted, marginTop: 36 },

  stopBtn: {
    borderWidth:    2,
    borderColor:    Colors.errorRed,
    width:          280,
    height:         56,
    borderRadius:   28,
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      40,
  },
  stopBtnText: { color: Colors.errorRed, fontSize: 18, fontWeight: '700' },

  /* background-stop banner */
  bgBanner: {
    backgroundColor: Colors.cardSurface,
    borderRadius:    16,
    padding:         20,
    width:           '90%',
  },
  bgBannerText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  bgBannerButtons: { flexDirection: 'row', gap: 12, marginTop: 16, justifyContent: 'center' },
  bgSaveBtn: { backgroundColor: Colors.brandGreen, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  bgSaveBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  bgDiscardBtn: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  bgDiscardBtnText: { color: Colors.textMuted, fontSize: 15 },
});
