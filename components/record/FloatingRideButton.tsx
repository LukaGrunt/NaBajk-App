import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Pressable, Text, Modal } from 'react-native';
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
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { useRideRecorder, startRecording } from '@/lib/rideRecorder';
import { AnimatedRing } from './AnimatedRing';

/**
 * "The Beacon" — Floating Action Button for starting/managing rides
 *
 * Features:
 * - Layered glow effect (3 shadow layers)
 * - Press animation: scale + haptic + glow intensify
 * - Idle breathing animation (pulses after 5s idle)
 * - Active ride state: red pulse + elapsed timer badge
 * - Long press / tap when idle: shows Record vs Upload GPX menu
 */
export function FloatingRideButton() {
  const router = useRouter();
  const { state } = useRideRecorder();
  const [menuOpen, setMenuOpen] = useState(false);
  const [climbConfirmVisible, setClimbConfirmVisible] = useState(false);
  const closeMenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derive recording state from singleton
  const isRecording = state.status === 'recording';
  const elapsedSeconds = state.elapsedSeconds;

  // FAB animation values
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.2);
  const breathingOpacity = useSharedValue(0.2);
  const pulseScale = useSharedValue(1);
  const gradientRotation = useSharedValue(0);

  // Menu animation values
  const backdropOpacity = useSharedValue(0);
  const card1Y = useSharedValue(40);
  const card1Opacity = useSharedValue(0);
  const card2Y = useSharedValue(40);
  const card2Opacity = useSharedValue(0);
  const card3Y = useSharedValue(40);
  const card3Opacity = useSharedValue(0);

  // Idle breathing animation - starts after component mounts
  useEffect(() => {
    if (!isRecording) {
      const timeout = setTimeout(() => {
        breathingOpacity.value = withRepeat(
          withSequence(
            withTiming(0.15, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.25, { duration: 1500, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
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
        -1,
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
        duration: 4000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const openMenu = () => {
    setMenuOpen(true);
    backdropOpacity.value = withTiming(1, { duration: 250 });
    card1Y.value = withSpring(0, { damping: 18, stiffness: 250 });
    card1Opacity.value = withTiming(1, { duration: 200 });
    card2Y.value = withDelay(80, withSpring(0, { damping: 18, stiffness: 250 }));
    card2Opacity.value = withDelay(80, withTiming(1, { duration: 200 }));
    card3Y.value = withDelay(160, withSpring(0, { damping: 18, stiffness: 250 }));
    card3Opacity.value = withDelay(160, withTiming(1, { duration: 200 }));
  };

  const closeMenu = (onClosed?: () => void) => {
    backdropOpacity.value = withTiming(0, { duration: 200 });
    card1Y.value = withTiming(30, { duration: 180 });
    card1Opacity.value = withTiming(0, { duration: 150 });
    card2Y.value = withTiming(30, { duration: 180 });
    card2Opacity.value = withTiming(0, { duration: 150 });
    card3Y.value = withTiming(30, { duration: 180 });
    card3Opacity.value = withTiming(0, { duration: 150 });
    if (closeMenuTimerRef.current) clearTimeout(closeMenuTimerRef.current);
    closeMenuTimerRef.current = setTimeout(() => {
      setMenuOpen(false);
      card1Y.value = 40;
      card2Y.value = 40;
      card3Y.value = 40;
      onClosed?.();
    }, 220);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (closeMenuTimerRef.current) clearTimeout(closeMenuTimerRef.current);
    };
  }, []);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isRecording) {
      router.push('/recording');
      return;
    }

    if (menuOpen) {
      closeMenu();
      return;
    }

    // Scale press animation
    scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
    glowOpacity.value = withTiming(0.4, { duration: 150 });
    openMenu();
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      glowOpacity.value = withTiming(0.2, { duration: 300 });
    }, 150);
  };

  const handleRecord = () => {
    if (state.status === 'stopped') {
      // Unsaved ride exists — go to summary, don't start a new recording
      closeMenu(() => router.replace('/ride-summary'));
      return;
    }
    startRecording(); // fire-and-forget — recording screen handles first-launch / permission flow
    closeMenu(() => router.push('/recording'));
  };

  const handleUploadGpx = () => {
    closeMenu(() => router.push('/upload-route'));
  };

  const handleClimbPress = () => {
    closeMenu(() => setClimbConfirmVisible(true));
  };

  const handleClimbConfirm = () => {
    setClimbConfirmVisible(false);
    startRecording();
    router.push('/recording?isClimb=true');
  };

  // Animated styles
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulseScale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const animatedBreathingStyle = useAnimatedStyle(() => ({
    opacity: breathingOpacity.value,
  }));

  const animatedGradientStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${gradientRotation.value}rad` }],
  }));

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const card1AnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: card1Y.value }],
    opacity: card1Opacity.value,
  }));

  const card2AnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: card2Y.value }],
    opacity: card2Opacity.value,
  }));

  const card3AnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: card3Y.value }],
    opacity: card3Opacity.value,
  }));

  // Format elapsed time for badge
  const formatElapsedTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Climb confirmation modal */}
      <Modal transparent visible={climbConfirmVisible} statusBarTranslucent animationType="fade">
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Snemaš vzpon</Text>
            <Text style={styles.confirmBody}>
              {'Snemaj samo vzpon — od dna do vrha.\n\nPrimer: Vršič (24 km, 1.200 m↑) — začneš pri Soči in snemaš do vrha pasov. Ko dosežeš vrh, ustavi snemanje.'}
            </Text>
            <View style={styles.confirmButtons}>
              <Pressable style={styles.confirmCancel} onPress={() => setClimbConfirmVisible(false)}>
                <Text style={styles.confirmCancelText}>Prekliči</Text>
              </Pressable>
              <Pressable style={styles.confirmStart} onPress={handleClimbConfirm}>
                <Text style={styles.confirmStartText}>Začni vzpon</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Action menu overlay */}
      <Modal transparent visible={menuOpen} statusBarTranslucent animationType="none">
        <View style={StyleSheet.absoluteFill}>
          {/* Dark backdrop — tap to close */}
          <Pressable style={StyleSheet.absoluteFill} onPress={() => closeMenu()}>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.backdrop,
                backdropAnimStyle,
              ]}
            />
          </Pressable>

          {/* Two action cards - sibling to backdrop so touches don't close it */}
          <View style={styles.menuCardsContainer} pointerEvents="box-none">
            {/* Hint text */}
            <Animated.View style={[styles.hintContainer, card1AnimStyle]}>
              <Text style={styles.hintText}>
                {'GPX datoteka na računalniku? Pot naloži prek '}
                <Text style={styles.hintLink}>www.nabajk.si</Text>
                {' — podpiramo oba načina.'}
              </Text>
            </Animated.View>

            {/* Cards — row 1: Snemaj + Vzpon */}
            <View style={styles.menuCardsRow}>
              {/* Record card */}
              <Animated.View style={card1AnimStyle}>
                <Pressable
                  style={({ pressed }) => [styles.menuCard, pressed && styles.cardPressed]}
                  onPress={handleRecord}
                >
                  <LinearGradient
                    colors={[Colors.brandGreen, Colors.greenDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFill, styles.cardGradient]}
                  />
                  <View style={styles.cardGlowBorder} />
                  <FontAwesome name="bicycle" size={38} color="#FFFFFF" style={styles.cardIcon} />
                  <Text style={styles.cardTitle}>Snemaj</Text>
                  <Text style={[styles.cardSubtitle, { color: 'rgba(255,255,255,0.7)' }]}>
                    Začni vožnjo
                  </Text>
                </Pressable>
              </Animated.View>

              {/* Climb card */}
              <Animated.View style={card2AnimStyle}>
                <Pressable
                  style={({ pressed }) => [styles.menuCard, pressed && styles.cardPressed]}
                  onPress={handleClimbPress}
                >
                  <LinearGradient
                    colors={['#FF6B35', '#CC0000']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFill, styles.cardGradient]}
                  />
                  <View style={styles.cardGlowBorder} />
                  <FontAwesome name="area-chart" size={38} color="#FFFFFF" style={styles.cardIcon} />
                  <Text style={styles.cardTitle}>Vzpon</Text>
                  <Text style={[styles.cardSubtitle, { color: 'rgba(255,255,255,0.7)' }]}>
                    Snemaj vzpon
                  </Text>
                </Pressable>
              </Animated.View>
            </View>

            {/* Row 2: Upload GPX */}
            <Animated.View style={card3AnimStyle}>
              <Pressable
                style={({ pressed }) => [styles.menuCard, styles.menuCardUpload, styles.menuCardWide, pressed && styles.cardPressed]}
                onPress={handleUploadGpx}
              >
                <View style={styles.uploadGlowBorder} />
                <FontAwesome name="upload" size={28} color={Colors.brandGreen} style={styles.cardIcon} />
                <Text style={styles.cardTitle}>Naloži GPX</Text>
                <Text style={styles.cardSubtitle}>Uvozi pot</Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </Modal>

      {/* The FAB */}
      <View style={styles.container}>
        {/* Layer 3: Largest glow */}
        <Animated.View
          style={[styles.glow, styles.glowLayer3, isRecording && styles.glowRed, animatedBreathingStyle]}
        />
        {/* Layer 2: Medium glow */}
        <Animated.View
          style={[styles.glow, styles.glowLayer2, isRecording && styles.glowRed, animatedBreathingStyle]}
        />
        {/* Layer 1: Inner glow */}
        <Animated.View
          style={[styles.glow, styles.glowLayer1, isRecording && styles.glowRed, animatedGlowStyle]}
        />

        {!isRecording && !menuOpen && <AnimatedRing size={64} />}

        {/* Main button */}
        <Animated.View style={[styles.buttonWrapper, animatedButtonStyle]}>
          <Pressable
            onPress={handlePress}
            accessibilityLabel={
              isRecording ? 'View active ride' : menuOpen ? 'Close menu' : 'Start or upload ride'
            }
            accessibilityRole="button"
          >
            {/* Rotating gradient wrapper */}
            <Animated.View style={[styles.gradientWrapper, animatedGradientStyle]}>
              <LinearGradient
                colors={isRecording ? ['#EF4444', '#DC2626'] : [Colors.brandGreen, Colors.greenDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
              />
            </Animated.View>

            {/* Content layer */}
            <View style={styles.contentLayer}>
              <View style={[styles.border, isRecording && styles.borderRed]} />
              <FontAwesome
                name={menuOpen ? 'times' : isRecording ? 'stop-circle' : 'bicycle'}
                size={28}
                color={Colors.textPrimary}
              />
              {isRecording && elapsedSeconds > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{formatElapsedTime(elapsedSeconds)}</Text>
                </View>
              )}
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </>
  );
}

const BUTTON_SIZE = 64;
const CARD_SIZE = 150;
const GLOW_GREEN = 'rgba(11, 191, 118, ';
const GLOW_RED = 'rgba(239, 68, 68, ';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    marginLeft: -BUTTON_SIZE / 2,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Backdrop
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
  },

  // Menu cards container
  menuCardsContainer: {
    position: 'absolute',
    bottom: 145,
    left: 0,
    right: 0,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 24,
  },

  menuCardsRow: {
    flexDirection: 'row',
    gap: 14,
  },

  hintContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    maxWidth: 320,
  },

  hintText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 19,
  },

  hintLink: {
    color: Colors.brandGreen,
    fontWeight: '600',
  },

  menuCard: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  menuCardUpload: {
    backgroundColor: Colors.surface1,
  },

  menuCardWide: {
    width: CARD_SIZE * 2 + 14, // two cards + gap between them
    height: 72,
    flexDirection: 'row',
    gap: 12,
  },

  cardPressed: {
    opacity: 0.85,
  },

  cardGradient: {
    borderRadius: 22,
  },

  // Subtle inner glow border for Record card
  cardGlowBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },

  // Subtle green border for Upload card
  uploadGlowBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: `${Colors.brandGreen}55`,
  },

  cardIcon: {
    marginBottom: 10,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  cardSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textSecondary,
  },

  // Glow layers
  glow: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: GLOW_GREEN + '0.2)',
  },

  glowLayer1: {
    shadowColor: GLOW_GREEN + '1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },

  glowLayer2: {
    shadowColor: GLOW_GREEN + '1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },

  glowLayer3: {
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
    top: -BUTTON_SIZE / 2,
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
    borderColor: `${Colors.greenLight}4D`,
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

  // Climb confirmation modal
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmCard: {
    backgroundColor: Colors.cardSurface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  confirmBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmCancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  confirmStart: {
    flex: 1,
    backgroundColor: Colors.brandGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmStartText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
