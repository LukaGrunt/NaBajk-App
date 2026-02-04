import * as FileSystem from 'expo-file-system/legacy';
import type { RecordedPoint } from './rideRecorder';

// ── XML helpers ──────────────────────────────────────────

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
}

// ── GPX builder ──────────────────────────────────────────

function buildGPX(points: readonly RecordedPoint[], name: string): string {
  const trkpts = points.map(p => {
    const time = new Date(p.timestamp).toISOString();
    const ele  = p.alt !== undefined
      ? `\n        <ele>${p.alt.toFixed(1)}</ele>`
      : '';
    return (
      `      <trkpt lat="${p.lat.toFixed(6)}" lon="${p.lng.toFixed(6)}">${ele}\n` +
      `        <time>${time}</time>\n` +
      `      </trkpt>`
    );
  }).join('\n');

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<gpx version="1.1" creator="NaBajk" xmlns="http://www.topografix.com/GPX/1/1">\n` +
    `  <trk>\n` +
    `    <name>${escapeXml(name)}</name>\n` +
    `    <trkseg>\n` +
    trkpts + '\n' +
    `    </trkseg>\n` +
    `  </trk>\n` +
    `</gpx>\n`
  );
}

// ── public ───────────────────────────────────────────────

/**
 * Generate a GPX file from recorded points and write it to the app's
 * document directory.  Returns the local file URI.
 *
 * TODO: Upload to Supabase Storage after the ride is saved:
 *
 *   const { data } = await supabase.storage
 *     .from('gpx-files')
 *     .upload(fileName, gpxString, { contentType: 'application/gpx+xml' });
 */
export async function generateAndSaveGPX(
  points: readonly RecordedPoint[],
  name:   string,
): Promise<string> {
  const xml      = buildGPX(points, name);
  const fileName = `nabajk_${Date.now()}.gpx`;
  const uri      = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(uri, xml, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return uri;
}
