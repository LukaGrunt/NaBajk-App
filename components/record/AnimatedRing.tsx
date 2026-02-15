import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Colors from '@/constants/Colors';

interface Props {
  size: number;
  strokeWidth?: number;
  color?: string;
}

export function AnimatedRing({ size, strokeWidth = 3, color = Colors.brandGreen }: Props) {
  const svgSize = size + 8;
  const radius = (size / 2) - (strokeWidth / 2) + 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.25; // 25% of circle = flowing arc

  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1, // infinite
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.ring, animatedStyle]}>
      <Svg width={svgSize} height={svgSize}>
        <Defs>
          <LinearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={color} stopOpacity="0" />
            <Stop offset="50%" stopColor={color} stopOpacity="0.9" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    top: -4,
    left: -4,
  },
});
