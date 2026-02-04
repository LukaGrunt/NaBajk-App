/**
 * CategoryTile Component
 * Compact tile for category browsing
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { RouteCategory } from '@/types/Route';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';

interface CategoryTileProps {
  category: RouteCategory;
  onPress: (category: RouteCategory) => void;
}

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

// Map categories to i18n translation keys
function getCategoryLabel(category: RouteCategory): keyof typeof import('@/constants/i18n').strings.sl {
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

// Map categories to representative background images
function getCategoryImage(category: RouteCategory): string {
  switch (category) {
    case 'vzponi':
      return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400';
    case 'coffee':
      return 'https://images.unsplash.com/photo-1475666675596-cca2035b3d79?w=400';
    case 'family':
      return 'https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?w=400';
    case 'trainingLong':
      return 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=400';
  }
}

export function CategoryTile({ category, onPress }: CategoryTileProps) {
  const { language } = useLanguage();
  const iconName = getCategoryIcon(category);
  const labelKey = getCategoryLabel(category);
  const imageUrl = getCategoryImage(category);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(category)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: imageUrl }} style={styles.backgroundImage} blurRadius={3} />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <FontAwesome name={iconName} size={28} color="#FFFFFF" style={styles.icon} />
        <Text style={styles.label}>{t(language, labelKey)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 170,
    height: 94,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: Colors.cardSurface,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  icon: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
