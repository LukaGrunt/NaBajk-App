import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView }  from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome         from '@expo/vector-icons/FontAwesome';
import Colors              from '@/constants/Colors';
import { useLanguage }     from '@/contexts/LanguageContext';
import { t }               from '@/constants/i18n';
import { getPoints, getState, reset } from '@/lib/rideRecorder';
import { correctElevations }          from '@/lib/elevationCorrection';
import { encodePolyline }             from '@/utils/polyline';
import { generateAndSaveGPX }         from '@/lib/gpxGenerator';
import { saveRide, markUploaded }     from '@/lib/rideStorage';
import { uploadRecordedRide, computeElevationProfileFromPoints, calcElevationGainFromPoints } from '@/repositories/routesRepo';
import { StoryShareSheet }            from '@/components/share/StoryShareSheet';
import { GradientProfile }            from '@/components/climbs/GradientProfile';

// ── constants ─────────────────────────────────────────────

const REGIONS = [
  { key: 'gorenjska',          label: 'Gorenjska' },
  { key: 'dolenjska',          label: 'Dolenjska' },
  { key: 'primorska',          label: 'Primorska' },
  { key: 'stajerska',          label: 'Štajerska' },
  { key: 'prekmurje',          label: 'Prekmurje' },
  { key: 'osrednjaSlovenija',  label: 'Osrednja SLO' },
];

function pad2(n: number) { return n.toString().padStart(2, '0'); }

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

// ── screen ────────────────────────────────────────────────

export default function RideSummaryScreen() {
  const { language } = useLanguage();
  const router       = useRouter();
  const params       = useLocalSearchParams<{ isClimb?: string }>();
  const isClimb      = params.isClimb === 'true';

  // Capture recorded data once on mount — immune to later reset()
  const [points]  = useState(() => [...getPoints()]);
  const [distM]   = useState(() => getState().distanceMeters);
  const [durSec]  = useState(() => getState().elapsedSeconds);

  const [name,          setName]          = useState('');
  const [region,        setRegion]        = useState('gorenjska');
  const [traffic,       setTraffic]       = useState('');
  const [roadCondition, setRoadCondition] = useState('');
  const [whyGood,       setWhyGood]       = useState('');
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [showShare,     setShowShare]     = useState(false);
  const [savedName,     setSavedName]     = useState('');

  // DEM elevation correction — replaces noisy GPS altitude on mount
  const [correctedPoints,    setCorrectedPoints]    = useState<typeof points | null>(null);
  const [elevationLoading,   setElevationLoading]   = useState(true);

  useEffect(() => {
    correctElevations(points).then(pts => {
      setCorrectedPoints(pts);
      setElevationLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Use DEM-corrected points for elevation stats; fall back to raw GPS until ready
  const activePoints = correctedPoints ?? points;

  const polyline = useMemo(() => {
    if (points.length < 2) return '';
    return encodePolyline(points.map(p => ({ lat: p.lat, lng: p.lng })));
  }, [points]);

  const distKmNum = distM / 1000;

  const elevationProfile = useMemo(() => {
    if (!isClimb || activePoints.length < 2 || distKmNum < 0.1) return undefined;
    return computeElevationProfileFromPoints(activePoints, distKmNum);
  }, [isClimb, activePoints, distKmNum]);

  const elevationM = useMemo(() => {
    if (activePoints.length < 2) return undefined;
    return calcElevationGainFromPoints(activePoints);
  }, [activePoints]);

  const distKm   = distKmNum.toFixed(2);
  const avgSpeed = durSec >= 10 && distM > 0
    ? ((distM / 1000) / (durSec / 3600)).toFixed(1)
    : null;
  const isShort  = distM < 500 || durSec < 60;

  // ── save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    try {
      const rideName = name.trim() || `NaBajk ${new Date().toLocaleDateString('sl-SI')}`;
      const gpxPath  = await generateAndSaveGPX(points, rideName);
      const id       = Date.now().toString(36) + Math.random().toString(36).slice(2);

      await saveRide({
        id,
        createdAt:       new Date().toISOString(),
        name:            rideName,
        region,
        durationSeconds: durSec,
        distanceMeters:  distM,
        polylineEncoded: polyline,
        pointsCount:     points.length,
        gpxPath,
        traffic:       traffic.trim() || undefined,
        roadCondition: roadCondition.trim() || undefined,
        whyGood:       whyGood.trim() || undefined,
      });

      // Upload to public routes (non-blocking — local save already done)
      uploadRecordedRide({
        points:          points,
        rideName,
        regionKey:       region,
        distanceMeters:  distM,
        durationSeconds: durSec,
        polyline,
        gpxPath,
        traffic:       traffic.trim()       || undefined,
        roadCondition: roadCondition.trim() || undefined,
        whyGood:       whyGood.trim()       || undefined,
      })
        .then(result => { if (!result.error) markUploaded(id); })
        .catch(err => console.error('Route upload failed:', err));

      reset();
      setSavedName(rideName);
      setSaved(true);
      setTimeout(() => setShowShare(true), 800);
    } catch {
      setSaving(false);
      Alert.alert(t(language, 'error'), t(language, 'summaryErrorMsg'));
    }
  }

  function handleDiscard() {
    Alert.alert(
      t(language, 'summaryDiscardTitle'),
      t(language, 'summaryDiscardBody'),
      [
        { text: t(language, 'cancel'), style: 'cancel' },
        { text: t(language, 'summaryDiscardBtn'), style: 'destructive', onPress: () => {
          reset();
          router.replace('/(tabs)');
        }},
      ]
    );
  }

  // ── success state ──────────────────────────────────────────────────────────

  if (saved) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.successContainer}>
          <View style={styles.successCircle}>
            <FontAwesome name="check" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.successTitle}>{t(language, 'summarySavedTitle')}</Text>
          <Text style={styles.successSubtitle}>{t(language, 'summarySavedSubtitle')}</Text>
        </View>
        <StoryShareSheet
          visible={showShare}
          onSkip={() => router.replace('/saved-rides')}
          rideName={savedName}
          distanceKm={distKm}
          durationSeconds={durSec}
          points={points}
          isClimb={isClimb}
          elevationProfile={elevationProfile}
          elevationM={elevationM}
        />
      </SafeAreaView>
    );
  }

  // ── main UI ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <FontAwesome name="chevron-left" size={16} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t(language, 'summaryHeaderTitle')}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Stats card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDuration(durSec)}</Text>
            <Text style={styles.statLabel}>{t(language, 'summaryDurationLabel')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{distKm}</Text>
            <Text style={styles.statLabel}>KM</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{avgSpeed ?? '—'}</Text>
            <Text style={styles.statLabel}>KM/H</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            {elevationLoading ? (
              <ActivityIndicator color={Colors.brandGreen} size="small" />
            ) : (
              <Text style={styles.statValue}>{elevationM != null ? `${elevationM}m` : '—'}</Text>
            )}
            <Text style={styles.statLabel}>D+</Text>
          </View>
        </View>

        {/* Climb gradient profile preview */}
        {isClimb && elevationProfile && elevationProfile.length >= 2 && (
          <View style={styles.climbProfileWrap}>
            <Text style={styles.climbProfileLabel}>{t(language, 'summaryClimbProfileLabel')}</Text>
            <GradientProfile
              elevationProfile={elevationProfile}
              distanceKm={distKmNum}
              width={320}
              height={100}
              showLabels={true}
            />
          </View>
        )}

        {/* Short ride warning */}
        {isShort && (
          <View style={styles.warningBanner}>
            <FontAwesome name="exclamation-triangle" size={14} color="#FB923C" />
            <Text style={styles.warningText}>{t(language, 'summaryShortWarning')}</Text>
          </View>
        )}

        {/* Route name */}
        <View style={styles.section}>
          <Text style={styles.label}>{t(language, 'summaryRideNameLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t(language, 'summaryNamePlaceholder')}
            placeholderTextColor={Colors.textSecondary}
            value={name}
            onChangeText={setName}
            returnKeyType="done"
            editable={!saving}
            maxLength={60}
          />
        </View>

        {/* Region */}
        <View style={styles.section}>
          <Text style={styles.label}>{t(language, 'summaryRegionLabel')}</Text>
          <View style={styles.chipsRow}>
            {REGIONS.map((r) => (
              <Pressable
                key={r.key}
                style={[styles.chip, region === r.key && styles.chipActive]}
                onPress={() => setRegion(r.key)}
                disabled={saving}
              >
                <Text style={[styles.chipText, region === r.key && styles.chipTextActive]}>
                  {r.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Traffic */}
        <View style={styles.section}>
          <Text style={styles.label}>{t(language, 'summaryTrafficLabel')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t(language, 'summaryTrafficPlaceholder')}
            placeholderTextColor={Colors.textSecondary}
            value={traffic}
            onChangeText={setTraffic}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!saving}
          />
        </View>

        {/* Road condition */}
        <View style={styles.section}>
          <Text style={styles.label}>{t(language, 'summaryRoadLabel')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t(language, 'summaryRoadPlaceholder')}
            placeholderTextColor={Colors.textSecondary}
            value={roadCondition}
            onChangeText={setRoadCondition}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!saving}
          />
        </View>

        {/* Why good */}
        <View style={styles.section}>
          <Text style={styles.label}>{t(language, 'summaryWhyLabel')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t(language, 'summaryWhyPlaceholder')}
            placeholderTextColor={Colors.textSecondary}
            value={whyGood}
            onChangeText={setWhyGood}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!saving}
          />
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <FontAwesome name="bookmark" size={16} color="#FFFFFF" style={{ marginRight: 10 }} />
              <Text style={styles.saveButtonText}>{t(language, 'summarySaveBtn')}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.discardButton}
          onPress={handleDiscard}
          disabled={saving}
          activeOpacity={0.7}
        >
          <Text style={styles.discardButtonText}>{t(language, 'summaryDiscardRideBtn')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 16,
  },

  // ── Stats card ──
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.brandGreen,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 14,
  },

  // ── Climb Profile ──
  climbProfileWrap: {
    marginBottom: 20,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  climbProfileLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF6B35',
    letterSpacing: 0.8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: '#0A0A0B',
  },

  // ── Warning banner ──
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FB923C18',
    borderWidth: 1,
    borderColor: '#FB923C44',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#FB923C',
    lineHeight: 18,
  },

  // ── Sections ──
  section: {
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },

  // ── Inputs ──
  input: {
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 90,
    paddingTop: 14,
  },

  // ── Chips ──
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface1,
  },
  chipActive: {
    backgroundColor: Colors.brandGreen + '22',
    borderColor: Colors.brandGreen,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.brandGreen,
    fontWeight: '600',
  },

  // ── Footer ──
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  saveButton: {
    backgroundColor: Colors.brandGreen,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  discardButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardButtonText: {
    fontSize: 15,
    color: Colors.textMuted,
    fontWeight: '500',
  },

  // ── Success state ──
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: Colors.brandGreen,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
