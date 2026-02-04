/**
 * Parse Google Maps URL to extract coordinates
 * Supports formats:
 * - https://maps.google.com/?q=46.0569,14.5058
 * - https://www.google.com/maps/place/46.0569,14.5058
 * - https://goo.gl/maps/... (shortened - best effort)
 */
export function parseGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  try {
    // Try query parameter format
    const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) {
      return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    }

    // Try path format
    const pathMatch = url.match(/\/(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (pathMatch) {
      return { lat: parseFloat(pathMatch[1]), lng: parseFloat(pathMatch[2]) };
    }

    // Try @lat,lng format
    const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parse "lat, lng" or "lat,lng" string to coordinates
 */
export function parseLatLngString(input: string): { lat: number; lng: number } | null {
  try {
    const cleaned = input.trim();
    const parts = cleaned.split(/,\s*/);

    if (parts.length !== 2) return null;

    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);

    if (isNaN(lat) || isNaN(lng)) return null;

    return { lat, lng };
  } catch {
    return null;
  }
}

/**
 * Validate coordinates are within reasonable bounds
 */
export function validateCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Parse coordinates from user input (try URL first, then string)
 */
export function parseCoordinatesInput(input: string): { lat: number; lng: number } | null {
  // Try as Google Maps URL
  const fromUrl = parseGoogleMapsUrl(input);
  if (fromUrl && validateCoordinates(fromUrl.lat, fromUrl.lng)) {
    return fromUrl;
  }

  // Try as lat,lng string
  const fromString = parseLatLngString(input);
  if (fromString && validateCoordinates(fromString.lat, fromString.lng)) {
    return fromString;
  }

  return null;
}
