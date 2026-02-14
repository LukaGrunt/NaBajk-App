import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';

// TODO: Re-add MapLibre once CocoaPods compatibility is fixed
// For now, show a placeholder - the SVG RouteMap is used elsewhere

interface InteractiveRouteMapProps {
  polyline: string;
  height?: number;
}

export function InteractiveRouteMap({ polyline, height = 300 }: InteractiveRouteMapProps) {
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

  // Placeholder until MapLibre is working
  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.emptyContainer}>
        <FontAwesome name="map" size={40} color={Colors.brandGreen} />
        <Text style={styles.emptyText}>Route map coming soon</Text>
      </View>
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
