import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { Route } from '@/types/Route';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';

interface RouteListItemProps {
  route: Route;
}

export function RouteListItem({ route }: RouteListItemProps) {
  const router = useRouter();
  const { language } = useLanguage();

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

  const getDifficultyLabel = (difficulty: Route['difficulty']): string => {
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
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push(`/route/${route.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: route.imageUrl }} style={styles.image} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {route.title}
        </Text>
        <View style={styles.statsRow}>
          <Text style={styles.stat}>{route.distanceKm} km</Text>
          <Text style={styles.statDivider}>·</Text>
          <Text style={styles.stat}>{route.elevationM} m</Text>
          <Text style={styles.statDivider}>·</Text>
          <Text style={styles.stat}>{formatDuration(route.durationMinutes)}</Text>
        </View>
        <View
          style={[
            styles.difficultyBadge,
            { backgroundColor: getDifficultyColor(route.difficulty) + '20' },
          ]}
        >
          <Text
            style={[styles.difficultyText, { color: getDifficultyColor(route.difficulty) }]}
          >
            {getDifficultyLabel(route.difficulty)}
          </Text>
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
    marginBottom: 10,
  },
  imageContainer: {
    position: 'relative',
    width: 72,
    height: 72,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: Colors.elevatedSurface,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  stat: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  statDivider: {
    fontSize: 13,
    color: Colors.textMuted,
    marginHorizontal: 6,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
