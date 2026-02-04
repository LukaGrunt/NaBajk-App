/**
 * RegionalWeatherCard Component
 * A minimal weather module for the Routes screen
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import Colors from '@/constants/Colors';
import { ForecastBlock, WeatherCondition } from './ForecastBlock';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';

// Types
export type ForecastPoint = {
  time: string;
  tempC: number;
  precipMm: number;
  windKmh: number;
  windArrow: string;
  condition: WeatherCondition;
};

// Mock data - hardcoded as specified
const MOCK_FORECAST: ForecastPoint[] = [
  { time: '12:00', tempC: 7, precipMm: 0.0, windKmh: 18, windArrow: '↗', condition: 'sunny' },
  { time: '15:00', tempC: 9, precipMm: 0.4, windKmh: 22, windArrow: '↗', condition: 'partly-cloudy' },
  { time: '18:00', tempC: 6, precipMm: 1.2, windKmh: 16, windArrow: '→', condition: 'rainy' },
  { time: '21:00', tempC: 4, precipMm: 0.0, windKmh: 10, windArrow: '↓', condition: 'cloudy' },
];


interface RegionalWeatherCardProps {
  region?: string;
}

export function RegionalWeatherCard({ region = 'Gorenjska' }: RegionalWeatherCardProps) {
  const { language } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fade-in animation on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={styles.card}>
        <View style={styles.content}>
          {/* Header Row */}
          <View style={styles.header}>
            <Text style={styles.title}>{t(language, 'weather')}: {region}</Text>
            <Text style={styles.sourceMeta}>Vir: ARSO</Text>
          </View>

          {/* Hourly Forecast Row - Centered */}
          <View style={styles.forecastRow}>
            {MOCK_FORECAST.map((forecast, index) => (
              <ForecastBlock
                key={forecast.time}
                time={forecast.time}
                tempC={forecast.tempC}
                precipMm={forecast.precipMm}
                windKmh={forecast.windKmh}
                windArrow={forecast.windArrow}
                condition={forecast.condition}
                isActive={index === 0}
              />
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sourceMeta: {
    fontSize: 11,
    color: Colors.textMuted,
  },

  // Forecast Row - Centered
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
});
