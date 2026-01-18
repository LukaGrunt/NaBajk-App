import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import Colors from '@/constants/Colors';
import { Route } from '@/types/Route';

interface RouteCardProps {
  route: Route;
}

const CARD_WIDTH = Dimensions.get('window').width * 0.75;

export function RouteCard({ route }: RouteCardProps) {
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

  const getDifficultyColor = (difficulty: Route['difficulty']): string => {
    switch (difficulty) {
      case 'Lahka':
        return '#4CAF50';
      case 'Srednja':
        return '#FFC107';
      case 'Težka':
        return '#F44336';
      default:
        return Colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: route.imageUrl }} style={styles.image} />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(route.difficulty) },
            ]}
          >
            <Text style={styles.difficultyText}>{route.difficulty}</Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={styles.title} numberOfLines={2}>
            {route.title}
          </Text>
          <View style={styles.stats}>
            <Text style={styles.stat}>{route.distanceKm} km</Text>
            <Text style={styles.statDivider}>·</Text>
            <Text style={styles.stat}>{route.elevationM} m</Text>
            <Text style={styles.statDivider}>·</Text>
            <Text style={styles.stat}>{formatDuration(route.durationMinutes)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: Colors.cardSurface,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {},
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  statDivider: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginHorizontal: 6,
  },
});
