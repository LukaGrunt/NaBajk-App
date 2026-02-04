import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { decodePolyline, coordinatesToSVGPath, getPolylineBounds } from '@/utils/polyline';

interface RouteMapProps {
  polyline: string;
  height?: number;
}

export function RouteMap({ polyline, height = 300 }: RouteMapProps) {
  const [containerWidth, setContainerWidth] = useState(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const mapData = useMemo(() => {
    if (!polyline || containerWidth === 0) return null;

    const decoded = decodePolyline(polyline);
    if (decoded.length < 2) return null;

    const padding = 28;
    const path = coordinatesToSVGPath(decoded, containerWidth, height, padding);

    // Compute start & end markers in the same SVG coordinate space
    const bounds  = getPolylineBounds(decoded);
    const availW  = containerWidth - 2 * padding;
    const availH  = height - 2 * padding;
    const latRange = bounds.maxLat - bounds.minLat || 1e-5;
    const lngRange = bounds.maxLng - bounds.minLng || 1e-5;

    const toSVG = (coord: { lat: number; lng: number }) => ({
      x: ((coord.lng - bounds.minLng) / lngRange) * availW + padding,
      y: ((bounds.maxLat - coord.lat) / latRange) * availH + padding,
    });

    return {
      path,
      start: toSVG(decoded[0]),
      end:   toSVG(decoded[decoded.length - 1]),
    };
  }, [polyline, containerWidth, height]);

  /* ── empty state ──────────────────────────────────── */
  if (!polyline) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.emptyContainer}>
          <FontAwesome name="map-o" size={40} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No route data</Text>
        </View>
      </View>
    );
  }

  /* ── SVG route preview ────────────────────────────── */
  return (
    <View style={[styles.container, { height }]} onLayout={handleLayout}>
      {mapData ? (
        <Svg width={containerWidth} height={height} style={styles.svg}>
          {/* Glow layer — wide, transparent stroke behind the main line */}
          <Path
            d={mapData.path}
            stroke={Colors.brandGreen}
            strokeWidth={10}
            strokeOpacity={0.12}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Main route line */}
          <Path
            d={mapData.path}
            stroke={Colors.brandGreen}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Start marker — green ring */}
          <Circle cx={mapData.start.x} cy={mapData.start.y} r={7}  fill={Colors.brandGreen} />
          <Circle cx={mapData.start.x} cy={mapData.start.y} r={3.5} fill={Colors.cardSurface} />

          {/* End marker — warm orange ring */}
          <Circle cx={mapData.end.x} cy={mapData.end.y} r={7}  fill="#FB923C" />
          <Circle cx={mapData.end.x} cy={mapData.end.y} r={3.5} fill={Colors.cardSurface} />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width:            '100%',
    borderRadius:     16,
    overflow:         'hidden',
    backgroundColor:  Colors.cardSurface,
  },
  svg: {
    backgroundColor: Colors.cardSurface,
  },

  /* empty */
  emptyContainer: {
    flex:            1,
    justifyContent:  'center',
    alignItems:      'center',
  },
  emptyText: {
    fontSize:  14,
    color:     Colors.textMuted,
    marginTop: 10,
  },
});
