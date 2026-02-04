/**
 * ForecastBlock Component
 * A compact hourly forecast card for the weather module
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

// Weather condition types
export type WeatherCondition = 'sunny' | 'cloudy' | 'partly-cloudy' | 'rainy' | 'stormy';

interface ForecastBlockProps {
  time: string;
  tempC: number;
  precipMm: number;
  windKmh: number;
  windArrow: string;
  condition?: WeatherCondition;
  isActive?: boolean;
}

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

export function ForecastBlock({
  time,
  tempC,
  precipMm,
  windKmh,
  windArrow,
  condition = 'partly-cloudy',
  isActive = false,
}: ForecastBlockProps) {
  const icon = getWeatherIcon(condition);

  return (
    <View style={[styles.outer, isActive && styles.outerActive]}>
      <View style={[styles.container, isActive && styles.containerActive]}>
        {/* Active indicator bar */}
        {isActive && <View style={styles.activeIndicator} />}

        {/* Top highlight for 3D effect */}
        <View style={styles.topHighlight} />

        {/* Time */}
        <Text style={styles.time}>{time}</Text>

        {/* Temperature + Icon Row */}
        <View style={styles.tempRow}>
          <FontAwesome
            name={icon.name as any}
            size={14}
            color={icon.color}
            style={styles.icon}
          />
          <Text style={styles.temp}>{tempC}°</Text>
        </View>

        {/* Precipitation */}
        <Text style={styles.precip}>{precipMm} mm</Text>

        {/* Wind */}
        <Text style={styles.wind}>
          <Text style={styles.windArrow}>{windArrow}</Text> {windKmh}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  outerActive: {
    shadowColor: Colors.brandGreen,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  container: {
    width: 65,
    backgroundColor: 'rgba(20, 26, 23, 0.85)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  containerActive: {
    borderWidth: 2,
    borderColor: Colors.brandGreen,
    backgroundColor: 'rgba(0, 188, 124, 0.15)',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: '15%',
    right: '15%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 10,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.brandGreen,
    shadowColor: Colors.brandGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  time: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    marginRight: 3,
  },
  temp: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  precip: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  wind: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  windArrow: {
    color: Colors.textSecondary,
  },
});
