import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView }            from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as Sharing                from 'expo-sharing';
import * as FileSystem             from 'expo-file-system/legacy';
import FontAwesome                 from '@expo/vector-icons/FontAwesome';
import Colors                      from '@/constants/Colors';
import { useLanguage }             from '@/contexts/LanguageContext';
import { t }                       from '@/constants/i18n';
import { getRide, markUploaded, SavedRide } from '@/lib/rideStorage';
import { uploadRecordedRide }      from '@/repositories/routesRepo';
import { ShareOverlay, ShareOverlayHandle } from '@/components/record/ShareOverlay';

/**
 * The stored gpxPath is an absolute file URI; on iOS the app container path
 * changes across updates, so also try the same filename under the current
 * documentDirectory before giving up.
 */
async function resolveGpxPath(gpxPath: string): Promise<string | null> {
  try {
    const info = await FileSystem.getInfoAsync(gpxPath);
    if (info.exists) return gpxPath;
    const fileName = gpxPath.split('/').pop();
    if (fileName && FileSystem.documentDirectory) {
      const alt = `${FileSystem.documentDirectory}${fileName}`;
      const altInfo = await FileSystem.getInfoAsync(alt);
      if (altInfo.exists) return alt;
    }
  } catch { /* fall through to null */ }
  return null;
}

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

  const [ride, setRide]         = useState<SavedRide | null>(null);
  const [loaded, setLoaded]     = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) getRide(id).then(r => { setRide(r); setLoaded(true); });
  }, [id]);

  async function handleExportGpx() {
    if (!ride || exporting) return;
    setExporting(true);
    try {
      const path = await resolveGpxPath(ride.gpxPath);
      if (!path) {
        Alert.alert(
          t(language, 'error'),
          language === 'sl'
            ? 'GPX datoteka ni več na voljo na tej napravi.'
            : 'The GPX file is no longer available on this device.',
        );
        return;
      }
      await Sharing.shareAsync(path, {
        mimeType:    'application/gpx+xml',
        dialogTitle: ride.name,
      });
    } catch {
      Alert.alert(
        t(language, 'error'),
        language === 'sl' ? 'Izvoz GPX ni uspel.' : 'GPX export failed.',
      );
    } finally {
      setExporting(false);
    }
  }

  async function handleRetryUpload() {
    if (!ride || uploading) return;
    setUploading(true);
    try {
      const result = await uploadRecordedRide({
        rideName:        ride.name,
        regionKey:       ride.region,
        distanceMeters:  ride.distanceMeters,
        durationSeconds: ride.durationSeconds,
        elevationM:      ride.elevationGainM ?? 0,
        polyline:        ride.polylineEncoded,
        gpxPath:         ride.gpxPath,
        traffic:         ride.traffic,
        roadCondition:   ride.roadCondition,
        whyGood:         ride.whyGood,
      });
      if (result.error) throw new Error(result.error);
      await markUploaded(ride.id);
      setRide({ ...ride, uploaded: true });
    } catch {
      Alert.alert(
        t(language, 'error'),
        language === 'sl'
          ? 'Nalaganje ni uspelo. Preveri povezavo in poskusi znova.'
          : 'Upload failed. Check your connection and try again.',
      );
    } finally {
      setUploading(false);
    }
  }

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

        {/* second row — only for rides saved with full metrics */}
        {(ride.elevationGainM != null || ride.avgSpeedKmh != null) && (
          <View style={[styles.statsGrid, styles.statsGridSecond]}>
            {ride.elevationGainM != null && (
              <StatBox value={`${ride.elevationGainM} m`} label={language === 'sl' ? 'vzpon' : 'elevation'} />
            )}
            {ride.avgSpeedKmh != null && (
              <StatBox value={`${ride.avgSpeedKmh.toFixed(1)} km/h`} label={language === 'sl' ? 'povp. hitrost' : 'avg speed'} />
            )}
          </View>
        )}

        {/* actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => shareRef.current?.share()}>
            <FontAwesome name="share"    size={18} color={Colors.brandGreen} />
            <Text style={styles.actionBtnText}>{t(language, 'shareRide')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleExportGpx} disabled={exporting}>
            {exporting
              ? <ActivityIndicator size="small" color={Colors.brandGreen} />
              : <FontAwesome name="download" size={18} color={Colors.brandGreen} />}
            <Text style={styles.actionBtnText}>{t(language, 'exportGPX')}</Text>
          </TouchableOpacity>

          {/* upload status / retry */}
          {ride.uploaded ? (
            <View style={styles.uploadStatusRow}>
              <FontAwesome name="cloud" size={14} color={Colors.brandGreen} />
              <Text style={styles.uploadStatusText}>
                {language === 'sl' ? 'Objavljeno med potmi NaBajk' : 'Published to NaBajk routes'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.actionBtn} onPress={handleRetryUpload} disabled={uploading}>
              {uploading
                ? <ActivityIndicator size="small" color={Colors.brandGreen} />
                : <FontAwesome name="cloud-upload" size={18} color={Colors.brandGreen} />}
              <Text style={styles.actionBtnText}>
                {language === 'sl' ? 'Objavi med poti NaBajk' : 'Publish to NaBajk routes'}
              </Text>
            </TouchableOpacity>
          )}
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
  statsGridSecond: { marginTop: 8 },
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

  /* upload status */
  uploadStatusRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    padding:        10,
  },
  uploadStatusText: { color: Colors.textMuted, fontSize: 13 },
});
