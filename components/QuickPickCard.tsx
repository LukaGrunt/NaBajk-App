import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/Colors';
import { TimeDuration } from '@/types/Route';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';

interface QuickPickCardProps {
  duration: TimeDuration;
  onPress: (duration: TimeDuration) => void;
}

function getTimeLabel(duration: TimeDuration): keyof typeof import('@/constants/i18n').strings.sl {
  switch (duration) {
    case '1h':  return 'time1h';
    case '2h':  return 'time2h';
    case '3h':  return 'time3h';
    case '4h+': return 'time4hPlus';
  }
}

function getTimeImage(duration: TimeDuration): string {
  switch (duration) {
    case '1h':  return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400';
    case '2h':  return 'https://images.unsplash.com/photo-1571188654248-7a89213915f7?w=400';
    case '3h':  return 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=400';
    case '4h+': return 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400';
  }
}

function getRouteTeaser(duration: TimeDuration, language: 'sl' | 'en'): string {
  const teasers = {
    '1h':  { sl: 'Hitra dolinska vožnja', en: 'Quick valley ride' },
    '2h':  { sl: 'Bled scenarska pot', en: 'Bled scenic route' },
    '3h':  { sl: 'Gorski prelaz', en: 'Mountain pass' },
    '4h+': { sl: 'Epska avantura', en: 'Epic adventure' },
  };
  return teasers[duration][language];
}

export function QuickPickCard({ duration, onPress }: QuickPickCardProps) {
  const { language } = useLanguage();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(duration)}
    >
      <Image source={getTimeImage(duration)} style={styles.backgroundImage} blurRadius={3} cachePolicy="memory-disk" contentFit="cover" />

      {/* Gradient overlay: transparent at top → dark at bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(10,10,11,0.75)']}
        style={styles.gradient}
        locations={[0, 1]}
      />

      {/* Bottom-aligned content */}
      <View style={styles.content}>
        {/* Duration pill */}
        <View style={styles.durationPill}>
          <Text style={styles.durationText}>{t(language, getTimeLabel(duration))}</Text>
        </View>

        {/* Route teaser */}
        <Text style={styles.teaser}>{getRouteTeaser(duration, language)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    height: 95,  // ~3:2 aspect ratio
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardPressed: {
    borderColor: Colors.brandGreen,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    gap: 6,
  },
  durationPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface2,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  teaser: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
});
