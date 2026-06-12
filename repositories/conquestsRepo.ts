import { supabase } from '@/lib/supabase';
import { detectClimbs, ClimbDefinition, LatLng } from '@/lib/climbDetection';
import type { RecordedPoint } from '@/lib/rideRecorder';

/**
 * Conquests Repository — "Kralj vzponov"
 *
 * Detects conquered climbs on a recorded track and persists each user's
 * best time per climb in `climb_conquests` (unique user_id + climb_id).
 */

export interface ClimbConquest {
  climbId:     string;
  timeSeconds: number;
  conqueredAt: string;
}

/** Result for the post-save celebration. */
export interface ConquestResult {
  climbId:       string;
  title:         string;
  timeSeconds:   number;
  isFirstTime:   boolean;          // never conquered this climb before
  isPersonalBest: boolean;         // beat (or set) the stored time
  previousBest?: number;           // seconds, when improving an old time
}

// ── climb definitions (cached per app session) ───────────

let climbDefsCache: ClimbDefinition[] | null = null;

export async function getClimbDefinitions(): Promise<ClimbDefinition[]> {
  if (climbDefsCache) return climbDefsCache;

  const { data, error } = await supabase
    .from('routes')
    .select('id, title, climb_checkpoints')
    .eq('is_climb', true)
    .not('climb_checkpoints', 'is', null);

  if (error) {
    console.error('Failed to fetch climb definitions:', error);
    return [];
  }

  climbDefsCache = (data ?? [])
    .filter(row => Array.isArray(row.climb_checkpoints) && row.climb_checkpoints.length >= 2)
    .map(row => ({
      id:          row.id,
      title:       row.title,
      checkpoints: row.climb_checkpoints as LatLng[],
    }));
  return climbDefsCache;
}

// ── conquests ────────────────────────────────────────────

/** All conquests of the signed-in user, keyed by climb id. */
export async function listMyConquests(): Promise<Map<string, ClimbConquest>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Map();

  const { data, error } = await supabase
    .from('climb_conquests')
    .select('climb_id, time_seconds, conquered_at')
    .eq('user_id', user.id);

  if (error) {
    console.error('Failed to fetch conquests:', error);
    return new Map();
  }

  const map = new Map<string, ClimbConquest>();
  for (const row of data ?? []) {
    map.set(row.climb_id, {
      climbId:     row.climb_id,
      timeSeconds: row.time_seconds,
      conqueredAt: row.conquered_at,
    });
  }
  return map;
}

/**
 * Run climb detection on a finished ride and persist results.
 * Keeps the BEST time per climb; returns what happened for the celebration.
 * Never throws — a failure here must not break the ride-save flow.
 */
export async function detectAndRecordConquests(
  points: readonly RecordedPoint[],
): Promise<ConquestResult[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || points.length < 2) return [];

    const climbs = await getClimbDefinitions();
    if (climbs.length === 0) return [];

    const detected = detectClimbs(points, climbs);
    if (detected.length === 0) return [];

    const existing = await listMyConquests();
    const results: ConquestResult[] = [];

    for (const d of detected) {
      const prev = existing.get(d.climbId);
      const isFirstTime = !prev;
      const isPersonalBest = !prev || d.timeSeconds < prev.timeSeconds;

      if (isPersonalBest) {
        const { error } = await supabase
          .from('climb_conquests')
          .upsert(
            {
              user_id:      user.id,
              climb_id:     d.climbId,
              time_seconds: d.timeSeconds,
              conquered_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,climb_id' },
          );
        if (error) {
          console.error('Failed to save conquest:', error);
          continue;
        }
      }

      results.push({
        climbId:        d.climbId,
        title:          d.title,
        timeSeconds:    d.timeSeconds,
        isFirstTime,
        isPersonalBest,
        previousBest:   prev && isPersonalBest ? prev.timeSeconds : undefined,
      });
    }
    return results;
  } catch (err) {
    console.error('Conquest detection failed:', err);
    return [];
  }
}
