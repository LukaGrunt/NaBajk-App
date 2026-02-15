import React, { useEffect } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Colors from '@/constants/Colors';

interface RandomPickCardProps {
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function RandomPickCard({ onPress }: RandomPickCardProps) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  // Subtle wiggle animation every few seconds
  useEffect(() => {
    rotation.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 80, easing: Easing.inOut(Easing.ease) }),
          withTiming(6, { duration: 80, easing: Easing.inOut(Easing.ease) }),
          withTiming(-4, { duration: 60, easing: Easing.inOut(Easing.ease) }),
          withTiming(4, { duration: 60, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 60, easing: Easing.inOut(Easing.ease) }),
          withDelay(2000, withTiming(0, { duration: 0 })) // Wait before next wiggle
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
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
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Text style={styles.questionMark}>?</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 100,
    height: 70,
    borderRadius: 12,
    marginRight: 10,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
    // Subtle shadow for depth
    shadowColor: Colors.brandGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  questionMark: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
