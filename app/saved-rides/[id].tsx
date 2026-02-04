import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView }            from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as Sharing                from 'expo-sharing';
import FontAwesome                 from '@expo/vector-icons/FontAwesome';
import Colors                      from '@/constants/Colors';
import { useLanguage }             from '@/contexts/LanguageContext';
import { t }                       from '@/constants/i18n';
import { getRide, SavedRide }      from '@/lib/rideStorage';
import { ShareOverlay, ShareOverlayHandle } from '@/components/record/ShareOverlay';

// ── helpers ───────────────────────────────────────────────

function formatDist(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function formatDur(s: number) {
  const min = Math.floor(s / 60);
  if (min >= 60) {
    const h = Math.floor(min / 60);
    return `${h}h ${min % 60}m`;
  }
  return `${min}m`;
}

function capitalise(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ── screen ────────────────────────────────────────────────

export default function RideDetailScreen() {
  const { language } = useLanguage();
  const { id }       = useLocalSearchParams<{ id: string }>();
  const shareRef     = useRef<ShareOverlayHandle>(null);

  const [ride, setRide]     = useState<SavedRide | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (id) getRide(id).then(r => { setRide(r); setLoaded(true); });
  }, [id]);

  /* ── loading / missing ──────────────────────────── */
  if (!loaded) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}><ActivityIndicator color={Colors.brandGreen} /></View>
      </SafeAreaView>
    );
  }
  if (!ride) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}><Text style={styles.missingText}>—</Text></View>
      </SafeAreaView>
    );
  }

  /* ── detail ─────────────────────────────────────── */
  return (
    <SafeAreaView style={styles.root}>
      <Stack.Screen options={{
        title:           ride.name,
        headerStyle:     { backgroundColor: Colors.background },
        headerTintColor: Colors.textPrimary,
      }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner}>

        {/* route preview card */}
        <View style={styles.previewWrap}>
          <ShareOverlay
            ref={shareRef}
            polyline={ride.polylineEncoded}
            distanceMeters={ride.distanceMeters}
            durationSeconds={ride.durationSeconds}
          />
        </View>

        {/* stats grid */}
        <View style={styles.statsGrid}>
          <StatBox value={formatDist(ride.distanceMeters)} label={language === 'sl' ? 'razdalja' : 'distance'} />
          <StatBox value={formatDur(ride.durationSeconds)} label={language === 'sl' ? 'čas'      : 'duration'} />
          <StatBox value={capitalise(ride.region)}         label={language === 'sl' ? 'regija'   : 'region'}   />
        </View>

        {/* actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => shareRef.current?.share()}>
            <FontAwesome name="share"    size={18} color={Colors.brandGreen} />
            <Text style={styles.actionBtnText}>{t(language, 'shareRide')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={async () => {
              try {
                await Sharing.shareAsync(ride.gpxPath, {
                  mimeType:    'application/gpx+xml',
                  dialogTitle: ride.name,
                });
              } catch { /* ignore */ }
            }}
          >
            <FontAwesome name="download" size={18} color={Colors.brandGreen} />
            <Text style={styles.actionBtnText}>{t(language, 'exportGPX')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── StatBox ───────────────────────────────────────────────

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: Colors.background },
  scroll:      { flex: 1 },
  scrollInner: { padding: 20, alignItems: 'center' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  missingText: { color: Colors.textMuted, fontSize: 24 },

  /* preview */
  previewWrap: { alignItems: 'center', marginBottom: 24 },

  /* stats */
  statsGrid: { flexDirection: 'row', width: '100%', gap: 8 },
  statBox: {
    flex:            1,
    backgroundColor: Colors.cardSurface,
    borderRadius:    12,
    padding:         14,
    alignItems:      'center',
  },
  statValue: { color: Colors.textPrimary, fontSize: 18, fontWeight: '600' },
  statLabel: { color: Colors.textMuted,   fontSize: 11, marginTop: 4 },

  /* action buttons */
  actions: { width: '100%', marginTop: 24, gap: 12 },
  actionBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             10,
    backgroundColor: Colors.cardSurface,
    borderRadius:    14,
    padding:         14,
  },
  actionBtnText: { color: Colors.brandGreen, fontSize: 15, fontWeight: '600' },
});
