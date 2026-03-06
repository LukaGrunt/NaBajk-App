/**
 * elevationCorrection – replace GPS altitudes with DEM values from Open Topo Data.
 *
 * GPS vertical accuracy is ±10–30 m; even with smoothing it causes massive
 * over-reporting of elevation gain. SRTM 30 m DEM data is accurate to ±1–3 m,
 * which is the same approach Strava / RideWithGPS use for "elevation correction".
 *
 * API: https://api.opentopodata.org/v1/srtm30m  (free, no key, 100 pts/req, 1 req/s)
 * Falls back to original GPS altitudes on any error.
 */

import type { RecordedPoint } from './rideRecorder';

// ── constants ─────────────────────────────────────────────────────────────────

const SAMPLE_INTERVAL_M = 50;   // downsample to ~1 point per 50 m
const BATCH_SIZE        = 100;  // API max per request
const API_TIMEOUT_MS    = 15000;

// ── haversine (local copy to avoid circular import) ───────────────────────────

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R    = 6371000;
  const toR  = (d: number) => d * Math.PI / 180;
  const dLat = toR(lat2 - lat1);
  const dLng = toR(lng2 - lng1);
  const a    = Math.sin(dLat / 2) ** 2 +
               Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── downsample ────────────────────────────────────────────────────────────────

/** Keep one point per SAMPLE_INTERVAL_M metres (plus always first & last). */
function downsample(points: RecordedPoint[]): { point: RecordedPoint; originalIndex: number }[] {
  if (points.length === 0) return [];

  const result: { point: RecordedPoint; originalIndex: number }[] = [
    { point: points[0], originalIndex: 0 },
  ];
  let accumulated = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    accumulated += haversine(prev.lat, prev.lng, points[i].lat, points[i].lng);
    if (accumulated >= SAMPLE_INTERVAL_M) {
      result.push({ point: points[i], originalIndex: i });
      accumulated = 0;
    }
  }

  // Always include last point
  const lastIdx = points.length - 1;
  if (result[result.length - 1].originalIndex !== lastIdx) {
    result.push({ point: points[lastIdx], originalIndex: lastIdx });
  }

  return result;
}

// ── API call ──────────────────────────────────────────────────────────────────

async function fetchDemElevations(samples: RecordedPoint[]): Promise<number[]> {
  const locations = samples.map(p => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join('|');
  const url = `https://api.opentopodata.org/v1/srtm30m?locations=${locations}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.status !== 'OK' || !Array.isArray(json.results)) {
      throw new Error('Unexpected API response');
    }
    return (json.results as { elevation: number | null }[]).map(r =>
      typeof r.elevation === 'number' ? r.elevation : NaN
    );
  } finally {
    clearTimeout(timeout);
  }
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Replace `alt` on each RecordedPoint with DEM elevation from SRTM 30 m.
 * On any network or API error, returns the original points unchanged.
 */
export async function correctElevations(points: RecordedPoint[]): Promise<RecordedPoint[]> {
  if (points.length < 2) return points;

  try {
    // 1. Downsample to reduce API calls
    const sampled = downsample(points);

    // 2. Batch into chunks of BATCH_SIZE
    const batches: typeof sampled[] = [];
    for (let i = 0; i < sampled.length; i += BATCH_SIZE) {
      batches.push(sampled.slice(i, i + BATCH_SIZE));
    }

    // 3. Fetch each batch sequentially (API rate limit: 1 req/s)
    const demElevations: number[] = [];
    for (let b = 0; b < batches.length; b++) {
      if (b > 0) await new Promise(r => setTimeout(r, 1100)); // respect 1 req/s
      const elevs = await fetchDemElevations(batches[b].map(s => s.point));
      demElevations.push(...elevs);
    }

    // 4. Build a map: originalIndex → DEM elevation
    const demMap = new Map<number, number>();
    sampled.forEach((s, i) => {
      const elev = demElevations[i];
      if (!isNaN(elev)) demMap.set(s.originalIndex, elev);
    });

    if (demMap.size === 0) return points; // all NaN → fallback

    // 5. Interpolate DEM elevations for every original point
    //    Find the two nearest sampled indices and lerp between them
    const sampledIndices = sampled.map(s => s.originalIndex);

    const corrected = points.map((p, i) => {
      // Find surrounding sampled indices
      let lo = 0;
      let hi = sampledIndices.length - 1;
      for (let k = 0; k < sampledIndices.length - 1; k++) {
        if (sampledIndices[k] <= i && sampledIndices[k + 1] >= i) {
          lo = k;
          hi = k + 1;
          break;
        }
      }
      const loIdx = sampledIndices[lo];
      const hiIdx = sampledIndices[hi];
      const loElev = demMap.get(loIdx);
      const hiElev = demMap.get(hiIdx);

      if (loElev === undefined || hiElev === undefined) return p;

      const t = loIdx === hiIdx ? 0 : (i - loIdx) / (hiIdx - loIdx);
      const alt = loElev + t * (hiElev - loElev);
      return { ...p, alt };
    });

    return corrected;
  } catch (err) {
    console.warn('[elevationCorrection] DEM fetch failed, using GPS altitude:', err);
    return points; // graceful fallback
  }
}
