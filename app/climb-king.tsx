/**
 * Kralj vzponov — the climb collection. Conquered climbs show gold with the
 * rider's best time; the rest are greyed-out and waiting.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { getClimbs } from '@/repositories/routesRepo';
import { listMyConquests, ClimbConquest } from '@/repositories/conquestsRepo';
import { Route } from '@/types/Route';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';
import { formatClimbTime } from '@/components/record/ConquestCelebration';

const GOLD = '#FFC83D';

export default function ClimbKingScreen() {
  const { language } = useLanguage();
  const router = useRouter();
  const [climbs, setClimbs] = useState<Route[]>([]);
  const [conquests, setConquests] = useState<Map<string, ClimbConquest>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getClimbs(), listMyConquests()])
      .then(([allClimbs, mine]) => {
        setClimbs(allClimbs);
        setConquests(mine);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const conqueredCount = climbs.filter(c => conquests.has(c.id)).length;
  const progress = climbs.length > 0 ? conqueredCount / climbs.length : 0;

  // Conquered climbs first, each group alphabetical
  const sorted = [...climbs].sort((a, b) => {
    const ac = conquests.has(a.id) ? 0 : 1;
    const bc = conquests.has(b.id) ? 0 : 1;
    return ac !== bc ? ac - bc : a.title.localeCompare(b.title);
  });

  const renderClimb = ({ item }: { item: Route }) => {
    const conquest = conquests.get(item.id);
    const conquered = !!conquest;
    return (
      <TouchableOpacity
        style={[styles.row, conquered && styles.rowConquered]}
        activeOpacity={0.8}
        onPress={() => router.push(`/route/${item.id}`)}
      >
        <View style={[styles.iconCircle, conquered && styles.iconCircleGold]}>
          <FontAwesome
            name={conquered ? 'trophy' : 'lock'}
            size={18}
            color={conquered ? GOLD : Colors.textMuted}
          />
        </View>
        <View style={styles.rowInfo}>
          <Text style={[styles.rowTitle, !conquered && styles.rowTitleLocked]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.rowMeta}>
            {conquered
              ? `${formatClimbTime(conquest.timeSeconds)} · ${item.distanceKm} km`
              : t(language, 'climbKingLocked')}
          </Text>
        </View>
        <FontAwesome name="chevron-right" size={14} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t(language, 'climbKingTitle'),
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.textPrimary,
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          renderItem={renderClimb}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <FontAwesome name="trophy" size={22} color={GOLD} />
                <Text style={styles.progressTitle}>{t(language, 'climbKingProgress')}</Text>
              </View>
              <Text style={styles.progressCount}>
                {conqueredCount} <Text style={styles.progressTotal}>/ {climbs.length}</Text>
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>
              {conqueredCount === 0 && (
                <Text style={styles.emptyHint}>{t(language, 'climbKingEmpty')}</Text>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:      { padding: 16, paddingBottom: 32 },

  /* progress header */
  progressCard: {
    backgroundColor: Colors.surface1,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: GOLD + '66',
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  progressCount: {
    fontSize: 44,
    fontWeight: '800',
    color: GOLD,
    fontVariant: ['tabular-nums'],
    marginTop: 6,
  },
  progressTotal: {
    fontSize: 24,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: GOLD,
  },
  emptyHint: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },

  /* climb rows */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  rowConquered: {
    borderColor: GOLD + '66',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleGold: {
    backgroundColor: GOLD + '22',
  },
  rowInfo: { flex: 1 },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  rowTitleLocked: {
    color: Colors.textSecondary,
  },
  rowMeta: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
});
