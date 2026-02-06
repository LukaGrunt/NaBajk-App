/**
 * RegionalWeatherCard Component
 * A minimal weather status bar for the Routes screen
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

// Weather condition types
type WeatherCondition = 'sunny' | 'cloudy' | 'partly-cloudy' | 'rainy' | 'stormy';

type ForecastPoint = {
  time: string;
  tempC: number;
  precipMm: number;
  windKmh: number;
  windArrow: string;
  condition: WeatherCondition;
};

// Map condition to FontAwesome icon
function getWeatherIcon(condition: WeatherCondition): { name: string; color: string } {
  switch (condition) {
    case 'sunny':
      return { name: 'sun-o', color: '#FFD93D' };
    case 'cloudy':
      return { name: 'cloud', color: Colors.textSecondary };
    case 'partly-cloudy':
      return { name: 'cloud', color: Colors.textMuted };
    case 'rainy':
      return { name: 'tint', color: '#6CB4EE' };
    case 'stormy':
      return { name: 'bolt', color: '#FFD93D' };
    default:
      return { name: 'cloud', color: Colors.textMuted };
  }
}

// Mock data
const MOCK_FORECAST: ForecastPoint[] = [
  { time: '12:00', tempC: 7, precipMm: 0.0, windKmh: 18, windArrow: '↗', condition: 'sunny' },
  { time: '15:00', tempC: 9, precipMm: 0.4, windKmh: 22, windArrow: '↗', condition: 'partly-cloudy' },
  { time: '18:00', tempC: 6, precipMm: 1.2, windKmh: 16, windArrow: '→', condition: 'rainy' },
];

export function RegionalWeatherCard() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.strip}>
        {MOCK_FORECAST.map((forecast, index) => {
          const icon = getWeatherIcon(forecast.condition);
          const isActive = index === 0;

          return (
            <React.Fragment key={forecast.time}>
              <View style={[styles.column, isActive && styles.columnActive]}>
                {/* Time */}
                <Text style={styles.time}>{forecast.time}</Text>

                {/* Icon + Temp row */}
                <View style={styles.iconTempRow}>
                  <FontAwesome
                    name={icon.name as any}
                    size={16}
                    color={icon.color}
                    style={styles.icon}
                  />
                  <Text style={styles.temp}>{forecast.tempC}°</Text>
                </View>

                {/* Precip + Wind combined */}
                <Text style={styles.details}>
                  {forecast.precipMm} mm · {forecast.windArrow} {forecast.windKmh}
                </Text>
              </View>

              {/* Divider (not after last item) */}
              {index < MOCK_FORECAST.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  strip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  columnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4,
  },
  time: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textMuted,
    marginBottom: 6,
  },
  iconTempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    marginRight: 4,
  },
  temp: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  details: {
    fontSize: 10,
    color: Colors.textMuted,
  },
});
