import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
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
        return Colors.greenLight;
      case 'Srednja':
        return Colors.accentOrange;
      case 'Težka':
        return Colors.difficultyHard;
      default:
        return Colors.textSecondary;
    }
  };

  const getDifficultyBgColor = (difficulty: Route['difficulty']): string => {
    switch (difficulty) {
      case 'Lahka':
        return 'rgba(51,204,145,0.12)';
      case 'Srednja':
        return 'rgba(255,107,53,0.12)';
      case 'Težka':
        return 'rgba(239,68,68,0.12)';
      default:
        return Colors.surface2;
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
        <Image source={route.imageUrl} style={styles.image} cachePolicy="memory-disk" transition={200} />
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
            { backgroundColor: getDifficultyBgColor(route.difficulty) },
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
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 67, // 3:2 aspect ratio
  },
  image: {
    width: 100,
    height: 67,
    borderRadius: 10,
    backgroundColor: Colors.surface2,
  },
  content: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stat: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  statDivider: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginHorizontal: 8,
    opacity: 0.5,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
