/**
 * Category Detail Screen
 * Shows routes filtered by category
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { SectionHeader } from '@/components/SectionHeader';
import { RouteListItem } from '@/components/RouteListItem';
import { getRoutesByCategory } from '@/repositories/routesRepo';
import { Route, RouteCategory } from '@/types/Route';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';

// Map categories to FontAwesome icon names
function getCategoryIcon(category: RouteCategory): React.ComponentProps<typeof FontAwesome>['name'] {
  switch (category) {
    case 'vzponi':
      return 'line-chart';
    case 'coffee':
      return 'coffee';
    case 'family':
      return 'users';
    case 'trainingLong':
      return 'road';
  }
}

// Map categories to i18n translation keys for names
function getCategoryNameKey(category: RouteCategory): keyof typeof import('@/constants/i18n').strings.sl {
  switch (category) {
    case 'vzponi':
      return 'categoryVzponi';
    case 'coffee':
      return 'categoryCoffee';
    case 'family':
      return 'categoryFamily';
    case 'trainingLong':
      return 'categoryTrainingLong';
  }
}

// Map categories to i18n translation keys for descriptions
function getCategoryDescKey(category: RouteCategory): keyof typeof import('@/constants/i18n').strings.sl {
  switch (category) {
    case 'vzponi':
      return 'categoryDescVzponi';
    case 'coffee':
      return 'categoryDescCoffee';
    case 'family':
      return 'categoryDescFamily';
    case 'trainingLong':
      return 'categoryDescTrainingLong';
  }
}

export default function CategoryScreen() {
  const { category } = useLocalSearchParams<{ category: RouteCategory }>();
  const { language } = useLanguage();
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoutes();
  }, [category]);

  const loadRoutes = async () => {
    if (!category || typeof category !== 'string') {
      setFilteredRoutes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const routes = await getRoutesByCategory(category);
      setFilteredRoutes(routes);
    } catch (error) {
      console.error('Failed to load category routes:', error);
      setFilteredRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  if (!category) {
    return null;
  }

  const iconName = getCategoryIcon(category);
  const nameKey = getCategoryNameKey(category);
  const descKey = getCategoryDescKey(category);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Category Header */}
        <View style={styles.header}>
          <FontAwesome name={iconName} size={32} color={Colors.brandGreen} />
          <Text style={styles.title}>{t(language, nameKey)}</Text>
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
                <FontAwesome name={iconName} size={48} color={Colors.textMuted} />
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
