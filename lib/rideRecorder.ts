/**
 * rideRecorder – singleton GPS recording module.
 *
 * UI never calls expo-location directly.  All GPS logic lives here.
 * Exposes an imperative API (start / stop / subscribe / getState / getPoints)
 * plus a React hook (useRideRecorder) that wraps it with useState/useEffect.
 *
 * Background tracking via expo-task-manager: GPS continues when screen is off.
 *
 * Persistence: every accepted point is mirrored to SQLite via recordingStore
 * so the ride can be recovered if Android kills the JS context mid-ride.
 */

import * as Location    from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useState, useEffect } from 'react';
import * as recordingStore from './recordingStore';

// ── types ────────────────────────────────────────────────

export interface RecordedPoint {
  lat:       number;
  lng:       number;
  alt?:      number;   // meters, omitted when unavailable
  timestamp: number;   // epoch ms
  accuracy:  number;   // meters
}

export interface RecordingState {
  status:         'idle' | 'recording' | 'stopped' | 'error';
  elapsedSeconds: number;   // wallclock since start (includes stops)
  movingSeconds:  number;   // time spent actually moving (auto-pause for time)
  distanceMeters: number;
  pointsCount:    number;
  gpsStatus:      'waiting' | 'good' | 'ok' | 'poor';
  stoppedReason?: 'user' | 'background' | 'recovered';
  errorMessage?:  string;
  isClimb?:       boolean;
}

type Listener = (state: RecordingState) => void;

// ── filtering constants ─────────────────────────────────

const MAX_ACCURACY_M = 40;           // reject points less accurate than this
const MAX_SPEED_MS   = 80 / 3.6;     // 80 km/h → m/s (impossible on a bike)
const MIN_JITTER_M   = 3;            // ignore sub-3 m moves within 5 s
const MOVING_GAP_S   = 30;           // gaps between points < this count as moving time

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

/**
 * Sum of inter-point time gaps that are < MOVING_GAP_S seconds.
 * A 5-minute pause at a coffee shop produces a gap > MOVING_GAP_S, which is
 * excluded — that's the auto-pause behaviour that makes avg-speed sane.
 */
function computeMovingSeconds(points: RecordedPoint[]): number {
  let moving = 0;
  for (let i = 1; i < points.length; i++) {
    const dt = (points[i].timestamp - points[i - 1].timestamp) / 1000;
    if (dt > 0 && dt < MOVING_GAP_S) moving += dt;
  }
  return Math.round(moving);
}

function computeDistanceMeters(points: RecordedPoint[]): number {
  let d = 0;
  for (let i = 1; i < points.length; i++) {
    d += haversine(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
  }
  return d;
}

// ── singleton state ──────────────────────────────────────

let uiState: RecordingState = {
  status: 'idle', elapsedSeconds: 0, movingSeconds: 0, distanceMeters: 0, pointsCount: 0, gpsStatus: 'waiting',
};

let rawPoints:  RecordedPoint[]                       = [];
let listeners:  Set<Listener>                         = new Set();
let tickTimer:  ReturnType<typeof setInterval> | null = null;
let startTimestamp = 0;
let isClimbActive  = false;

function notify() {
  const snap = { ...uiState };
  listeners.forEach(fn => fn(snap));
}

// ── point filter ─────────────────────────────────────────

function accept(point: RecordedPoint): boolean {
  if (point.accuracy > MAX_ACCURACY_M) return false;

  const last = rawPoints.length > 0 ? rawPoints[rawPoints.length - 1] : null;
  if (last) {
    const dist  = haversine(last.lat, last.lng, point.lat, point.lng);
    const dtSec = (point.timestamp - last.timestamp) / 1000;
    if (dtSec > 0 && dist / dtSec > MAX_SPEED_MS) return false; // impossible speed
    if (dist < MIN_JITTER_M && dtSec < 5)          return false; // jitter (auto-pause for distance)
  }
  return true;
}

// ── background task ──────────────────────────────────────

const BACKGROUND_LOCATION_TASK = 'nabajk-background-location';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any) => {
  if (error || !data?.locations?.length) return;
  // If the JS context was cold-launched by the OS to deliver this batch and
  // status is still 'idle', the user's not actively recording — drop.
  if (uiState.status !== 'recording') return;

  for (const loc of data.locations as Location.LocationObject[]) {
    const point: RecordedPoint = {
      lat:       loc.coords.latitude,
      lng:       loc.coords.longitude,
      alt:       loc.coords.altitude ?? undefined,
      timestamp: loc.timestamp,
      accuracy:  loc.coords.accuracy ?? 999,
    };

    const gps: RecordingState['gpsStatus'] =
      point.accuracy <= 5  ? 'good' :
      point.accuracy <= 20 ? 'ok'   : 'poor';

    if (accept(point)) {
      const last  = rawPoints[rawPoints.length - 1];
      const added = last ? haversine(last.lat, last.lng, point.lat, point.lng) : 0;
      rawPoints.push(point);
      // Mirror to SQLite — survives process kill.
      await recordingStore.appendActivePoint(point);
      uiState = {
        ...uiState,
        gpsStatus:      gps,
        pointsCount:    rawPoints.length,
        distanceMeters: uiState.distanceMeters + added,
        movingSeconds:  computeMovingSeconds(rawPoints),
      };
    } else {
      uiState = { ...uiState, gpsStatus: gps };
    }
    notify();
  }
});

// ── public API ───────────────────────────────────────────

export async function startRecording(opts?: { isClimb?: boolean }): Promise<void> {
  if (uiState.status === 'recording') return;

  rawPoints      = [];
  startTimestamp = Date.now();
  isClimbActive  = !!opts?.isClimb;
  uiState        = {
    status: 'recording',
    elapsedSeconds: 0,
    movingSeconds:  0,
    distanceMeters: 0,
    pointsCount:    0,
    gpsStatus:      'waiting',
    isClimb:        isClimbActive,
  };
  notify();

  // Persist recording-started row (best effort — recorder still works in
  // memory-only mode if SQLite open fails).
  recordingStore.startActiveRecording({ startedAt: startTimestamp, isClimb: isClimbActive }).catch(() => {});

  // 1-second tick for elapsed time. movingSeconds is recomputed from points
  // when new points arrive, so the tick only needs to update wallclock.
  tickTimer = setInterval(() => {
    if (uiState.status !== 'recording') return;
    uiState = { ...uiState, elapsedSeconds: Math.floor((Date.now() - startTimestamp) / 1000) };
    notify();
  }, 1000);

  // Background GPS — continues when screen is off
  try {
    // Clear any stale task left from a previous session (e.g. app killed mid-recording)
    const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (alreadyRunning) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      // High = real GPS chip on Android (~10 m). Balanced previously meant
      // PRIORITY_BALANCED_POWER_ACCURACY (~100 m, Wi-Fi/cell), which combined
      // with MAX_ACCURACY_M=40 caused nearly every Android point to be rejected.
      accuracy:                         Location.Accuracy.High,
      timeInterval:                     4000,
      distanceInterval:                 15,
      showsBackgroundLocationIndicator: true,   // iOS — App Store compliance
      activityType:                     Location.LocationActivityType.Fitness,
      pausesUpdatesAutomatically:       false,  // don't pause at red lights
      // Android — without a foreground service notification, the OS throttles
      // or kills location updates as soon as the screen locks (Doze mode) on
      // Android 8+. Passing this object causes expo-location to start a typed
      // FOREGROUND_SERVICE_LOCATION service, which keeps the task alive and
      // shows a persistent notification (required by Google Play policy).
      foregroundService: {
        notificationTitle: 'NaBajk',
        notificationBody:  'Snemanje vožnje aktivno',
        notificationColor: '#00BC7C',
      },
    });

    // Guard: if stop() was called while awaiting startup, clean up
    if (uiState.status !== 'recording') {
      const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      if (isRunning) await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
  } catch (error) {
    console.error('Failed to start GPS:', error);
    if (tickTimer !== null) { clearInterval(tickTimer); tickTimer = null; }
    uiState = {
      ...uiState,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Could not access GPS',
    };
    notify();
    return;
  }
}

export function stopRecording(reason: 'user' | 'background' = 'user'): void {
  if (uiState.status !== 'recording') return;

  if (tickTimer !== null) { clearInterval(tickTimer); tickTimer = null; }

  Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
    .then((isRunning) => { if (isRunning) return Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK); })
    .catch(() => {}); // best-effort — ignore errors if task already stopped

  uiState = {
    ...uiState,
    status:         'stopped',
    elapsedSeconds: Math.floor((Date.now() - startTimestamp) / 1000),
    movingSeconds:  computeMovingSeconds(rawPoints),
    stoppedReason:  reason,
  };
  notify();
  // SQLite row is intentionally NOT cleared here — it's cleared on save or
  // discard from ride-summary, so a kill between Stop and Save still recovers.
}

/** Current UI-safe snapshot (no raw points). */
export function getState(): RecordingState { return { ...uiState }; }

/** Raw GPS points collected so far — only meaningful after stop. */
export function getPoints(): readonly RecordedPoint[] { return rawPoints; }

/** Subscribe to state changes. Returns an unsubscribe function. */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Reset the recorder back to idle and clear the SQLite-persisted active row.
 * Called from ride-summary after Save or Discard.
 */
export function reset(): void {
  if (uiState.status === 'recording') stopRecording('user');
  rawPoints      = [];
  isClimbActive  = false;
  uiState        = {
    status: 'idle', elapsedSeconds: 0, movingSeconds: 0, distanceMeters: 0, pointsCount: 0, gpsStatus: 'waiting', errorMessage: undefined,
  };
  notify();
  recordingStore.clearActiveRecording().catch(() => {});
}

/**
 * Hydrate the singleton from SQLite (used by the recover flow on cold start).
 * Sets status to 'stopped' so ride-summary processes it as a normal completed
 * ride. Returns the loaded recording, or null if nothing recoverable.
 */
export async function hydrateFromActiveRecording(): Promise<{ isClimb: boolean } | null> {
  const recovered = await recordingStore.loadActiveRecording();
  if (!recovered || recovered.points.length < 2) return null;

  rawPoints      = [...recovered.points];
  startTimestamp = recovered.startedAt;
  isClimbActive  = recovered.isClimb;

  const lastTs   = rawPoints[rawPoints.length - 1].timestamp;
  const elapsed  = Math.max(0, Math.floor((lastTs - startTimestamp) / 1000));
  const moving   = computeMovingSeconds(rawPoints);
  const distance = computeDistanceMeters(rawPoints);

  uiState = {
    status:         'stopped',
    stoppedReason:  'recovered',
    elapsedSeconds: elapsed,
    movingSeconds:  moving,
    distanceMeters: distance,
    pointsCount:    rawPoints.length,
    gpsStatus:      'good',
    isClimb:        isClimbActive,
  };
  notify();
  return { isClimb: isClimbActive };
}

/**
 * Lightweight check used by app/index.tsx on cold start. Does not hydrate
 * the singleton — just answers "is there something to recover?".
 */
export async function hasRecoverableRecording(): Promise<boolean> {
  const recovered = await recordingStore.loadActiveRecording();
  return !!recovered && recovered.points.length >= 2;
}

// ── React hook ───────────────────────────────────────────

export function useRideRecorder() {
  const [state, setState] = useState<RecordingState>(getState);

  useEffect(() => {
    setState(getState());        // sync if singleton changed between renders
    return subscribe(setState);  // returns the unsubscribe fn
  }, []);

  return {
    state,
    start: (opts?: { isClimb?: boolean }) => startRecording(opts),
    stop:  () => stopRecording('user'),
    reset,
  };
}
