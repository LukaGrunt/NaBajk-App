/**
 * resume-ride — shown on cold start when SQLite has an unsaved active recording.
 *
 * The user is given two choices:
 *   • Save  — hydrates the recorder with the persisted points and routes to
 *             /ride-summary so they can name + save the ride normally.
 *   • Discard — clears SQLite and routes back to the home tabs.
 *
 * No "Resume" option: if the OS killed the app mid-ride, there's already a
 * gap in the GPS data. Better UX is to save what we have and let the user
 * start a fresh recording if they want to keep going.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';
import { hydrateFromActiveRecording, reset, getState } from '@/lib/rideRecorder';

function pad2(n: number) { return n.toString().padStart(2, '0'); }
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

export default function ResumeRideScreen() {
  const { language } = useLanguage();
  const router       = useRouter();

  const [loading,  setLoading]  = useState(true);
  const [isClimb,  setIsClimb]  = useState(false);
  const [snapshot, setSnapshot] = useState<{ distM: number; durSec: number; pts: number } | null>(null);

  useEffect(() => {
    (async () => {
      const result = await hydrateFromActiveRecording();
      if (!result) {
        // Nothing to recover — bounce back to home.
        router.replace('/(tabs)');
        return;
      }
      setIsClimb(result.isClimb);
      const s = getState();
      setSnapshot({
        distM:  s.distanceMeters,
        durSec: s.movingSeconds > 0 ? s.movingSeconds : s.elapsedSeconds,
        pts:    s.pointsCount,
      });
      setLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSave() {
    router.replace(isClimb ? '/ride-summary?isClimb=true' : '/ride-summary');
  }

  function handleDiscard() {
    Alert.alert(
      t(language, 'summaryDiscardTitle'),
      t(language, 'summaryDiscardBody'),
      [
        { text: t(language, 'cancel'), style: 'cancel' },
        {
          text:    t(language, 'summaryDiscardBtn'),
          style:   'destructive',
          onPress: () => {
            reset();
            router.replace('/(tabs)');
          },
        },
      ]
    );
  }

  if (loading || !snapshot) {
    return (
      <SafeAreaView style={styles.root}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.center}>
          <ActivityIndicator color={Colors.brandGreen} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const distKm = (snapshot.distM / 1000).toFixed(2);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.content}>
        <View style={styles.icon}>
          <FontAwesome name="bookmark" size={36} color={Colors.brandGreen} />
        </View>

        <Text style={styles.title}>{t(language, 'recoverTitle')}</Text>
        <Text style={styles.body}>{t(language, 'recoverBody')}</Text>

        {/* Stats card showing what we recovered */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatTime(snapshot.durSec)}</Text>
            <Text style={styles.statLabel}>{t(language, 'summaryDurationLabel')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{distKm}</Text>
            <Text style={styles.statLabel}>KM</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{snapshot.pts}</Text>
            <Text style={styles.statLabel}>GPS</Text>
          </View>
        </View>

        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <FontAwesome name="bookmark" size={16} color="#FFFFFF" style={{ marginRight: 10 }} />
          <Text style={styles.saveBtnText}>{t(language, 'recoverSaveBtn')}</Text>
        </Pressable>

        <Pressable style={styles.discardBtn} onPress={handleDiscard}>
          <Text style={styles.discardBtnText}>{t(language, 'summaryDiscardBtn')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.background },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },

  icon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.brandGreen}22`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: `${Colors.brandGreen}55`,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },

  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    marginBottom: 28,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    gap: 4,
  },
  statValue: {
    fontSize: 18,
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

  saveBtn: {
    backgroundColor: Colors.brandGreen,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 12,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  discardBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  discardBtnText: { fontSize: 15, color: Colors.textMuted, fontWeight: '500' },
});
