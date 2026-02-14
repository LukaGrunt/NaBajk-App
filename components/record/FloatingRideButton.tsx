import React, { useEffect } from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { useRideRecorder } from '@/lib/rideRecorder';

/**
 * "The Beacon" — Floating Action Button for starting/managing rides
 *
 * Features:
 * - Layered glow effect (3 shadow layers)
 * - Press animation: scale + haptic + glow intensify
 * - Idle breathing animation (pulses after 5s idle)
 * - Active ride state: red pulse + elapsed timer badge
 */
export function FloatingRideButton() {
  const router = useRouter();
  const { state } = useRideRecorder();

  // Derive recording state from singleton
  const isRecording = state.status === 'recording';
  const elapsedSeconds = state.elapsedSeconds;

  // Animation values
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.2);
  const breathingOpacity = useSharedValue(0.2);
  const pulseScale = useSharedValue(1);
  const gradientRotation = useSharedValue(0);

  // Idle breathing animation - starts after component mounts
  useEffect(() => {
    if (!isRecording) {
      // Wait 5 seconds before starting breathing animation
      const timeout = setTimeout(() => {
        breathingOpacity.value = withRepeat(
          withSequence(
            withTiming(0.15, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.25, { duration: 1500, easing: Easing.inOut(Easing.ease) })
          ),
          -1, // infinite
          false
        );
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [isRecording]);

  // Red pulse animation when recording
  useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // infinite
        false
      );
    } else {
      pulseScale.value = 1;
    }
  }, [isRecording]);

  // Gradient rotation animation - liquid metal flowing effect
  useEffect(() => {
    gradientRotation.value = withRepeat(
      withTiming(Math.PI * 2, {
        duration: 4000, // 4 second rotation for slow, liquid-like flow
        easing: Easing.linear,
      }),
      -1, // infinite
      false // don't reverse
    );
  }, []);

  const handlePress = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Scale animation
    scale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 150,
    });

    // Intensify glow
    glowOpacity.value = withTiming(0.4, { duration: 150 });

    // Navigate
    router.push('/recording');

    // Reset after animation
    setTimeout(() => {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
      glowOpacity.value = withTiming(0.2, { duration: 300 });
    }, 150);
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulseScale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const animatedBreathingStyle = useAnimatedStyle(() => ({
    opacity: breathingOpacity.value,
  }));

  // Animated gradient rotation style - rotates the entire gradient for liquid metal effect
  const animatedGradientStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${gradientRotation.value}rad` }],
  }));

  // Format elapsed time for badge
  const formatElapsedTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Layer 3: Largest glow (8px offset, 40px blur, 8px spread) */}
      <Animated.View
        style={[
          styles.glow,
          styles.glowLayer3,
          isRecording && styles.glowRed,
          animatedBreathingStyle,
        ]}
      />

      {/* Layer 2: Medium glow (4px offset, 24px blur, 4px spread) - breathing layer */}
      <Animated.View
        style={[
          styles.glow,
          styles.glowLayer2,
          isRecording && styles.glowRed,
          animatedBreathingStyle,
        ]}
      />

      {/* Layer 1: Inner glow (0 offset, 12px blur, 2px spread) - press responsive */}
      <Animated.View
        style={[
          styles.glow,
          styles.glowLayer1,
          isRecording && styles.glowRed,
          animatedGlowStyle,
        ]}
      />

      {/* Main button */}
      <Animated.View style={[styles.buttonWrapper, animatedButtonStyle]}>
        <Pressable
          onPress={handlePress}
          accessibilityLabel={isRecording ? 'View active ride' : 'Start ride'}
          accessibilityRole="button"
        >
          {/* Rotating gradient wrapper for liquid metal effect */}
          <Animated.View style={[styles.gradientWrapper, animatedGradientStyle]}>
            <LinearGradient
              colors={isRecording ? ['#EF4444', '#DC2626'] : [Colors.brandGreen, Colors.greenDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            />
          </Animated.View>

          {/* Content layer (icon, badge, border) - stays static while gradient rotates */}
          <View style={styles.contentLayer}>
            {/* Border overlay */}
            <View style={[styles.border, isRecording && styles.borderRed]} />

            {/* Icon */}
            <FontAwesome
              name={isRecording ? 'stop-circle' : 'bicycle'}
              size={28}
              color={Colors.textPrimary}
            />

            {/* Elapsed time badge (only when recording) */}
            {isRecording && elapsedSeconds > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{formatElapsedTime(elapsedSeconds)}</Text>
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const BUTTON_SIZE = 64;
const GLOW_GREEN = 'rgba(11, 191, 118, '; // Base green color for glow
const GLOW_RED = 'rgba(239, 68, 68, '; // Red color for recording state

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24, // Center of button (32px radius) aligns with tab bar top edge (56px - 32px = 24px)
    left: '50%',
    marginLeft: -BUTTON_SIZE / 2, // Center horizontally
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Glow layers (positioned absolutely, centered)
  glow: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: GLOW_GREEN + '0.2)', // Default green glow
  },

  glowLayer1: {
    // Inner glow: 0 offset, 12px blur, 2px spread
    shadowColor: GLOW_GREEN + '1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },

  glowLayer2: {
    // Medium glow: 4px offset, 24px blur, 4px spread
    shadowColor: GLOW_GREEN + '1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },

  glowLayer3: {
    // Outer glow: 8px offset, 40px blur, 8px spread
    shadowColor: GLOW_GREEN + '1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 16,
  },

  glowRed: {
    backgroundColor: GLOW_RED + '0.2)',
  },

  buttonWrapper: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    overflow: 'hidden',
    position: 'relative',
  },

  gradientWrapper: {
    position: 'absolute',
    top: -BUTTON_SIZE / 2, // Expand for rotation visibility
    left: -BUTTON_SIZE / 2,
    width: BUTTON_SIZE * 2,
    height: BUTTON_SIZE * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  gradient: {
    width: BUTTON_SIZE * 2,
    height: BUTTON_SIZE * 2,
    borderRadius: BUTTON_SIZE,
  },

  contentLayer: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BUTTON_SIZE / 2,
    borderWidth: 2,
    borderColor: `${Colors.greenLight}4D`, // 30% opacity (#33CC91 at 30%)
  },

  borderRed: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },

  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.errorRed,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 36,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
