/**
 * RegionalWeatherCard Component
 * A weather status bar for the Routes screen with animated icons
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import Svg, { Circle, Path, G } from 'react-native-svg';
import Colors from '@/constants/Colors';
import { getWeatherForecast, ForecastPoint, WeatherCondition } from '@/lib/weatherService';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';

// Animated Sun Icon
function AnimatedSun({ size = 28 }: { size?: number }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 10000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Circle cx="12" cy="12" r="5" fill="#FFD93D" />
        {/* Sun rays */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <Path
            key={angle}
            d={`M12 ${2} L12 ${5}`}
            stroke="#FFD93D"
            strokeWidth={2}
            strokeLinecap="round"
            transform={`rotate(${angle} 12 12)`}
          />
        ))}
      </Svg>
    </Animated.View>
  );
}

// Animated Cloud Icon
function AnimatedCloud({ size = 28 }: { size?: number }) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(3, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-3, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A6.004 6.004 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
          fill={Colors.textSecondary}
          transform="translate(0, 2)"
        />
      </Svg>
    </Animated.View>
  );
}

// Animated Rain Icon
function AnimatedRain({ size = 28 }: { size?: number }) {
  const drop1Y = useSharedValue(0);
  const drop2Y = useSharedValue(0);
  const drop3Y = useSharedValue(0);

  useEffect(() => {
    drop1Y.value = withRepeat(
      withTiming(4, { duration: 600, easing: Easing.linear }),
      -1,
      false
    );
    setTimeout(() => {
      drop2Y.value = withRepeat(
        withTiming(4, { duration: 600, easing: Easing.linear }),
        -1,
        false
      );
    }, 200);
    setTimeout(() => {
      drop3Y.value = withRepeat(
        withTiming(4, { duration: 600, easing: Easing.linear }),
        -1,
        false
      );
    }, 400);
  }, []);

  const drop1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: drop1Y.value }],
    opacity: 1 - drop1Y.value / 5,
  }));

  const drop2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: drop2Y.value }],
    opacity: 1 - drop2Y.value / 5,
  }));

  const drop3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: drop3Y.value }],
    opacity: 1 - drop3Y.value / 5,
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Cloud */}
      <Svg width={size * 0.9} height={size * 0.5} viewBox="0 0 24 12" style={{ position: 'absolute', top: 0 }}>
        <Path
          d="M19.35 5.04A5.5 5.5 0 0012 0C9.11 0 6.6 1.14 5.35 3.04A4.5 4.5 0 001 8c0 2.21 1.79 4 4 4h13c2.21 0 4-1.79 4-4 0-2.14-1.68-3.88-3.65-3.96z"
          fill={Colors.textSecondary}
        />
      </Svg>
      {/* Rain drops */}
      <View style={{ flexDirection: 'row', position: 'absolute', bottom: 2, gap: 4 }}>
        <Animated.View style={drop1Style}>
          <Svg width={4} height={8} viewBox="0 0 4 8">
            <Path d="M2 0 L4 6 Q2 8 0 6 Z" fill="#6CB4EE" />
          </Svg>
        </Animated.View>
        <Animated.View style={drop2Style}>
          <Svg width={4} height={8} viewBox="0 0 4 8">
            <Path d="M2 0 L4 6 Q2 8 0 6 Z" fill="#6CB4EE" />
          </Svg>
        </Animated.View>
        <Animated.View style={drop3Style}>
          <Svg width={4} height={8} viewBox="0 0 4 8">
            <Path d="M2 0 L4 6 Q2 8 0 6 Z" fill="#6CB4EE" />
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}

// Get animated weather icon component
function WeatherIcon({ condition, size = 28 }: { condition: WeatherCondition; size?: number }) {
  switch (condition) {
    case 'sunny':
      return <AnimatedSun size={size} />;
    case 'cloudy':
    case 'partly-cloudy':
      return <AnimatedCloud size={size} />;
    case 'rainy':
    case 'stormy':
      return <AnimatedRain size={size} />;
    default:
      return <AnimatedCloud size={size} />;
  }
}

export function RegionalWeatherCard() {
  const { language } = useLanguage();
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeather();
  }, []);

  const loadWeather = async () => {
    try {
      const data = await getWeatherForecast('gorenjska');
      setForecast(data);
    } catch (error) {
      console.warn('Failed to load weather:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="small" color={Colors.textMuted} />
      </View>
    );
  }

  if (forecast.length === 0) {
    return null;
  }

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.container}>
      <View style={styles.strip}>
        {forecast.map((item, index) => {
          const isActive = index === 0;

          return (
            <React.Fragment key={item.time}>
              <View style={[styles.column, isActive && styles.columnActive]}>
                {/* Time */}
                <Text style={styles.time}>{item.isNow ? t(language, 'weatherNow') : item.time}</Text>

                {/* Icon + Temperature in one row */}
                <View style={styles.iconTempRow}>
                  <WeatherIcon condition={item.condition} size={24} />
                  <Text style={styles.temp}>{item.tempC}°</Text>
                </View>

                {/* Precip + Wind combined */}
                <Text style={styles.details}>
                  {item.precipMm}mm · {item.windArrow}{item.windKmh}
                </Text>
              </View>

              {/* Divider (not after last item) */}
              {index < forecast.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          );
        })}

        {/* MET Norway Attribution - inside box */}
        <Text style={styles.attribution}>MET Norway</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  loadingContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  strip: {
    flexDirection: 'row',
    backgroundColor: Colors.surface1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    position: 'relative',
  },
  column: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  columnActive: {
    backgroundColor: Colors.surface2,
  },
  divider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 2,
  },
  time: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  iconTempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  temp: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  details: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textMuted,
  },
  attribution: {
    position: 'absolute',
    bottom: 4,
    right: 8,
    fontSize: 8,
    fontWeight: '400',
    color: Colors.textMuted,
    opacity: 0.6,
  },
});
