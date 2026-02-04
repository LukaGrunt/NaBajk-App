import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { getGroupRide } from '@/repositories/groupRidesRepo';
import { getRoute } from '@/repositories/routesRepo';
import { GroupRide } from '@/types/GroupRide';
import { Route } from '@/types/Route';
import { RoutePreviewCard } from '@/components/group-rides/RoutePreviewCard';
import { RSVPModule } from '@/components/group-rides/RSVPModule';
import Colors from '@/constants/Colors';
import { formatGroupRideDateTime } from '@/utils/dateFormatting';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';
import ViewShot                  from 'react-native-view-shot';
import { StoryOverlay }          from '@/components/share/StoryOverlay';
import { ShareOverlaySheet }     from '@/components/share/ShareOverlaySheet';
import { exportOverlayToPng }    from '@/lib/share/overlayExport';

export default function GroupRideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { language } = useLanguage();

  const [groupRide, setGroupRide] = useState<GroupRide | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);

  const storyRef     = useRef<any>(null);
  const [capturing,    setCapturing]    = useState(false);
  const [storyPngPath, setStoryPngPath] = useState<string | null>(null);
  const [showSheet,    setShowSheet]    = useState(false);

  useEffect(() => {
    loadGroupRide();
  }, [id]);

  const loadGroupRide = async () => {
    if (!id) return;

    try {
      const ride = await getGroupRide(id);
      if (ride) {
        setGroupRide(ride);
        // Only look up route if routeId is provided
        if (ride.routeId) {
          const foundRoute = await getRoute(ride.routeId);
          setRoute(foundRoute || null);
        }
      }
    } catch (error) {
      console.error('Failed to load group ride:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInMaps = () => {
    if (!groupRide) return;

    const { lat, lng } = groupRide.meetingCoordinates;

    let url: string;
    if (Platform.OS === 'ios') {
      url = `maps://maps.apple.com/?q=${lat},${lng}`;
    } else {
      url = `geo:${lat},${lng}?q=${lat},${lng}`;
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          // Fallback to web
          return Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
        }
      })
      .catch((err) => console.error('Failed to open maps:', err));
  };

  const handleViewRoute = () => {
    if (route) {
      router.push(`/route/${route.id}`);
    }
  };

  const handleShare = async () => {
    setCapturing(true);
    await new Promise(r => setTimeout(r, 100));
    const png = await exportOverlayToPng(storyRef);
    setCapturing(false);
    if (png) { setStoryPngPath(png); setShowSheet(true); }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!groupRide) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Group ride not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Route Preview Card - only show if route exists */}
        {route && (
          <View style={styles.heroSection}>
            <RoutePreviewCard
              route={route}
              polyline={route.polyline}
            />
          </View>
        )}

        {/* Ride Info */}
        <View style={styles.section}>
          <Text style={styles.rideTitle}>{groupRide.title}</Text>

          {/* Date/Time */}
          <View style={styles.infoRow}>
            <FontAwesome name="calendar" size={16} color={Colors.brandGreen} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>{t(language, 'startsAt')}</Text>
              <Text style={styles.infoValue}>
                {formatGroupRideDateTime(groupRide.startsAt, language)}
              </Text>
            </View>
          </View>

          {/* Meeting Point */}
          <View style={styles.infoRow}>
            <FontAwesome name="map-marker" size={16} color={Colors.brandGreen} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>{t(language, 'meetingPoint')}</Text>
              <Text style={styles.infoValue}>{groupRide.meetingPoint}</Text>
            </View>
          </View>

          {/* Open in Maps Button - only show if coordinates provided */}
          {groupRide.meetingCoordinates.lat !== 0 && groupRide.meetingCoordinates.lng !== 0 && (
            <TouchableOpacity
              style={styles.mapsButton}
              onPress={handleOpenInMaps}
              activeOpacity={0.7}
            >
              <FontAwesome name="map" size={16} color={Colors.textPrimary} />
              <Text style={styles.mapsButtonText}>{t(language, 'openInMaps')}</Text>
            </TouchableOpacity>
          )}

          {/* Notes */}
          {groupRide.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{groupRide.notes}</Text>
            </View>
          )}

          {/* External URL */}
          {groupRide.externalUrl && (
            <TouchableOpacity
              style={styles.externalLink}
              onPress={() => Linking.openURL(groupRide.externalUrl!)}
              activeOpacity={0.7}
            >
              <FontAwesome name="external-link" size={14} color={Colors.brandGreen} />
              <Text style={styles.externalLinkText}>{groupRide.externalUrl}</Text>
            </TouchableOpacity>
          )}

          {/* Capacity */}
          {groupRide.capacity && (
            <Text style={styles.capacityText}>
              Max {groupRide.capacity} {groupRide.capacity === 1 ? 'participant' : 'participants'}
            </Text>
          )}
        </View>

        {/* RSVP Module */}
        <View style={styles.section}>
          <RSVPModule groupRideId={groupRide.id} />
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          {/* Only show View Route button if route exists */}
          {route && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleViewRoute}
              activeOpacity={0.7}
            >
              <FontAwesome name="map-o" size={16} color={Colors.textPrimary} />
              <Text style={styles.actionButtonText}>{t(language, 'viewRoute')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.shareButton]}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <FontAwesome name="share-alt" size={16} color={Colors.background} />
            <Text style={styles.shareButtonText}>{t(language, 'shareRide')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Story capture – briefly mounted for ViewShot */}
      {capturing && groupRide && (
        <View style={{ position: 'absolute', top: 0, left: 0, width: 360, height: 640 }}>
          <ViewShot ref={storyRef} options={{ format: 'png', quality: 1.0 }}>
            <StoryOverlay
              type="groupRide"
              groupRide={{
                title:        groupRide.title,
                startsAt:     formatGroupRideDateTime(groupRide.startsAt, language),
                meetingPoint: groupRide.meetingPoint,
              }}
            />
          </ViewShot>
        </View>
      )}

      <ShareOverlaySheet
        visible={showSheet}
        pngPath={storyPngPath}
        onClose={() => setShowSheet(false)}
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
  scrollContent: {
    paddingBottom: 20,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 60,
  },
  errorText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 60,
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  rideTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardSurface,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
    marginBottom: 16,
  },
  mapsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  notesContainer: {
    backgroundColor: Colors.cardSurface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  externalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  externalLinkText: {
    fontSize: 14,
    color: Colors.brandGreen,
    marginLeft: 6,
    textDecorationLine: 'underline',
  },
  capacityText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardSurface,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  shareButton: {
    backgroundColor: Colors.brandGreen,
    borderColor: Colors.brandGreen,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.background,
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 20,
  },
});
