/**
 * VzponiPickCard — matches the QuickPickCard structure exactly.
 * Background photo + gradient overlay + orange pill with a custom mountain SVG icon.
 */

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

// Strma Reber — featured photo from the dedicated Strma Reber post on rupicapra.si
const MOUNTAIN_IMAGE = 'https://rupicapra.si/wp-content/uploads/2016/06/45b8b33db0b54200c316f70c091ee6e4-d4vsul4-1-1024x683.jpg';

interface Props {
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Simple two-peak mountain silhouette */
function MountainIcon() {
  return (
    <Svg width={20} height={16} viewBox="0 0 20 16">
      {/* Left smaller peak, right taller peak */}
      <Path
        d="M0,15 L5.5,6 L8.5,10 L13,1 L20,15 Z"
        fill="#FFFFFF"
      />
      {/* Snow cap on the tall peak */}
      <Path
        d="M11,4.5 L13,1 L15,4.5 Z"
        fill="rgba(255,255,255,0.55)"
      />
    </Svg>
  );
}

export function VzponiPickCard({ onPress }: Props) {
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
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Background photo */}
      <Image
        source={MOUNTAIN_IMAGE}
        style={styles.backgroundImage}
        cachePolicy="memory-disk"
        contentFit="cover"
      />

      {/* Gradient overlay — matches QuickPickCard */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={StyleSheet.absoluteFill}
        locations={[0.3, 1]}
      />

      {/* Orange pill with mountain icon — centered */}
      <View style={styles.content}>
        <View style={styles.pill}>
          <MountainIcon />
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
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.3)',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    backgroundColor: 'rgba(255, 107, 53, 0.92)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
});
