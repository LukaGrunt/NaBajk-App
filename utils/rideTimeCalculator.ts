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
