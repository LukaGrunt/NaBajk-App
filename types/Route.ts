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
  region?: string;
  polyline?: string; // Encoded polyline string (Google Polyline format)
  gpxData?: string;  // Raw GPX XML stored in database
  isClimb?: boolean;
  avgGradient?: number;       // average gradient percent
  elevationProfile?: number[]; // elevation in metres per km segment
  traffic?: string;
  roadCondition?: string;
  whyGood?: string;
}
