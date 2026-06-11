/**
 * rideMetrics – single source of truth for ride numbers.
 *
 * finalizeRide() turns the recorder's raw points into ONE RideMetrics object.
 * The summary screen displays it, rideStorage persists it, uploadRecordedRide
 * sends it to Supabase and gpxGenerator writes its track — so every surface
 * shows the same numbers for the same ride.
 *
 * All calculation functions are pure so they can be unit-tested directly.
 */

import type { RecordedPoint } from './rideRecorder';
import { correctElevations } from './elevationCorrection';

// ── types ────────────────────────────────────────────────

export interface RideMetrics {
  distanceMeters:     number;
  elapsedSeconds:     number;          // wallclock start → stop, includes pauses
  movingSeconds:      number;          // auto-paused time actually riding
  avgSpeedKmh:        number | null;   // distance / moving; null when too short
  elevationGainM:     number;
  elevationCorrected: boolean;         // true when DEM correction succeeded
  points:             RecordedPoint[]; // canonical track (DEM altitudes when corrected)
}

// ── constants ────────────────────────────────────────────

export const MOVING_GAP_S = 30;        // gaps shorter than this always count as moving

const MIN_MOVING_SPEED_MS  = 0.8;      // below this the rider is considered stopped
const GAIN_THRESHOLD_DEM_M = 2;        // hysteresis threshold for DEM-corrected data
const GAIN_THRESHOLD_GPS_M = 5;        // raw GPS altitude is ±10–30 m noisy
const DEM_TIMEOUT_MS       = 30_000;

// ── haversine ────────────────────────────────────────────

function toRad(deg: number) { return deg * Math.PI / 180; }

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R    = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a    = Math.sin(dLat / 2) ** 2 +
               Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
               Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── distance ─────────────────────────────────────────────

export function computeDistanceMeters(points: readonly RecordedPoint[]): number {
  let d = 0;
  for (let i = 1; i < points.length; i++) {
    d += haversine(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
  }
  return d;
}

// ── moving time ──────────────────────────────────────────

/**
 * Gaps < MOVING_GAP_S always count as moving (normal GPS cadence).
 * Longer gaps count only when the implied straight-line speed says the rider
 * was actually covering ground (GPS dropout mid-ride) — a long gap with no
 * displacement is a café stop and is excluded. This keeps auto-pause while
 * fixing the old behaviour where a >30 s signal dropout while riding silently
 * deleted time and inflated avg speed.
 */
export function computeMovingSeconds(points: readonly RecordedPoint[]): number {
  let moving = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const dt   = (curr.timestamp - prev.timestamp) / 1000;
    if (dt <= 0) continue;
    if (dt < MOVING_GAP_S) { moving += dt; continue; }
    const dist = haversine(prev.lat, prev.lng, curr.lat, curr.lng);
    if (dist / dt >= MIN_MOVING_SPEED_MS) moving += dt;
  }
  return Math.round(moving);
}

// ── elevation gain ───────────────────────────────────────

/**
 * Hysteresis elevation gain: accumulate each climb from local valley to local
 * peak, counting only climbs/descents of at least `thresholdM`. Unlike a
 * per-step threshold, a steady gentle climb (small deltas) accumulates fully,
 * while noise oscillation below the threshold contributes nothing.
 */
export function calcElevationGain(altitudes: readonly number[], thresholdM: number): number {
  if (altitudes.length < 2) return 0;

  let gain     = 0;
  let valley   = altitudes[0];
  let peak     = altitudes[0];
  let climbing = false;

  for (let i = 1; i < altitudes.length; i++) {
    const a = altitudes[i];
    if (climbing) {
      if (a > peak) {
        peak = a;
      } else if (peak - a >= thresholdM) {
        gain    += peak - valley;   // climb ended at the peak
        climbing = false;
        valley   = a;
      }
    } else {
      if (a < valley) {
        valley = a;
      } else if (a - valley >= thresholdM) {
        climbing = true;
        peak     = a;
      }
    }
  }
  if (climbing && peak > valley) gain += peak - valley;

  return Math.round(gain);
}

export function calcElevationGainFromPoints(
  points: readonly RecordedPoint[],
  demCorrected: boolean,
): number {
  const raw = points.map(p => p.alt).filter((a): a is number => a != null);
  if (raw.length < 2) return 0;

  // 7-point moving average: tames GPS altitude noise, harmless on DEM data
  const smoothed = raw.map((_, i) => {
    const lo = Math.max(0, i - 3);
    const hi = Math.min(raw.length - 1, i + 3);
    const slice = raw.slice(lo, hi + 1);
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  });

  return calcElevationGain(smoothed, demCorrected ? GAIN_THRESHOLD_DEM_M : GAIN_THRESHOLD_GPS_M);
}

// ── finalize ─────────────────────────────────────────────

/**
 * Compute all metrics once from the recorded track. Awaits DEM elevation
 * correction (capped at DEM_TIMEOUT_MS); on timeout or API failure the raw
 * GPS altitudes are kept and `elevationCorrected` is false, which also
 * selects the noise-tolerant gain threshold.
 */
export async function finalizeRide(
  rawPoints:      readonly RecordedPoint[],
  elapsedSeconds: number,
): Promise<RideMetrics> {
  const points         = [...rawPoints];
  const distanceMeters = computeDistanceMeters(points);
  const movingSeconds  = computeMovingSeconds(points);
  const avgSpeedKmh    = movingSeconds >= 10 && distanceMeters > 0
    ? (distanceMeters / 1000) / (movingSeconds / 3600)
    : null;

  let track     = points;
  let corrected = false;
  if (points.length >= 2) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<null>(resolve => {
      timeoutId = setTimeout(() => resolve(null), DEM_TIMEOUT_MS);
    });
    const result = await Promise.race([correctElevations(points), timeout]);
    clearTimeout(timeoutId);
    if (result) {
      track     = result.points;
      corrected = result.corrected;
    }
  }

  return {
    distanceMeters,
    elapsedSeconds: Math.max(0, Math.round(elapsedSeconds)),
    movingSeconds,
    avgSpeedKmh,
    elevationGainM:     calcElevationGainFromPoints(track, corrected),
    elevationCorrected: corrected,
    points: track,
  };
}
