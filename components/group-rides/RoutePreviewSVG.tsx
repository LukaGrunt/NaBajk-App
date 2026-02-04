import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { decodePolyline, coordinatesToSVGPath } from '@/utils/polyline';
import Colors from '@/constants/Colors';

interface RoutePreviewSVGProps {
  polyline: string;
  width: number;
  height: number;
  strokeColor?: string;
  strokeWidth?: number;
}

export function RoutePreviewSVG({
  polyline,
  width,
  height,
  strokeColor = Colors.brandGreen,
  strokeWidth = 3,
}: RoutePreviewSVGProps) {
  const pathData = useMemo(() => {
    try {
      const coordinates = decodePolyline(polyline);
      return coordinatesToSVGPath(coordinates, width, height);
    } catch (error) {
      console.error('Failed to decode polyline:', error);
      return '';
    }
  }, [polyline, width, height]);

  if (!pathData) {
    return null;
  }

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Path
          d={pathData}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
