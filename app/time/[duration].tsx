/**
 * Time Duration Screen
 * Shows routes filtered by time duration
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { SectionHeader } from '@/components/SectionHeader';
import { RouteListItem } from '@/components/RouteListItem';
import { getRoutesByDuration } from '@/repositories/routesRepo';
import { Route, TimeDuration } from '@/types/Route';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';

// Map durations to i18n translation keys for labels
function getTimeLabelKey(duration: TimeDuration): keyof typeof import('@/constants/i18n').strings.sl {
  switch (duration) {
    case '1h':
      return 'time1h';
    case '2h':
      return 'time2h';
    case '3h':
      return 'time3h';
    case '4h+':
      return 'time4hPlus';
  }
}

// Map durations to i18n translation keys for descriptions
function getTimeDescKey(duration: TimeDuration): keyof typeof import('@/constants/i18n').strings.sl {
  switch (duration) {
    case '1h':
      return 'timeDesc1h';
    case '2h':
      return 'timeDesc2h';
    case '3h':
      return 'timeDesc3h';
    case '4h+':
      return 'timeDesc4hPlus';
  }
}

export default function TimeDurationScreen() {
  const { duration } = useLocalSearchParams<{ duration: TimeDuration }>();
  const { language } = useLanguage();
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoutes();
  }, [duration]);

  const loadRoutes = async () => {
    if (!duration || typeof duration !== 'string') {
      setFilteredRoutes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const routes = await getRoutesByDuration(duration);
      setFilteredRoutes(routes);
    } catch (error) {
      console.error('Failed to load duration routes:', error);
      setFilteredRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  if (!duration) {
    return null;
  }

  const labelKey = getTimeLabelKey(duration);
  const descKey = getTimeDescKey(duration);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Time Duration Header */}
        <View style={styles.header}>
          <FontAwesome name="clock-o" size={32} color={Colors.brandGreen} />
          <Text style={styles.title}>{t(language, labelKey)}</Text>
          <Text style={styles.description}>{t(language, descKey)}</Text>
        </View>

        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.brandGreen} />
          </View>
        ) : (
          <>
            {/* Routes Count */}
            <SectionHeader
              title={`${filteredRoutes.length} ${filteredRoutes.length === 1 ? t(language, 'searchResult') : t(language, 'searchResults')}`}
            />

            {/* Filtered Routes List */}
            {filteredRoutes.length > 0 ? (
              <View style={styles.listContainer}>
                {filteredRoutes.map((route) => (
                  <RouteListItem key={route.id} route={route} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <FontAwesome name="clock-o" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyStateText}>{t(language, 'noRoutesFound')}</Text>
              </View>
            )}
          </>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 12,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  listContainer: {
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: 16,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 20,
  },
});
