import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { GroupRide } from '@/types/GroupRide';
import { Route } from '@/types/Route';
import { RoutePreviewSVG } from './RoutePreviewSVG';
import Colors from '@/constants/Colors';
import { formatShortDate, formatTime } from '@/utils/dateFormatting';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';

interface GroupRideListItemProps {
  groupRide: GroupRide;
  route?: Route;
  rsvpCount: number;
}

export function GroupRideListItem({
  groupRide,
  route,
  rsvpCount,
}: GroupRideListItemProps) {
  const router = useRouter();
  const { language } = useLanguage();

  const handlePress = () => {
    router.push(`/group-rides/${groupRide.id}`);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Left: Mini route preview */}
      <View style={styles.previewContainer}>
        {route ? (
          route.polyline ? (
            <RoutePreviewSVG
              polyline={route.polyline}
              width={72}
              height={72}
              strokeWidth={2}
            />
          ) : (
            <Image source={{ uri: route.imageUrl }} style={styles.previewImage} />
          )
        ) : (
          <View style={styles.placeholderPreview}>
            <FontAwesome name="bicycle" size={32} color={Colors.brandGreen} />
          </View>
        )}
      </View>

      {/* Right: Ride info */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {groupRide.title}
        </Text>

        <View style={styles.infoRow}>
          <FontAwesome name="calendar" size={12} color={Colors.textSecondary} />
          <Text style={styles.infoText}>
            {formatShortDate(groupRide.startsAt, language)} {formatTime(groupRide.startsAt)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <FontAwesome name="map-marker" size={12} color={Colors.textSecondary} />
          <Text style={styles.infoText} numberOfLines={1}>
            {groupRide.meetingPoint}
          </Text>
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.rsvpBadge}>
            <Text style={styles.rsvpText}>
              {rsvpCount} {t(language, 'rsvpGoing')}
            </Text>
          </View>
          <View style={styles.regionBadge}>
            <Text style={styles.regionText}>{t(language, groupRide.region)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.cardSurface,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  previewContainer: {
    width: 72,
    height: 72,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 188, 124, 0.1)',
    marginRight: 12,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderPreview: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 188, 124, 0.1)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  rsvpBadge: {
    backgroundColor: 'rgba(0, 188, 124, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rsvpText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.brandGreen,
  },
  regionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  regionText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});
