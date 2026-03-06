/**
 * rideRecorder – singleton GPS recording module.
 *
 * UI never calls expo-location directly.  All GPS logic lives here.
 * Exposes an imperative API (start / stop / subscribe / getState / getPoints)
 * plus a React hook (useRideRecorder) that wraps it with useState/useEffect.
 *
 * Background tracking via expo-task-manager: GPS continues when screen is off.
 */

import * as Location    from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useState, useEffect } from 'react';

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
  elapsedSeconds: number;
  distanceMeters: number;
  pointsCount:    number;
  gpsStatus:      'waiting' | 'good' | 'ok' | 'poor';
  stoppedReason?: 'user' | 'background';
  errorMessage?:  string;
}

type Listener = (state: RecordingState) => void;

// ── filtering constants ─────────────────────────────────

const MAX_ACCURACY_M = 40;           // reject points less accurate than this
const MAX_SPEED_MS   = 80 / 3.6;     // 80 km/h → m/s (impossible on a bike)
const MIN_JITTER_M   = 3;            // ignore sub-3 m moves within 5 s

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

// ── singleton state ──────────────────────────────────────

let uiState: RecordingState = {
  status: 'idle', elapsedSeconds: 0, distanceMeters: 0, pointsCount: 0, gpsStatus: 'waiting',
};

let rawPoints:  RecordedPoint[]                     = [];
let listeners:  Set<Listener>                       = new Set();
let tickTimer:  ReturnType<typeof setInterval> | null = null;
let startTimestamp = 0;

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
    if (dist < MIN_JITTER_M && dtSec < 5)          return false; // jitter
  }
  return true;
}

// ── background task ──────────────────────────────────────

const BACKGROUND_LOCATION_TASK = 'nabajk-background-location';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ({ data, error }: any) => {
  if (error || !data?.locations?.length) return;
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
      uiState = { ...uiState, gpsStatus: gps, pointsCount: rawPoints.length, distanceMeters: uiState.distanceMeters + added };
    } else {
      uiState = { ...uiState, gpsStatus: gps };
    }
    notify();
  }
});

// ── public API ───────────────────────────────────────────

export async function startRecording(): Promise<void> {
  if (uiState.status === 'recording') return;

  rawPoints      = [];
  startTimestamp = Date.now();
  uiState        = { status: 'recording', elapsedSeconds: 0, distanceMeters: 0, pointsCount: 0, gpsStatus: 'waiting' };
  notify();

  // 1-second tick for elapsed time
  tickTimer = setInterval(() => {
    if (uiState.status !== 'recording') return;
    uiState = { ...uiState, elapsedSeconds: Math.floor((Date.now() - startTimestamp) / 1000) };
    notify();
  }, 1000);

  // Background GPS — continues when screen is off
  try {
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy:                         Location.Accuracy.Balanced,
      timeInterval:                     4000,
      distanceInterval:                 15,
      showsBackgroundLocationIndicator: true,   // required for App Store compliance
      activityType:                     Location.LocationActivityType.Fitness,
      pausesUpdatesAutomatically:       false,  // don't pause at red lights
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

  Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).then((isRunning) => {
    if (isRunning) Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  });

  uiState = {
    ...uiState,
    status:         'stopped',
    elapsedSeconds: Math.floor((Date.now() - startTimestamp) / 1000),
    stoppedReason:  reason,
  };
  notify();
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

/** Reset the recorder back to idle. Stops recording if active. */
export function reset(): void {
  if (uiState.status === 'recording') stopRecording('user');
  rawPoints = [];
  uiState   = { status: 'idle', elapsedSeconds: 0, distanceMeters: 0, pointsCount: 0, gpsStatus: 'waiting', errorMessage: undefined };
  notify();
}

// ── React hook ───────────────────────────────────────────

export function useRideRecorder() {
  const [state, setState] = useState<RecordingState>(getState);

  useEffect(() => {
    setState(getState());        // sync if singleton changed between renders
    return subscribe(setState);  // returns the unsubscribe fn
  }, []);

  return { state, start: startRecording, stop: () => stopRecording('user'), reset };
}
