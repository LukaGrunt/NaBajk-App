/**
 * Route type definition for cycling routes
 */

export type Difficulty = 'Lahka' | 'Srednja' | 'Težka';

export interface Route {
  id: string;
  title: string;
  distanceKm: number;
  elevationM: number;
  durationMinutes: number;
  difficulty: Difficulty;
  imageUrl: string;
  featured: boolean;
}
