import { RiderLevel } from '@/constants/i18n';

const SPEEDS: Record<RiderLevel, number> = {
  beginner: 26,
  intermediate: 29,
  hardcore: 33,
};

export function calculateRideMinutes(
  distanceKm: number,
  elevationM: number,
  level: RiderLevel = 'intermediate'
): number {
  const speed = SPEEDS[level] ?? SPEEDS.intermediate;
  const efd = distanceKm + elevationM / 100;
  return Math.round((efd / speed) * 60);
}

/**
 * Minutes to display for a route. In-app recorded rides (createdBy set)
 * carry the rider's real moving time in durationMinutes — show that.
 * The rider-level estimate is only for curated routes without a recording.
 */
export function displayRideMinutes(
  route: { distanceKm: number; elevationM: number; durationMinutes: number; createdBy?: string },
  level: RiderLevel = 'intermediate'
): number {
  if (route.createdBy && route.durationMinutes > 0) return route.durationMinutes;
  return calculateRideMinutes(route.distanceKm, route.elevationM ?? 0, level);
}
