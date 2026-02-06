import React from 'react';
import { Pressable, View, Text, Image, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
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

export function QuickPickCard({ duration, onPress }: QuickPickCardProps) {
  const { language } = useLanguage();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(duration)}
    >
      <Image source={{ uri: getTimeImage(duration) }} style={styles.backgroundImage} blurRadius={3} />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <FontAwesome name="clock-o" size={22} color="#FFFFFF" style={styles.icon} />
        <Text style={styles.label}>{t(language, getTimeLabel(duration))}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    height: 80,
    borderRadius: 12,
    marginRight: 10,
    overflow: 'hidden',
    backgroundColor: Colors.cardSurface,
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
  },
  icon: {
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
