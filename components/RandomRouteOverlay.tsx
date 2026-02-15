import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { Route } from '@/types/Route';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RandomRouteOverlayProps {
  visible: boolean;
  route: Route | null;
  onSelectRoute: (route: Route) => void;
  onDismiss: () => void;
}

export function RandomRouteOverlay({
  visible,
  route,
  onSelectRoute,
  onDismiss,
}: RandomRouteOverlayProps) {
  const { language } = useLanguage();
  const [showCard, setShowCard] = useState(false);

  // Animation values
  const overlayOpacity = useSharedValue(0);
  const bikePosition = useSharedValue(-100);
  const bikeScale = useSharedValue(1);
  const textOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(300);
  const cardScale = useSharedValue(0.8);

  useEffect(() => {
    if (visible && route) {
      // Reset animations
      setShowCard(false);
      overlayOpacity.value = 0;
      bikePosition.value = -100;
      textOpacity.value = 0;
      cardTranslateY.value = 300;
      cardScale.value = 0.8;

      // Start animation sequence
      // 1. Fade in overlay
      overlayOpacity.value = withTiming(1, { duration: 200 });

      // 2. Animate bike across screen
      bikePosition.value = withDelay(
        200,
        withTiming(SCREEN_WIDTH + 100, {
          duration: 1680, // 40% slower than original 1200ms
          easing: Easing.inOut(Easing.ease),
        })
      );

      // 3. Show text
      textOpacity.value = withDelay(300, withTiming(1, { duration: 200 }));

      // 4. After bike animation, show the route card
      setTimeout(() => {
        setShowCard(true);
        textOpacity.value = withTiming(0, { duration: 150 });
        cardTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
        cardScale.value = withSpring(1, { damping: 12, stiffness: 100 });
      }, 1880); // Adjusted for 40% slower bike animation
    }
  }, [visible, route]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const bikeStyle = useAnimatedStyle(() => {
    // Add subtle bounce to the bike
    const bounce = interpolate(
      bikePosition.value,
      [-100, SCREEN_WIDTH / 4, SCREEN_WIDTH / 2, (3 * SCREEN_WIDTH) / 4, SCREEN_WIDTH + 100],
      [0, -8, 0, -8, 0]
    );

    return {
      transform: [
        { translateX: bikePosition.value },
        { translateY: bounce },
        { scale: bikeScale.value },
      ],
    };
  });

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: cardTranslateY.value },
      { scale: cardScale.value },
    ],
  }));

  const handleCardPress = () => {
    if (route) {
      onSelectRoute(route);
    }
  };

  const handleBackdropPress = () => {
    // Animate out
    overlayOpacity.value = withTiming(0, { duration: 200 });
    cardTranslateY.value = withTiming(300, { duration: 200 });
    setTimeout(onDismiss, 200);
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={styles.backdrop} onPress={handleBackdropPress} />

        {/* Animated bike */}
        {!showCard && (
          <Animated.View style={[styles.bikeContainer, bikeStyle]}>
            <Image
              source={require('@/assets/images/logo-navbar.png')}
              style={styles.bikeLogo}
              contentFit="contain"
            />
          </Animated.View>
        )}

        {/* Loading text */}
        {!showCard && (
          <Animated.View style={[styles.textContainer, textStyle]}>
            <Text style={styles.loadingText}>
              {t(language, 'randomPickingRoute')}
            </Text>
          </Animated.View>
        )}

        {/* Route card */}
        {showCard && route && (
          <Animated.View style={[styles.cardContainer, cardStyle]}>
            <Pressable onPress={handleCardPress} style={styles.card}>
              {/* Route image */}
              <Image
                source={route.imageUrl}
                style={styles.cardImage}
                contentFit="cover"
              />

              {/* Route info overlay */}
              <View style={styles.cardOverlay}>
                <Text style={styles.cardTitle}>{route.title}</Text>
                <View style={styles.cardStats}>
                  <Text style={styles.cardStat}>{route.distanceKm} km</Text>
                  <Text style={styles.cardStatDivider}>•</Text>
                  <Text style={styles.cardStat}>{route.elevationM} m</Text>
                  <Text style={styles.cardStatDivider}>•</Text>
                  <Text style={styles.cardStat}>
                    {Math.floor(route.durationMinutes / 60)}h {route.durationMinutes % 60}min
                  </Text>
                </View>
              </View>

              {/* Tap hint */}
              <View style={styles.tapHint}>
                <Text style={styles.tapHintText}>
                  {t(language, 'randomTapToView')}
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.brandGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  bikeContainer: {
    position: 'absolute',
    top: '45%',
    left: 0,
  },
  bikeLogo: {
    width: 240,
    height: 150,
  },
  textContainer: {
    position: 'absolute',
    top: '55%',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cardContainer: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 400,
  },
  card: {
    backgroundColor: Colors.surface1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardOverlay: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardStat: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  cardStatDivider: {
    fontSize: 14,
    color: Colors.textMuted,
    marginHorizontal: 8,
  },
  tapHint: {
    backgroundColor: Colors.brandGreen,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tapHintText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
