/**
 * Climbs (Vzponi) screen — lists all vzponi-category routes with mini gradient charts.
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
import { Route } from '@/types/Route';
import { ClimbListItem } from '@/components/climbs/ClimbListItem';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';

const GOLD = '#FFC83D';

export default function ClimbsScreen() {
  const { language } = useLanguage();
  const router = useRouter();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClimbs()
      .then(setRoutes)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t(language, 'climbsTitle'),
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.textPrimary,
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.brandGreen} />
        </View>
      ) : routes.length === 0 ? (
        <View style={styles.center}>
          <FontAwesome name="area-chart" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>{t(language, 'noClimbs')}</Text>
        </View>
      ) : (
        <FlatList
          data={routes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ClimbListItem route={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <TouchableOpacity
              style={styles.kingBanner}
              activeOpacity={0.85}
              onPress={() => router.push('/climb-king')}
            >
              <View style={styles.kingIconCircle}>
                <FontAwesome name="trophy" size={20} color={GOLD} />
              </View>
              <View style={styles.kingInfo}>
                <Text style={styles.kingTitle}>{t(language, 'climbKingTitle')}</Text>
                <Text style={styles.kingSub}>{t(language, 'climbKingProgress')}</Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color={GOLD} />
            </TouchableOpacity>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  kingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: GOLD + '14',
    borderWidth: 1.5,
    borderColor: GOLD + '66',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  kingIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: GOLD + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kingInfo: { flex: 1 },
  kingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GOLD,
  },
  kingSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  list: {
    paddingTop: 4,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
