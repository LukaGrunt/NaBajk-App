import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { decodePolyline } from '@/utils/polyline';
import Colors from '@/constants/Colors';

// Configure MapLibre (no access token needed for free tiles)
MapLibreGL.setAccessToken(null);

interface RouteMapProps {
  polyline: string;
  height?: number;
}

export function RouteMap({ polyline, height = 300 }: RouteMapProps) {
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
      paddingTop: 50,
      paddingBottom: 50,
      paddingLeft: 50,
      paddingRight: 50,
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

  if (!polyline || !routeGeoJSON) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.emptyContainer}>
          <FontAwesome name="map-o" size={40} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No route data</Text>
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
              lineWidth: 10,
              lineOpacity: 0.15,
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
              lineWidth: 4,
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
                circleRadius: 8,
                circleColor: Colors.brandGreen,
              }}
            />
            <MapLibreGL.CircleLayer
              id="startCircleInner"
              style={{
                circleRadius: 4,
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
                circleRadius: 8,
                circleColor: '#FB923C',
              }}
            />
            <MapLibreGL.CircleLayer
              id="endCircleInner"
              style={{
                circleRadius: 4,
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
