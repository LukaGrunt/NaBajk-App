import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { decodePolyline } from '@/utils/polyline';

// Configure MapLibre (no access token needed for free tiles)
MapLibreGL.setAccessToken(null);

interface InteractiveRouteMapProps {
  polyline: string;
  height?: number;
}

export function InteractiveRouteMap({ polyline, height = 300 }: InteractiveRouteMapProps) {
  const routeGeoJSON = useMemo(() => {
    if (!polyline) return null;

    const decoded = decodePolyline(polyline);
    if (decoded.length < 2) return null;

    // Convert to [lng, lat] format (GeoJSON format)
    const coordinates = decoded.map(coord => [coord.lng, coord.lat]);

    return {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates,
      },
      properties: {},
    };
  }, [polyline]);

  const bounds = useMemo(() => {
    if (!routeGeoJSON) return null;

    const coords = routeGeoJSON.geometry.coordinates;
    const lngs = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);

    return {
      ne: [Math.max(...lngs), Math.max(...lats)] as [number, number],
      sw: [Math.min(...lngs), Math.min(...lats)] as [number, number],
      paddingTop: 60,
      paddingBottom: 60,
      paddingLeft: 60,
      paddingRight: 60,
    };
  }, [routeGeoJSON]);

  // Start and end markers
  const startPoint = useMemo(() => {
    if (!routeGeoJSON) return null;
    const coords = routeGeoJSON.geometry.coordinates;
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: coords[0],
      },
      properties: { type: 'start' },
    };
  }, [routeGeoJSON]);

  const endPoint = useMemo(() => {
    if (!routeGeoJSON) return null;
    const coords = routeGeoJSON.geometry.coordinates;
    return {
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: coords[coords.length - 1],
      },
      properties: { type: 'end' },
    };
  }, [routeGeoJSON]);

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

  if (!routeGeoJSON) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.emptyContainer}>
          <FontAwesome name="map" size={40} color={Colors.brandGreen} />
          <Text style={styles.emptyText}>Loading map...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle="https://tiles.openfreemap.org/styles/liberty"
        logoEnabled={false}
        attributionEnabled={false}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        <MapLibreGL.Camera
          bounds={bounds!}
          animationDuration={0}
        />

        {/* Route line with glow effect */}
        <MapLibreGL.ShapeSource id="routeGlow" shape={routeGeoJSON}>
          <MapLibreGL.LineLayer
            id="routeLineGlow"
            style={{
              lineColor: Colors.brandGreen,
              lineWidth: 12,
              lineOpacity: 0.2,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </MapLibreGL.ShapeSource>

        <MapLibreGL.ShapeSource id="routeSource" shape={routeGeoJSON}>
          <MapLibreGL.LineLayer
            id="routeLine"
            style={{
              lineColor: Colors.brandGreen,
              lineWidth: 5,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </MapLibreGL.ShapeSource>

        {/* Start marker - green */}
        {startPoint && (
          <MapLibreGL.ShapeSource id="startPoint" shape={startPoint}>
            <MapLibreGL.CircleLayer
              id="startCircleOuter"
              style={{
                circleRadius: 10,
                circleColor: Colors.brandGreen,
              }}
            />
            <MapLibreGL.CircleLayer
              id="startCircleInner"
              style={{
                circleRadius: 5,
                circleColor: '#FFFFFF',
              }}
            />
          </MapLibreGL.ShapeSource>
        )}

        {/* End marker - orange */}
        {endPoint && (
          <MapLibreGL.ShapeSource id="endPoint" shape={endPoint}>
            <MapLibreGL.CircleLayer
              id="endCircleOuter"
              style={{
                circleRadius: 10,
                circleColor: '#FB923C',
              }}
            />
            <MapLibreGL.CircleLayer
              id="endCircleInner"
              style={{
                circleRadius: 5,
                circleColor: '#FFFFFF',
              }}
            />
          </MapLibreGL.ShapeSource>
        )}
      </MapLibreGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.cardSurface,
  },
  map: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 10,
  },
});
