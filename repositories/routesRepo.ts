import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { Difficulty, Route, RouteCategory, TimeDuration } from '@/types/Route';
import { getPlaceholderImage } from '@/constants/placeholderImages';
import type { RecordedPoint } from '@/lib/rideRecorder';

/**
 * Routes Repository - Supabase Integration
 * Fetches cycling routes from Supabase database
 */

// Supabase row type (snake_case from database)
interface SupabaseRouteRow {
  id: string;
  title: string;
  distance_km: number | string;
  elevation_m: number;
  duration_minutes: number;
  difficulty: Route['difficulty'];
  image_url: string;
  featured: boolean;
  categories: RouteCategory[] | null;
  region: string | null;
  polyline: string | null;
  gpx_data: string | null;
  is_climb: boolean | null;
  avg_gradient: number | null;
  elevation_profile: number[] | null;
  traffic: string | null;
  road_condition: string | null;
  why_good: string | null;
}

// Helper: Map Supabase snake_case to TypeScript camelCase
function mapSupabaseToRoute(data: SupabaseRouteRow): Route {
  return {
    id: data.id,
    title: data.title,
    distanceKm: parseFloat(String(data.distance_km ?? 0)),
    elevationM: data.elevation_m,
    durationMinutes: data.duration_minutes,
    difficulty: data.difficulty,
    imageUrl: data.image_url,
    featured: data.featured,
    categories: data.categories || [],
    region: data.region ?? undefined,
    polyline: data.polyline ?? undefined,
    gpxData: data.gpx_data ?? undefined,
    isClimb: data.is_climb ?? undefined,
    avgGradient: data.avg_gradient ?? undefined,
    elevationProfile: data.elevation_profile ?? undefined,
    traffic: data.traffic ?? undefined,
    roadCondition: data.road_condition ?? undefined,
    whyGood: data.why_good ?? undefined,
  };
}

/**
 * Compute an elevation profile (array of elevation values sampled at ~1km intervals)
 * from a list of recorded GPS points.
 * Returns numBars+1 values where numBars = max(10, round(distanceKm)).
 */
export function computeElevationProfileFromPoints(
  points: RecordedPoint[],
  distanceKm: number
): number[] {
  const pts = points.filter(p => p.alt != null);
  if (pts.length < 2) return [];

  const numBars = Math.max(10, Math.round(distanceKm));

  // Build cumulative distances array
  const cumDist: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    cumDist.push(cumDist[i - 1] + haversineKm(prev.lat, prev.lng, curr.lat, curr.lng));
  }
  const totalDist = cumDist[cumDist.length - 1] || distanceKm;

  const raw: number[] = [];
  for (let bar = 0; bar <= numBars; bar++) {
    const targetDist = (bar / numBars) * totalDist;
    // Find closest point
    let closest = pts[0];
    let minDiff = Math.abs(cumDist[0] - targetDist);
    for (let i = 1; i < pts.length; i++) {
      const diff = Math.abs(cumDist[i] - targetDist);
      if (diff < minDiff) { minDiff = diff; closest = pts[i]; }
    }
    raw.push(closest.alt!);
  }

  // 3-point smoothing on the sampled values to reduce bar spikiness
  return raw.map((_, i) => {
    const lo = Math.max(0, i - 1);
    const hi = Math.min(raw.length - 1, i + 1);
    const slice = raw.slice(lo, hi + 1);
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  });
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Get all routes
 */
export async function listRoutes(): Promise<Route[]> {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .order('title', { ascending: true });

  if (error) {
    console.error('Failed to fetch routes:', error);
    return [];
  }

  return data.map(mapSupabaseToRoute);
}

/**
 * Get a single route by ID
 */
export async function getRoute(id: string): Promise<Route | null> {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to fetch route:', error);
    return null;
  }

  return mapSupabaseToRoute(data);
}

/**
 * Get featured routes only
 */
export async function getFeaturedRoutes(): Promise<Route[]> {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('featured', true)
    .order('title', { ascending: true });

  if (error) {
    console.error('Failed to fetch featured routes:', error);
    return [];
  }

  return data.map(mapSupabaseToRoute);
}

/**
 * Get all climbs (is_climb = true)
 */
export async function getClimbs(): Promise<Route[]> {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('is_climb', true)
    .order('title', { ascending: true });

  if (error) {
    console.error('Failed to fetch climbs:', error);
    return [];
  }

  return data.map(mapSupabaseToRoute);
}

/**
 * Get routes filtered by category
 * Uses PostgreSQL array contains operator
 */
export async function getRoutesByCategory(category: RouteCategory): Promise<Route[]> {
  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .contains('categories', [category])
    .order('title', { ascending: true });

  if (error) {
    console.error('Failed to fetch routes by category:', error);
    return [];
  }

  return data.map(mapSupabaseToRoute);
}

/**
 * Get routes filtered by duration
 */
export async function getRoutesByDuration(duration: TimeDuration): Promise<Route[]> {
  let query = supabase.from('routes').select('*');

  switch (duration) {
    case '1h':
      query = query.lte('duration_minutes', 60);
      break;
    case '2h':
      query = query.gt('duration_minutes', 60).lte('duration_minutes', 120);
      break;
    case '3h':
      query = query.gt('duration_minutes', 120).lte('duration_minutes', 180);
      break;
    case '4h+':
      query = query.gt('duration_minutes', 180);
      break;
  }

  const { data, error } = await query.order('title', { ascending: true });

  if (error) {
    console.error('Failed to fetch routes by duration:', error);
    return [];
  }

  return data.map(mapSupabaseToRoute);
}

/**
 * Submit a user-uploaded route (pending admin review)
 */
export async function submitRoute(params: {
  title: string;
  difficulty: Difficulty;
  gpxData: string;
  isClimb?: boolean;
  region?: string;
  traffic?: string;
  roadCondition?: string;
  whyGood?: string;
}): Promise<{ error?: string }> {
  const { error } = await supabase.from('routes').insert({
    title: params.title,
    difficulty: params.difficulty,
    gpx_data: params.gpxData,
    distance_km: 0,
    elevation_m: 0,
    duration_minutes: 0,
    featured: false,
    categories: [],
    is_climb: params.isClimb ?? false,
    ...(params.region && { region: params.region }),
    ...(params.traffic && { traffic: params.traffic }),
    ...(params.roadCondition && { road_condition: params.roadCondition }),
    ...(params.whyGood && { why_good: params.whyGood }),
  });

  if (error) return { error: error.message };
  return {};
}

// ── Region key → DB display name ─────────────────────────
const REGION_DISPLAY: Record<string, string> = {
  gorenjska:         'Gorenjska',
  dolenjska:         'Dolenjska',
  primorska:         'Primorska',
  stajerska:         'Štajerska',
  prekmurje:         'Prekmurje',
  osrednjaSlovenija: 'Osrednja Slovenija',
};

export function calcElevationGainFromPoints(points: RecordedPoint[]): number {
  const raw = points.map(p => p.alt).filter((a): a is number => a != null);
  if (raw.length < 2) return 0;

  // 7-point moving average to smooth GPS altitude noise
  const smoothed = raw.map((_, i) => {
    const lo = Math.max(0, i - 3);
    const hi = Math.min(raw.length - 1, i + 3);
    const slice = raw.slice(lo, hi + 1);
    return slice.reduce((s, v) => s + v, 0) / slice.length;
  });

  const MIN_DELTA = 1; // DEM data is noise-free; 1 m threshold is sufficient
  let gain = 0;
  for (let i = 1; i < smoothed.length; i++) {
    const delta = smoothed[i] - smoothed[i - 1];
    if (delta >= MIN_DELTA) gain += delta;
  }
  return Math.round(gain);
}

function calcElevationGain(points: RecordedPoint[]): number {
  return calcElevationGainFromPoints(points);
}

function deriveDifficulty(distanceKm: number): Difficulty {
  if (distanceKm < 20) return 'Lahka';
  if (distanceKm <= 50) return 'Srednja';
  return 'Težka';
}

/**
 * Upload a recorded ride to the public routes table so it appears
 * in the app for all users, filtered by region.
 */
export async function uploadRecordedRide(params: {
  points:          RecordedPoint[];
  rideName:        string;
  regionKey:       string;   // e.g. 'gorenjska'
  distanceMeters:  number;
  durationSeconds: number;
  polyline:        string;
  gpxPath:         string;   // local file:// URI
  traffic?:        string;
  roadCondition?:  string;
  whyGood?:        string;
}): Promise<{ error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();

  const distanceKm    = params.distanceMeters / 1000;
  const durationMins  = Math.round(params.durationSeconds / 60);
  const elevationM    = calcElevationGain(params.points);
  const difficulty    = deriveDifficulty(distanceKm);
  const region        = REGION_DISPLAY[params.regionKey] ?? params.regionKey;

  // Generate a stable temp ID for the placeholder image picker
  const tempId = `rec_${Date.now()}`;
  const imageUrl = getPlaceholderImage(tempId);

  // Read GPX content from local file
  let gpxData: string | null = null;
  try {
    gpxData = await FileSystem.readAsStringAsync(params.gpxPath);
  } catch {
    // GPX is optional — continue without it
  }

  const { error } = await supabase.from('routes').insert({
    title:            params.rideName,
    distance_km:      parseFloat(distanceKm.toFixed(2)),
    elevation_m:      elevationM,
    duration_minutes: durationMins,
    difficulty,
    image_url:        imageUrl,
    featured:         false,
    categories:       [],
    polyline:         params.polyline || null,
    gpx_data:         gpxData,
    region,
    created_by:       user?.id ?? null,
    ...(params.traffic       && { traffic:        params.traffic }),
    ...(params.roadCondition && { road_condition: params.roadCondition }),
    ...(params.whyGood       && { why_good:       params.whyGood }),
  });

  if (error) return { error: error.message };
  return {};
}

/**
 * Get routes by multiple IDs
 * Useful for fetching favorite routes
 */
export async function getRoutesByIds(ids: string[]): Promise<Route[]> {
  if (ids.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .in('id', ids)
    .order('title', { ascending: true });

  if (error) {
    console.error('Failed to fetch routes by IDs:', error);
    return [];
  }

  return data.map(mapSupabaseToRoute);
}
