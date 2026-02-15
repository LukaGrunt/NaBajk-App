import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
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
    // 1h: Solo cyclist riding
    case '1h':  return 'https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?w=400';
    // 2h: Winding mountain road
    case '2h':  return 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=400';
    // 3h: Group of cyclists / peloton
    case '3h':  return 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400';
    // 4h+: Racing / sprint finish
    case '4h+': return 'https://images.unsplash.com/photo-1452573992436-6d508f200b30?w=400';
  }
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function QuickPickCard({ duration, onPress }: QuickPickCardProps) {
  const { language } = useLanguage();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      style={[styles.card, animatedStyle]}
      onPress={() => onPress(duration)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Image
        source={getTimeImage(duration)}
        style={styles.backgroundImage}
        cachePolicy="memory-disk"
        contentFit="cover"
      />

      {/* Gradient overlay: darker at bottom for text readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.gradient}
        locations={[0.3, 1]}
      />

      {/* Duration pill - centered */}
      <View style={styles.content}>
        <View style={styles.durationPill}>
          <Text style={styles.durationText}>{t(language, getTimeLabel(duration))}</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 100,
    height: 70,
    borderRadius: 12,
    marginRight: 10,
    overflow: 'hidden',
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.border,
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
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationPill: {
    backgroundColor: 'rgba(11, 191, 118, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.background,
  },
});
