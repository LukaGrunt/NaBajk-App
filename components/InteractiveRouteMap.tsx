import React, { useMemo, useEffect, useState } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { decodePolyline, getPolylineBounds, toGeoJSONLineString } from '@/utils/polyline';

// Lazy import MapLibre to avoid crash on module load
let MapLibreGL: typeof import('@maplibre/maplibre-react-native').default | null = null;

interface InteractiveRouteMapProps {
  polyline: string;
  height?: number;
}

const TILE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export function InteractiveRouteMap({ polyline, height = 300 }: InteractiveRouteMapProps) {
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Initialize MapLibre lazily
  useEffect(() => {
    let mounted = true;

    const initMap = async () => {
      try {
        if (!MapLibreGL) {
          const module = await import('@maplibre/maplibre-react-native');
          MapLibreGL = module.default;
          MapLibreGL.setAccessToken(null);
        }
        if (mounted) setMapReady(true);
      } catch (error) {
        console.warn('MapLibre initialization failed:', error);
        if (mounted) setMapError(true);
      }
    };

    initMap();
    return () => { mounted = false; };
  }, []);
  const mapData = useMemo(() => {
    if (!polyline) return null;

    const decoded = decodePolyline(polyline);
    if (decoded.length < 2) return null;

    const bounds = getPolylineBounds(decoded);
    const geojson = toGeoJSONLineString(decoded);

    return {
      geojson,
      bounds: {
        ne: [bounds.maxLng, bounds.maxLat] as [number, number],
        sw: [bounds.minLng, bounds.minLat] as [number, number],
      },
      start: decoded[0],
      end: decoded[decoded.length - 1],
    };
  }, [polyline]);

  // Empty state - no polyline
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

  // MapLibre not ready or failed - show fallback
  if (!mapReady || mapError || !MapLibreGL || !mapData) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.emptyContainer}>
          <FontAwesome name="map-o" size={40} color={Colors.textMuted} />
          <Text style={styles.emptyText}>{mapError ? 'Map unavailable' : 'Loading map...'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle={TILE_URL}
        attributionEnabled={false}
        logoEnabled={false}
      >
        <MapLibreGL.Camera
          bounds={mapData.bounds}
          padding={{ paddingTop: 40, paddingRight: 40, paddingBottom: 40, paddingLeft: 40 }}
          animationDuration={0}
        />

        <MapLibreGL.ShapeSource id="route" shape={mapData.geojson}>
          {/* Glow layer - wide, transparent stroke behind the main line */}
          <MapLibreGL.LineLayer
            id="route-glow"
            style={{
              lineColor: Colors.brandGreen,
              lineWidth: 10,
              lineOpacity: 0.12,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
          {/* Main route line */}
          <MapLibreGL.LineLayer
            id="route-line"
            style={{
              lineColor: Colors.brandGreen,
              lineWidth: 3,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </MapLibreGL.ShapeSource>

        {/* Start marker - green */}
        <MapLibreGL.PointAnnotation
          id="start"
          coordinate={[mapData.start.lng, mapData.start.lat]}
        >
          <View style={[styles.marker, styles.startMarker]}>
            <View style={styles.markerInner} />
          </View>
        </MapLibreGL.PointAnnotation>

        {/* End marker - orange */}
        <MapLibreGL.PointAnnotation
          id="end"
          coordinate={[mapData.end.lng, mapData.end.lat]}
        >
          <View style={[styles.marker, styles.endMarker]}>
            <View style={styles.markerInner} />
          </View>
        </MapLibreGL.PointAnnotation>
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
  marker: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.cardSurface,
  },
  startMarker: {
    backgroundColor: Colors.brandGreen,
  },
  endMarker: {
    backgroundColor: '#FB923C',
  },
});
