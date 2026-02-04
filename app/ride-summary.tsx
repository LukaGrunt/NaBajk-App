import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView }  from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import Colors              from '@/constants/Colors';
import { useLanguage }     from '@/contexts/LanguageContext';
import { t }               from '@/constants/i18n';
import { getPoints, getState, reset } from '@/lib/rideRecorder';
import { encodePolyline }            from '@/utils/polyline';
import { generateAndSaveGPX }        from '@/lib/gpxGenerator';
import { saveRide }                  from '@/lib/rideStorage';
import { ShareOverlay, ShareOverlayHandle } from '@/components/record/ShareOverlay';

// ── screen ────────────────────────────────────────────────

export default function RideSummaryScreen() {
  const { language } = useLanguage();
  const router       = useRouter();
  const shareRef     = useRef<ShareOverlayHandle>(null);

  // Capture recorded data once on mount — immune to later reset()
  const [points]  = useState(() => [...getPoints()]);
  const [distM]   = useState(() => getState().distanceMeters);
  const [durSec]  = useState(() => getState().elapsedSeconds);

  const [name, setName]                       = useState('');
  const [region, setRegion]                   = useState('gorenjska');
  const [regionOpen, setRegionOpen]           = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [shortWarningVisible, setShortWarning] = useState(false);

  /* ── derived ──────────────────────────────────────── */
  const polyline = useMemo(() => {
    if (points.length < 2) return '';
    return encodePolyline(points.map(p => ({ lat: p.lat, lng: p.lng })));
  }, [points]);

  const isShort = distM < 1000 || durSec < 120;

  const regions = [
    { key: 'gorenjska', label: t(language, 'gorenjska') },
    { key: 'dolenjska', label: t(language, 'dolenjska') },
    { key: 'stajerska', label: t(language, 'stajerska') },
  ];

  /* ── save ─────────────────────────────────────────── */
  async function handleSave() {
    if (isShort && !shortWarningVisible) {
      setShortWarning(true);
      return;                          // first tap just reveals the warning
    }
    setSaving(true);
    try {
      const gpxPath = await generateAndSaveGPX(points, name || 'NaBajk');
      const id      = Date.now().toString(36) + Math.random().toString(36).slice(2);
      await saveRide({
        id,
        createdAt:       new Date().toISOString(),
        name:            name || t(language, 'recordTitle'),
        region,
        durationSeconds: durSec,
        distanceMeters:  distM,
        polylineEncoded: polyline,
        pointsCount:     points.length,
        gpxPath,
      });
      reset();
      router.replace('/saved-rides');
    } catch {
      setSaving(false);
    }
  }

  /* ── no data guard ─────────────────────────────── */
  if (points.length < 2) {
    return (
      <SafeAreaView style={styles.root}>
        <Stack.Screen options={headerOpts(language)} />
        <View style={styles.center}>
          <Text style={styles.noDataText}>{t(language, 'summaryNoData')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ── main UI ─────────────────────────────────────── */
  return (
    <SafeAreaView style={styles.root}>
      <Stack.Screen options={headerOpts(language)} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner}>

        {/* route preview / share card */}
        <View style={styles.previewWrap}>
          <ShareOverlay
            ref={shareRef}
            polyline={polyline}
            distanceMeters={distM}
            durationSeconds={durSec}
          />
        </View>

        {/* name */}
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          placeholder={t(language, 'summaryNamePlaceholder')}
          placeholderTextColor={Colors.textMuted}
          maxLength={60}
        />

        {/* region picker */}
        <Text style={styles.regionLabel}>{t(language, 'summaryRegionLabel')}</Text>
        <TouchableOpacity
          style={styles.regionBtn}
          onPress={() => setRegionOpen(v => !v)}
        >
          <Text style={styles.regionBtnText}>
            {regions.find(r => r.key === region)?.label ?? region}
          </Text>
          <Text style={styles.regionChevron}>{regionOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {regionOpen && (
          <View style={styles.regionList}>
            {regions.map(r => (
              <TouchableOpacity
                key={r.key}
                style={[styles.regionOption, r.key === region && styles.regionOptionActive]}
                onPress={() => { setRegion(r.key); setRegionOpen(false); }}
              >
                <Text style={[styles.regionOptionText, r.key === region && styles.regionOptionTextActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* short-ride warning */}
        {shortWarningVisible && (
          <Text style={styles.shortWarning}>{t(language, 'summaryShortWarning')}</Text>
        )}

        {/* actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>{t(language, 'save')}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareBtn} onPress={() => shareRef.current?.share()}>
            <Text style={styles.shareBtnText}>{t(language, 'shareRide')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── header ────────────────────────────────────────────────

function headerOpts(language: Parameters<typeof t>[0]) {
  return {
    title:           t(language, 'summaryTitle'),
    headerStyle:     { backgroundColor: Colors.background },
    headerTintColor: Colors.textPrimary,
  };
}

// ── styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: Colors.background },
  scroll:      { flex: 1 },
  scrollInner: { padding: 20, alignItems: 'center' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  noDataText:  { color: Colors.textMuted, fontSize: 15 },

  /* preview */
  previewWrap: { alignItems: 'center', marginBottom: 20 },

  /* name input */
  nameInput: {
    width:            '100%',
    backgroundColor:  Colors.cardSurface,
    borderRadius:     12,
    padding:          14,
    color:            Colors.textPrimary,
    fontSize:         16,
    marginTop:        12,
  },

  /* region */
  regionLabel: { color: Colors.textMuted, fontSize: 13, marginTop: 20, marginBottom: 6, alignSelf: 'flex-start' },
  regionBtn: {
    width:            '100%',
    backgroundColor:  Colors.cardSurface,
    borderRadius:     12,
    padding:          14,
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
  },
  regionBtnText:  { color: Colors.textPrimary, fontSize: 15 },
  regionChevron:  { color: Colors.textMuted, fontSize: 12 },
  regionList: {
    width:            '100%',
    backgroundColor:  Colors.elevatedSurface,
    borderRadius:     10,
    marginTop:        4,
    overflow:         'hidden',
  },
  regionOption:       { padding: 12 },
  regionOptionActive: { backgroundColor: 'rgba(0,188,124,0.12)' },
  regionOptionText:       { color: Colors.textSecondary, fontSize: 15 },
  regionOptionTextActive: { color: Colors.brandGreen },

  /* short warning */
  shortWarning: { color: '#FB923C', fontSize: 13, marginTop: 12, textAlign: 'center' },

  /* action buttons */
  actions:          { width: '100%', marginTop: 24, gap: 12 },
  saveBtn:          { backgroundColor: Colors.brandGreen, borderRadius: 14, padding: 16, alignItems: 'center' },
  saveBtnDisabled:  { opacity: 0.5 },
  saveBtnText:      { color: '#fff', fontSize: 16, fontWeight: '600' },
  shareBtn:         { borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 12, alignItems: 'center' },
  shareBtnText:     { color: Colors.textSecondary, fontSize: 15 },
});
