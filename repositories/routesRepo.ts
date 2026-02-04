import { supabase } from '@/lib/supabase';
import { Route, RouteCategory, TimeDuration } from '@/types/Route';

/**
 * Routes Repository - Supabase Integration
 * Fetches cycling routes from Supabase database
 */

// Helper: Map Supabase snake_case to TypeScript camelCase
function mapSupabaseToRoute(data: any): Route {
  return {
    id: data.id,
    title: data.title,
    distanceKm: parseFloat(data.distance_km),
    elevationM: data.elevation_m,
    durationMinutes: data.duration_minutes,
    difficulty: data.difficulty,
    imageUrl: data.image_url,
    featured: data.featured,
    categories: data.categories || [],
    polyline: data.polyline,
  };
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
