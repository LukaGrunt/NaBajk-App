/**
 * rideRecorder – singleton GPS recording module.
 *
 * UI never calls expo-location directly.  All GPS logic lives here.
 * Exposes an imperative API (start / stop / subscribe / getState / getPoints)
 * plus a React hook (useRideRecorder) that wraps it with useState/useEffect.
 */

import { AppState } from 'react-native';
import * as Location from 'expo-location';
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
  status:         'idle' | 'recording' | 'stopped';
  elapsedSeconds: number;
  distanceMeters: number;
  pointsCount:    number;
  gpsStatus:      'waiting' | 'good' | 'ok' | 'poor';
  stoppedReason?: 'user' | 'background';
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

let rawPoints:            RecordedPoint[]                                     = [];
let listeners:            Set<Listener>                                       = new Set();
let locationWatcher:      Location.LocationSubscription | null                 = null;
let tickTimer:            ReturnType<typeof setInterval> | null               = null;
let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;
let startTimestamp        = 0;

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

  // GPS watcher — balanced accuracy, ~4 s interval, 15 m distance threshold
  locationWatcher = await Location.watchPositionAsync(
    { accuracy: Location.Accuracy.Balanced, timeInterval: 4000, distanceInterval: 15 },
    (loc) => {
      if (uiState.status !== 'recording') return;

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
    },
  );

  // Guard: if stop() was called while we awaited the watcher, clean up immediately
  if (uiState.status !== 'recording' && locationWatcher !== null) {
    locationWatcher.remove();
    locationWatcher = null;
  }

  // Stop recording when the app leaves the foreground
  appStateSubscription = AppState.addEventListener('change', (s) => {
    if (s !== 'active' && uiState.status === 'recording') stopRecording('background');
  });
}

export function stopRecording(reason: 'user' | 'background' = 'user'): void {
  if (uiState.status !== 'recording') return;

  if (locationWatcher !== null)      { locationWatcher.remove();                           locationWatcher = null; }
  if (tickTimer !== null)            { clearInterval(tickTimer);            tickTimer            = null; }
  if (appStateSubscription)          { appStateSubscription.remove();       appStateSubscription = null; }

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
  uiState   = { status: 'idle', elapsedSeconds: 0, distanceMeters: 0, pointsCount: 0, gpsStatus: 'waiting' };
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
