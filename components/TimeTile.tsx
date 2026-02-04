/**
 * TimeTile Component
 * Compact tile for time-based route browsing
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { TimeDuration } from '@/types/Route';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';

interface TimeTileProps {
  duration: TimeDuration;
  onPress: (duration: TimeDuration) => void;
}

// Map durations to i18n translation keys
function getTimeLabel(duration: TimeDuration): keyof typeof import('@/constants/i18n').strings.sl {
  switch (duration) {
    case '1h':
      return 'time1h';
    case '2h':
      return 'time2h';
    case '3h':
      return 'time3h';
    case '4h+':
      return 'time4hPlus';
  }
}

// Map durations to representative cycling images
function getTimeImage(duration: TimeDuration): string {
  switch (duration) {
    case '1h':
      return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400';
    case '2h':
      return 'https://images.unsplash.com/photo-1571188654248-7a89213915f7?w=400';
    case '3h':
      return 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=400';
    case '4h+':
      return 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400';
  }
}

export function TimeTile({ duration, onPress }: TimeTileProps) {
  const { language } = useLanguage();
  const labelKey = getTimeLabel(duration);
  const imageUrl = getTimeImage(duration);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(duration)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.backgroundImage}
        blurRadius={3}
      />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <FontAwesome name="clock-o" size={28} color="#FFFFFF" style={styles.icon} />
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
