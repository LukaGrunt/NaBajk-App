/**
 * Check if a URL is a valid Google Maps link (including shortened links)
 */
export function isGoogleMapsUrl(url: string): boolean {
  return (
    url.includes('maps.google.com') ||
    url.includes('google.com/maps') ||
    url.includes('maps.app.goo.gl') ||
    url.includes('goo.gl/maps')
  );
}

/**
 * Parse Google Maps URL to extract coordinates
 * Supports formats:
 * - https://maps.google.com/?q=46.0569,14.5058
 * - https://www.google.com/maps/place/46.0569,14.5058
 * - https://maps.app.goo.gl/... (app links - accepted but can't extract coords)
 * - https://goo.gl/maps/... (shortened - accepted but can't extract coords)
 * - @lat,lng format
 */
export function parseGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  try {
    // Accept Google Maps app links and shortened links as valid
    // Return null to indicate we can't extract coordinates, but the URL is valid
    if (url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps')) {
      return null;
    }

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
 * Returns null for valid shortened Google Maps links (can't extract coords)
 * Returns coordinates object for parseable formats
 * Returns null for invalid input
 */
export function parseCoordinatesInput(input: string): { lat: number; lng: number } | null {
  const trimmed = input.trim();

  // Check if it's a Google Maps URL (including shortened links)
  if (isGoogleMapsUrl(trimmed)) {
    // Try to parse coordinates from URL
    const fromUrl = parseGoogleMapsUrl(trimmed);
    if (fromUrl && validateCoordinates(fromUrl.lat, fromUrl.lng)) {
      return fromUrl;
    }
    // If it's a valid Google Maps URL but we can't parse coords (shortened link),
    // return a marker value that indicates "valid but unparseable"
    return { lat: 0, lng: 0 };
  }

  // Try as lat,lng string
  const fromString = parseLatLngString(trimmed);
  if (fromString && validateCoordinates(fromString.lat, fromString.lng)) {
    return fromString;
  }

  return null;
}
