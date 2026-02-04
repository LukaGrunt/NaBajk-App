/**
 * Route type definition for cycling routes
 */

export type Difficulty = 'Lahka' | 'Srednja' | 'Težka';

export type RouteCategory = 'vzponi' | 'coffee' | 'family' | 'trainingLong';

export type TimeDuration = '1h' | '2h' | '3h' | '4h+';

export interface Route {
  id: string;
  title: string;
  distanceKm: number;
  elevationM: number;
  durationMinutes: number;
  difficulty: Difficulty;
  imageUrl: string;
  featured: boolean;
  categories: RouteCategory[];
  polyline?: string; // Encoded polyline string (Google Polyline format)

  // TODO: For GPX upload - add optional gpxFile field
  // gpxFile?: string; // Original GPX file URL or data
}
