import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Route } from '@/types/Route';
import { RoutePreviewSVG } from './RoutePreviewSVG';
import Colors from '@/constants/Colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';

interface RoutePreviewCardProps {
  route: Route;
  polyline?: string;
}

export function RoutePreviewCard({ route, polyline }: RoutePreviewCardProps) {
  const router = useRouter();
  const { language } = useLanguage();

  const handlePress = () => {
    router.push(`/route/${route.id}`);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {/* Background: Use polyline SVG if available, otherwise route image */}
      {polyline ? (
        <View style={styles.svgContainer}>
          <RoutePreviewSVG
            polyline={polyline}
            width={350}
            height={220}
            strokeWidth={4}
          />
        </View>
      ) : (
        <Image source={{ uri: route.imageUrl }} style={styles.image} />
      )}

      {/* Dark gradient overlay */}
      <View style={styles.overlay} />

      {/* Route info */}
      <View style={styles.content}>
        <Text style={styles.label}>{t(language, 'routePreview')}</Text>
        <Text style={styles.title}>{route.title}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.stat}>{route.distanceKm} km</Text>
          <Text style={styles.statDivider}>•</Text>
          <Text style={styles.stat}>{route.elevationM} m</Text>
          <Text style={styles.statDivider}>•</Text>
          <Text style={styles.stat}>{route.difficulty}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.cardSurface,
    marginBottom: 24,
  },
  svgContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 188, 124, 0.08)',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.brandGreen,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  statDivider: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 8,
  },
});
