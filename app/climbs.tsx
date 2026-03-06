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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { getClimbs } from '@/repositories/routesRepo';
import { Route } from '@/types/Route';
import { ClimbListItem } from '@/components/climbs/ClimbListItem';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';

export default function ClimbsScreen() {
  const { language } = useLanguage();
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
