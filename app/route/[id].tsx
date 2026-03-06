import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Colors from '@/constants/Colors';
import { getRoute } from '@/repositories/routesRepo';
import { Route } from '@/types/Route';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRiderLevel } from '@/contexts/RiderLevelContext';
import { calculateRideMinutes } from '@/utils/rideTimeCalculator';
import { InteractiveRouteMap } from '@/components/InteractiveRouteMap';
import { GradientProfile } from '@/components/climbs/GradientProfile';
import { t } from '@/constants/i18n';
import { parseGpxToCoordinates, buildGpxExport, parseGpxWithElevation } from '@/utils/gpx';
import { computeElevationProfileFromPoints } from '@/repositories/routesRepo';
import { StoryShareSheet } from '@/components/share/StoryShareSheet';
import { decodePolyline } from '@/utils/polyline';
import { getPlaceholderImage } from '@/constants/placeholderImages';

const { width } = Dimensions.get('window');

export default function RouteDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { language } = useLanguage();
  const { riderLevel } = useRiderLevel();
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareVisible, setShareVisible] = useState(false);
  const [computedElevationProfile, setComputedElevationProfile] = useState<number[] | null>(null);

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

  const routeId = String(id);

  // For climbs without stored elevationProfile, compute it from GPX elevation data
  useEffect(() => {
    if (!route?.isClimb || (route.elevationProfile && route.elevationProfile.length >= 2) || !route.gpxData) return;
    const pts = parseGpxWithElevation(route.gpxData);
    if (pts.some(p => p.alt !== null) && route.distanceKm > 0) {
      const profile = computeElevationProfileFromPoints(
        pts.map(p => ({ lat: p.lat, lng: p.lng, alt: p.alt ?? undefined })),
        route.distanceKm
      );
      setComputedElevationProfile(profile);
    }
  }, [route]);

  // Active elevation profile: stored in DB or computed from GPX at runtime
  const activeElevationProfile = route?.elevationProfile ?? computedElevationProfile ?? undefined;

  // Parse route coordinates from GPX data or polyline — must be before early returns
  const routeCoordinates = useMemo(() => {
    if (!route) return [];
    if (route.gpxData) return parseGpxToCoordinates(route.gpxData);
    if (route.polyline) return decodePolyline(route.polyline);
    return [];
  }, [route]);

  const heroImageUrl = route?.imageUrl || getPlaceholderImage(routeId);

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

  const handleNavigateToStart = () => {
    const coords = routeCoordinates;
    if (coords.length === 0) return;
    const { lat, lng } = coords[0];
    const mapsUrl = Platform.OS === 'ios'
      ? `maps://?daddr=${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    const fallback = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(mapsUrl).catch(() => Linking.openURL(fallback));
  };

  const handleExportGpx = async () => {
    if (routeCoordinates.length < 2) {
      Alert.alert('Export', 'No route data available to export.');
      return;
    }
    try {
      // Use stored GPX if available, otherwise build from coordinates
      const gpxContent = route?.gpxData ?? buildGpxExport(routeCoordinates, route?.title ?? 'Route');
      const fileName = `${(route?.title ?? 'route').replace(/\s+/g, '_')}.gpx`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, gpxContent, {
        encoding: 'utf8',
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filePath, { mimeType: 'application/gpx+xml', dialogTitle: 'Export GPX' });
      } else {
        Alert.alert('Export', `GPX saved to: ${filePath}`);
      }
    } catch (error) {
      console.error('GPX export failed:', error);
      Alert.alert('Export Failed', 'Could not export GPX file.');
    }
  };

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
          headerBackTitle: '',
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerTintColor: '#FFFFFF',
        }}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: heroImageUrl }} style={styles.heroImage} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>{route.title}</Text>

          {/* Location & Difficulty Badges */}
          <View style={styles.badgesRow}>
            {route.region ? (
              <View style={styles.locationBadge}>
                <Text style={styles.locationText}>{route.region}</Text>
              </View>
            ) : null}
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{getDifficultyLabel(route.difficulty)}</Text>
            </View>
          </View>

          {/* Stats Strip */}
          <View style={styles.statsStrip}>
            <View style={styles.statCell}>
              <FontAwesome name="road" size={18} color={Colors.brandGreen} style={styles.statIcon} />
              <Text style={styles.statValue}>{route.distanceKm}</Text>
              <Text style={styles.statLabel}>{t(language, 'km')}</Text>
            </View>
            <View style={styles.statDividerLine} />
            <View style={styles.statCell}>
              <FontAwesome name="line-chart" size={18} color={Colors.brandGreen} style={styles.statIcon} />
              <Text style={styles.statValue}>{route.elevationM}</Text>
              <Text style={styles.statLabel}>{t(language, 'meters')}</Text>
            </View>
            <View style={styles.statDividerLine} />
            <View style={styles.statCell}>
              <FontAwesome name="clock-o" size={18} color={Colors.brandGreen} style={styles.statIcon} />
              <Text style={styles.statValue}>{formatDuration(calculateRideMinutes(route.distanceKm, route.elevationM, riderLevel))}</Text>
              <Text style={styles.statLabel}>{t(language, 'time')}</Text>
            </View>
          </View>

          {/* Route Overview Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t(language, 'routeOverview')}</Text>
            {route.isClimb && activeElevationProfile && activeElevationProfile.length >= 2 ? (
              <>
                <View style={styles.gradientProfileWrap}>
                  <GradientProfile
                    elevationProfile={activeElevationProfile}
                    distanceKm={route.distanceKm}
                    width={width - 32}
                    height={220}
                    showLabels={true}
                  />
                </View>
                <TouchableOpacity
                  style={styles.navToStartBtn}
                  activeOpacity={0.85}
                  onPress={handleNavigateToStart}
                >
                  <FontAwesome name="location-arrow" size={16} color={Colors.background} />
                  <Text style={styles.navToStartText}>{t(language, 'navigateToStart')}</Text>
                </TouchableOpacity>
              </>
            ) : routeCoordinates.length >= 2 ? (
              <InteractiveRouteMap coordinates={routeCoordinates} height={250} />
            ) : (
              <View style={styles.mapPlaceholder}>
                <FontAwesome name="map" size={48} color={Colors.textMuted} />
                <Text style={styles.mapPlaceholderText}>{t(language, 'mapPlaceholder')}</Text>
              </View>
            )}
          </View>

          {/* About This Route Section — only shown when route has real data */}
          {(route.traffic || route.roadCondition || route.whyGood) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t(language, 'aboutRoute')}</Text>

              {route.traffic && (
                <View style={styles.infoBlock}>
                  <View style={styles.infoIconContainer}>
                    <FontAwesome name="car" size={20} color={Colors.brandGreen} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoTitle}>{t(language, 'traffic')}</Text>
                    <Text style={styles.infoDescription}>{route.traffic}</Text>
                  </View>
                </View>
              )}

              {route.roadCondition && (
                <View style={styles.infoBlock}>
                  <View style={styles.infoIconContainer}>
                    <FontAwesome name="road" size={20} color={Colors.brandGreen} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoTitle}>{t(language, 'roadQuality')}</Text>
                    <Text style={styles.infoDescription}>{route.roadCondition}</Text>
                  </View>
                </View>
              )}

              {route.whyGood && (
                <View style={styles.infoBlock}>
                  <View style={styles.infoIconContainer}>
                    <FontAwesome name="star" size={20} color={Colors.brandGreen} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoTitle}>{t(language, 'whyGood')}</Text>
                    <Text style={styles.infoDescription}>{route.whyGood}</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Export GPX Button */}
          <TouchableOpacity style={styles.exportButton} activeOpacity={0.8} onPress={handleExportGpx}>
            <FontAwesome name="download" size={18} color={Colors.background} />
            <Text style={styles.exportButtonText}>{t(language, 'exportGPX')}</Text>
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity style={styles.shareButton} activeOpacity={0.8} onPress={() => setShareVisible(true)}>
            <FontAwesome name="share-square-o" size={18} color={Colors.brandGreen} />
            <Text style={styles.shareButtonText}>{t(language, 'shareOnInstagram')}</Text>
          </TouchableOpacity>

          {/* Create Group Ride Button */}
          <TouchableOpacity
            style={styles.groupRideButton}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/group-rides/create', params: { routeId: routeId } })}
          >
            <FontAwesome name="users" size={18} color={Colors.textSecondary} />
            <Text style={styles.groupRideButtonText}>{t(language, 'createGroupRide')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <StoryShareSheet
        visible={shareVisible}
        onSkip={() => setShareVisible(false)}
        rideName={route.title}
        distanceKm={route.distanceKm.toFixed(2)}
        durationSeconds={route.durationMinutes * 60}
        points={routeCoordinates}
        isClimb={route.isClimb}
        elevationProfile={activeElevationProfile}
        avgGradient={route.avgGradient ?? undefined}
        elevationM={route.elevationM ?? undefined}
      />
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
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.cardSurface,
    borderRadius: 16,
    marginBottom: 32,
    overflow: 'hidden',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 8,
  },
  statDividerLine: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 14,
  },
  statIcon: {
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
  shareButton: {
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: Colors.brandGreen,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.brandGreen,
  },
  groupRideButton: {
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupRideButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  gradientProfileWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  navToStartBtn: {
    backgroundColor: Colors.brandGreen,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  navToStartText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.background,
  },
});
