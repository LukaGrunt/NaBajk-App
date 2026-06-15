/**
 * climbDetection – "Kralj vzponov" core algorithm.
 *
 * A recorded ride conquers a climb when its GPS track passes ALL of the
 * climb's checkpoints (start → midpoints → summit) IN ORDER, each within
 * CHECKPOINT_RADIUS_M. Midpoints prevent shortcuts; ordering prevents
 * descents from counting. Time = summit pass − start pass, both taken at
 * the closest approach to the checkpoint for accuracy.
 *
 * Pure functions, no I/O — unit-tested in __tests__/climbDetection.test.ts.
 */

import type { RecordedPoint } from './rideRecorder';

// ── types ────────────────────────────────────────────────

export interface LatLng {
  lat: number;
  lng: number;
}

export interface ClimbDefinition {
  id:          string;
  title:       string;
  checkpoints: LatLng[];   // ordered: start … summit
}

export interface DetectedClimb {
  climbId:     string;
  title:       string;
  timeSeconds: number;
  startIndex:  number;   // index into the track of the start pass
  summitIndex: number;   // index into the track of the summit pass
}

// ── constants ────────────────────────────────────────────

/** GPS noise + checkpoint placement tolerance. */
export const CHECKPOINT_RADIUS_M = 60;

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

// ── pass finding ─────────────────────────────────────────

interface Pass {
  idx:    number;   // closest-approach point within the pass
  runEnd: number;   // last consecutive in-radius point (resume after this on failure)
}

/**
 * Find the first pass of the track through the radius around `target`,
 * starting at `fromIdx`. Returns the closest-approach index within that
 * contiguous in-radius run (best timing estimate), or null.
 */
function findPass(
  points:  readonly RecordedPoint[],
  fromIdx: number,
  target:  LatLng,
  radiusM: number,
): Pass | null {
  for (let i = fromIdx; i < points.length; i++) {
    if (haversine(points[i].lat, points[i].lng, target.lat, target.lng) > radiusM) continue;

    // Entered the radius — walk the contiguous run, keep the closest point.
    let bestIdx  = i;
    let bestDist = haversine(points[i].lat, points[i].lng, target.lat, target.lng);
    let j = i + 1;
    for (; j < points.length; j++) {
      const d = haversine(points[j].lat, points[j].lng, target.lat, target.lng);
      if (d > radiusM) break;
      if (d < bestDist) { bestDist = d; bestIdx = j; }
    }
    return { idx: bestIdx, runEnd: j - 1 };
  }
  return null;
}

// ── public API ───────────────────────────────────────────

/**
 * Detect whether (and how fast) the track climbed `climb`. Repeat ascents in
 * one ride return the best time.
 */
export function detectClimb(
  points: readonly RecordedPoint[],
  climb:  ClimbDefinition,
): DetectedClimb | null {
  const cps = climb.checkpoints;
  if (!cps || cps.length < 2 || points.length < 2) return null;

  let best: DetectedClimb | null = null;
  let cursor = 0;

  while (cursor < points.length) {
    const startPass = findPass(points, cursor, cps[0], CHECKPOINT_RADIUS_M);
    if (!startPass) break;

    // Chase the remaining checkpoints in order.
    let lastPass = startPass;
    let complete = true;
    for (let c = 1; c < cps.length; c++) {
      const pass = findPass(points, lastPass.idx + 1, cps[c], CHECKPOINT_RADIUS_M);
      if (!pass) { complete = false; break; }
      lastPass = pass;
    }

    if (complete) {
      const timeSeconds = Math.round(
        (points[lastPass.idx].timestamp - points[startPass.idx].timestamp) / 1000,
      );
      if (timeSeconds > 0 && (best === null || timeSeconds < best.timeSeconds)) {
        best = {
          climbId:     climb.id,
          title:       climb.title,
          timeSeconds,
          startIndex:  startPass.idx,
          summitIndex: lastPass.idx,
        };
      }
      cursor = lastPass.runEnd + 1;        // look for another ascent
    } else {
      cursor = startPass.runEnd + 1;       // skip this start pass, try later ones
    }
  }

  return best;
}

/**
 * Run detection against many climbs with a cheap bounding-box prefilter:
 * a climb can only match if every checkpoint lies inside the track's
 * bounding box (expanded by the radius).
 */
export function detectClimbs(
  points: readonly RecordedPoint[],
  climbs: readonly ClimbDefinition[],
): DetectedClimb[] {
  if (points.length < 2) return [];

  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  // ~degrees of latitude for the radius; longitude margin widened for latitude
  const latMargin = CHECKPOINT_RADIUS_M / 111_195;
  const lngMargin = latMargin / Math.cos(toRad((minLat + maxLat) / 2));

  const results: DetectedClimb[] = [];
  for (const climb of climbs) {
    if (!climb.checkpoints || climb.checkpoints.length < 2) continue;
    const inBox = climb.checkpoints.every(cp =>
      cp.lat >= minLat - latMargin && cp.lat <= maxLat + latMargin &&
      cp.lng >= minLng - lngMargin && cp.lng <= maxLng + lngMargin);
    if (!inBox) continue;

    const detected = detectClimb(points, climb);
    if (detected) results.push(detected);
  }
  return results;
}
