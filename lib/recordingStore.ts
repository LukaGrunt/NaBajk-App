/**
 * recordingStore — SQLite-backed persistence for the *active* ride.
 *
 * Why this exists: rideRecorder previously held all state (rawPoints, uiState,
 * startTimestamp) in JS module memory. When Android killed the JS context
 * mid-ride (Doze, low memory, swipe-away), everything was lost. When
 * expo-task-manager later woke a headless JS instance to deliver a queued
 * GPS batch, the module reloaded with status: 'idle' and the BG task callback
 * silently dropped every point.
 *
 * This module mirrors every accepted point to a tiny SQLite database so a
 * recording survives a process kill. On cold start, app/index.tsx checks
 * loadActiveRecording() and, if found, routes the user to a "Recover Ride"
 * screen so the data isn't silently lost.
 *
 * NOTE: SavedRide history (post-save) still lives in AsyncStorage via
 * lib/rideStorage.ts. This module is ONLY for the in-progress / unsaved ride.
 */

import * as SQLite from 'expo-sqlite';
import type { RecordedPoint } from './rideRecorder';

const DB_NAME = 'nabajk_recording.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      // WAL = better concurrent read/write performance; the BG task and the
      // foreground UI may both touch the DB.
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS active_recording (
          id         INTEGER PRIMARY KEY CHECK (id = 1),
          started_at INTEGER NOT NULL,
          is_climb   INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS active_points (
          id        INTEGER PRIMARY KEY AUTOINCREMENT,
          lat       REAL    NOT NULL,
          lng       REAL    NOT NULL,
          alt       REAL,
          timestamp INTEGER NOT NULL,
          accuracy  REAL    NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_active_points_ts ON active_points(timestamp);
      `);
      return db;
    })();
  }
  return dbPromise;
}

export interface RecoverableRecording {
  startedAt:   number;
  isClimb:     boolean;
  points:      RecordedPoint[];
  lastPointAt: number | null;
}

/** Begin a fresh recording row. Wipes any previous active points. */
export async function startActiveRecording(opts: { startedAt: number; isClimb: boolean }): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO active_recording (id, started_at, is_climb) VALUES (1, ?, ?)`,
      opts.startedAt,
      opts.isClimb ? 1 : 0,
    );
    await db.runAsync('DELETE FROM active_points');
  } catch (err) {
    console.warn('[recordingStore] startActiveRecording failed:', err);
  }
}

/** Append a single accepted GPS point. Called from the BG task callback. */
export async function appendActivePoint(p: RecordedPoint): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync(
      'INSERT INTO active_points (lat, lng, alt, timestamp, accuracy) VALUES (?, ?, ?, ?, ?)',
      p.lat,
      p.lng,
      p.alt ?? null,
      p.timestamp,
      p.accuracy,
    );
  } catch (err) {
    console.warn('[recordingStore] appendActivePoint failed:', err);
  }
}

/** Returns null if no recording is in progress, otherwise the full recoverable state. */
export async function loadActiveRecording(): Promise<RecoverableRecording | null> {
  try {
    const db  = await getDb();
    const row = await db.getFirstAsync<{ started_at: number; is_climb: number }>(
      'SELECT started_at, is_climb FROM active_recording WHERE id = 1'
    );
    if (!row) return null;

    const pointRows = await db.getAllAsync<{
      lat: number; lng: number; alt: number | null; timestamp: number; accuracy: number;
    }>('SELECT lat, lng, alt, timestamp, accuracy FROM active_points ORDER BY id ASC');

    const points: RecordedPoint[] = pointRows.map(r => ({
      lat:       r.lat,
      lng:       r.lng,
      alt:       r.alt ?? undefined,
      timestamp: r.timestamp,
      accuracy:  r.accuracy,
    }));

    return {
      startedAt:   row.started_at,
      isClimb:     row.is_climb === 1,
      points,
      lastPointAt: points.length ? points[points.length - 1].timestamp : null,
    };
  } catch (err) {
    console.warn('[recordingStore] loadActiveRecording failed:', err);
    return null;
  }
}

/** Wipe both tables. Called after the user saves or discards a ride. */
export async function clearActiveRecording(): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync('DELETE FROM active_recording');
    await db.runAsync('DELETE FROM active_points');
  } catch (err) {
    console.warn('[recordingStore] clearActiveRecording failed:', err);
  }
}
