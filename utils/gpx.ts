/**
 * Parse GPX track points with elevation data.
 * Returns {lat, lng, alt} where alt is null if no <ele> element present.
 */
export function parseGpxWithElevation(
  gpxData: string
): Array<{ lat: number; lng: number; alt: number | null }> {
  const points: Array<{ lat: number; lng: number; alt: number | null }> = [];
  const blockRegex = /<trkpt\b[^>]*lat="([^"]+)"[^>]*lon="([^"]+)"[^>]*>([\s\S]*?)<\/trkpt>/g;
  let m;
  while ((m = blockRegex.exec(gpxData)) !== null) {
    const lat = parseFloat(m[1]);
    const lng = parseFloat(m[2]);
    const eleMatch = m[3].match(/<ele>([^<]+)<\/ele>/);
    const alt = eleMatch ? parseFloat(eleMatch[1]) : null;
    if (!isNaN(lat) && !isNaN(lng)) points.push({ lat, lng, alt });
  }
  return points;
}

/**
 * Parse GPX XML string into lat/lng coordinate array.
 * Handles both <trkpt> (track points) and <wpt> (waypoints).
 */
export function parseGpxToCoordinates(gpxData: string): { lat: number; lng: number }[] {
  const coords: { lat: number; lng: number }[] = [];

  // Prefer track points — these are the actual route path
  const trkptRegex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"/g;
  let match;
  while ((match = trkptRegex.exec(gpxData)) !== null) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng)) coords.push({ lat, lng });
  }

  // Fallback to waypoints if no track points found
  if (coords.length === 0) {
    const wptRegex = /<wpt\s+lat="([^"]+)"\s+lon="([^"]+)"/g;
    while ((match = wptRegex.exec(gpxData)) !== null) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng)) coords.push({ lat, lng });
    }
  }

  return coords;
}

/**
 * Build a minimal GPX XML string from coordinates for export.
 */
export function buildGpxExport(
  coords: { lat: number; lng: number }[],
  title: string
): string {
  const trackPoints = coords
    .map(c => `    <trkpt lat="${c.lat}" lon="${c.lng}"></trkpt>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="NaBajk" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${title}</name></metadata>
  <trk>
    <name>${title}</name>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>`;
}
