/**
 * Decode Google Polyline format to lat/lng coordinates
 * Algorithm: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  const coordinates: Array<{ lat: number; lng: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;

    // Decode latitude
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    // Decode longitude
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return coordinates;
}

/**
 * Calculate bounding box for coordinates
 */
export function getPolylineBounds(coordinates: Array<{ lat: number; lng: number }>): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  if (coordinates.length === 0) {
    return { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 };
  }

  let minLat = coordinates[0].lat;
  let maxLat = coordinates[0].lat;
  let minLng = coordinates[0].lng;
  let maxLng = coordinates[0].lng;

  for (const coord of coordinates) {
    if (coord.lat < minLat) minLat = coord.lat;
    if (coord.lat > maxLat) maxLat = coord.lat;
    if (coord.lng < minLng) minLng = coord.lng;
    if (coord.lng > maxLng) maxLng = coord.lng;
  }

  return { minLat, maxLat, minLng, maxLng };
}

/**
 * Convert lat/lng coordinates to SVG path string
 * Transforms geographic coordinates to SVG coordinate system
 */
export function coordinatesToSVGPath(
  coordinates: Array<{ lat: number; lng: number }>,
  width: number,
  height: number,
  padding: number = 10
): string {
  if (coordinates.length === 0) return '';

  const bounds = getPolylineBounds(coordinates);
  const latRange = bounds.maxLat - bounds.minLat;
  const lngRange = bounds.maxLng - bounds.minLng;

  // Scale to fit SVG dimensions with padding
  const availableWidth = width - 2 * padding;
  const availableHeight = height - 2 * padding;

  const pathData = coordinates
    .map((coord, index) => {
      // Transform lat/lng to SVG x/y (note: SVG y is inverted)
      const x = ((coord.lng - bounds.minLng) / lngRange) * availableWidth + padding;
      const y = ((bounds.maxLat - coord.lat) / latRange) * availableHeight + padding;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  return pathData;
}

/**
 * Convert decoded polyline coordinates to react-native-maps format
 */
export function toMapCoordinates(coordinates: Array<{ lat: number; lng: number }>): Array<{
  latitude: number;
  longitude: number;
}> {
  return coordinates.map((coord) => ({
    latitude: coord.lat,
    longitude: coord.lng,
  }));
}

/**
 * Calculate map region from coordinates for react-native-maps
 */
export function getMapRegion(coordinates: Array<{ lat: number; lng: number }>): {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} {
  if (coordinates.length === 0) {
    // Default to Slovenia
    return {
      latitude: 46.1512,
      longitude: 14.9955,
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    };
  }

  const bounds = getPolylineBounds(coordinates);
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const centerLng = (bounds.minLng + bounds.maxLng) / 2;
  const latDelta = (bounds.maxLat - bounds.minLat) * 1.4; // Add 40% padding
  const lngDelta = (bounds.maxLng - bounds.minLng) * 1.4;

  return {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: Math.max(latDelta, 0.01), // Minimum zoom
    longitudeDelta: Math.max(lngDelta, 0.01),
  };
}

// ── encode ──────────────────────────────────────────────

/** Encode a single signed value into polyline characters */
function encodeValue(value: number): string {
  let v = value < 0 ? ~(value << 1) : (value << 1);
  let out = '';
  while (v >= 0x20) {
    out += String.fromCharCode(((v & 0x1f) | 0x20) + 63);
    v >>>= 5;
  }
  out += String.fromCharCode(v + 63);
  return out;
}

/** Encode lat/lng coordinates into a Google Polyline string */
export function encodePolyline(points: Array<{ lat: number; lng: number }>): string {
  let encoded = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const pt of points) {
    const lat  = Math.round(pt.lat * 1e5);
    const lng  = Math.round(pt.lng * 1e5);
    encoded   += encodeValue(lat - prevLat);
    encoded   += encodeValue(lng - prevLng);
    prevLat    = lat;
    prevLng    = lng;
  }
  return encoded;
}
