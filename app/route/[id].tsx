import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { getRoute } from '@/repositories/routesRepo';
import { Route } from '@/types/Route';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFavourites } from '@/contexts/FavouritesContext';
import { InteractiveRouteMap } from '@/components/InteractiveRouteMap';
import { t } from '@/constants/i18n';

const { width } = Dimensions.get('window');

export default function RouteDetailScreen() {
  const { id } = useLocalSearchParams();
  const { language } = useLanguage();
  const { isFavourite, toggleFavourite } = useFavourites();
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoute();
  }, [id]);

  const loadRoute = async () => {
    if (!id || typeof id !== 'string') return;
    setLoading(true);
    try {
      const data = await getRoute(id);
      setRoute(data);
    } catch (error) {
      console.error('Failed to load route:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={Colors.brandGreen} />
        </View>
      </SafeAreaView>
    );
  }

  if (!route) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Route not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const routeId = String(id);
  const isStarred = isFavourite(routeId);

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    }
    return `${mins}min`;
  };

  const getDifficultyLabel = (difficulty: string): string => {
    switch (difficulty) {
      case 'Lahka':
        return t(language, 'easy');
      case 'Srednja':
        return t(language, 'medium');
      case 'Težka':
        return t(language, 'hard');
      default:
        return difficulty;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerTransparent: true,
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerTintColor: '#FFFFFF',
          headerRight: () => (
            <TouchableOpacity
              style={styles.starButton}
              onPress={() => toggleFavourite(routeId)}
              activeOpacity={0.7}
            >
              <FontAwesome
                name={isStarred ? 'star' : 'star-o'}
                size={24}
                color={isStarred ? '#FFD700' : '#FFFFFF'}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: route.imageUrl }} style={styles.heroImage} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>{route.title}</Text>

          {/* Location & Difficulty Badges */}
          <View style={styles.badgesRow}>
            <View style={styles.locationBadge}>
              <Text style={styles.locationText}>{t(language, 'gorenjska')}</Text>
            </View>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{getDifficultyLabel(route.difficulty)}</Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <FontAwesome name="road" size={24} color={Colors.brandGreen} style={styles.statIcon} />
              <Text style={styles.statValue}>{route.distanceKm}</Text>
              <Text style={styles.statLabel}>{t(language, 'km')}</Text>
            </View>
            <View style={styles.statCard}>
              <FontAwesome name="line-chart" size={24} color={Colors.brandGreen} style={styles.statIcon} />
              <Text style={styles.statValue}>{route.elevationM}</Text>
              <Text style={styles.statLabel}>{t(language, 'meters')}</Text>
            </View>
            <View style={styles.statCard}>
              <FontAwesome name="clock-o" size={24} color={Colors.brandGreen} style={styles.statIcon} />
              <Text style={styles.statValue}>{formatDuration(route.durationMinutes)}</Text>
              <Text style={styles.statLabel}>{t(language, 'time')}</Text>
            </View>
          </View>

          {/* Route Overview Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t(language, 'routeOverview')}</Text>
            {route.polyline ? (
              <InteractiveRouteMap polyline={route.polyline} height={250} />
            ) : (
              <View style={styles.mapPlaceholder}>
                <FontAwesome name="map" size={48} color={Colors.textMuted} />
                <Text style={styles.mapPlaceholderText}>{t(language, 'mapPlaceholder')}</Text>
              </View>
            )}
          </View>

          {/* About This Route Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t(language, 'aboutRoute')}</Text>

            {/* Traffic Info */}
            <View style={styles.infoBlock}>
              <View style={styles.infoIconContainer}>
                <FontAwesome name="car" size={20} color={Colors.brandGreen} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>{t(language, 'traffic')}</Text>
                <Text style={styles.infoDescription}>
                  {t(language, 'trafficDesc')}
                </Text>
              </View>
            </View>

            {/* Road Quality Info */}
            <View style={styles.infoBlock}>
              <View style={styles.infoIconContainer}>
                <FontAwesome name="road" size={20} color={Colors.brandGreen} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>{t(language, 'roadQuality')}</Text>
                <Text style={styles.infoDescription}>
                  {t(language, 'roadQualityDesc')}
                </Text>
              </View>
            </View>

            {/* Why it's good Info */}
            <View style={styles.infoBlock}>
              <View style={styles.infoIconContainer}>
                <FontAwesome name="star" size={20} color={Colors.brandGreen} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>{t(language, 'whyGood')}</Text>
                <Text style={styles.infoDescription}>
                  {t(language, 'whyGoodDesc')}
                </Text>
              </View>
            </View>
          </View>

          {/* Export GPX Button */}
          <TouchableOpacity style={styles.exportButton} activeOpacity={0.8}>
            <FontAwesome name="download" size={18} color={Colors.background} />
            <Text style={styles.exportButtonText}>{t(language, 'exportGPX')}</Text>
          </TouchableOpacity>
        </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  heroContainer: {
    width: width,
    height: 200,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
    lineHeight: 38,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  locationBadge: {
    backgroundColor: Colors.cardSurface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  difficultyBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.cardSurface,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  mapPlaceholder: {
    backgroundColor: Colors.cardSurface,
    borderRadius: 16,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 12,
  },
  infoBlock: {
    flexDirection: 'row',
    backgroundColor: Colors.cardSurface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 188, 124, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 15,
    lineHeight: 21,
    color: Colors.textPrimary,
  },
  exportButton: {
    backgroundColor: Colors.brandGreen,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.background,
  },
  starButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
});
