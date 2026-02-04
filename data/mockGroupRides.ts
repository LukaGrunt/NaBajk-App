import { GroupRide, GroupRideRSVP } from '@/types/GroupRide';

/**
 * Mock group rides data
 * In-memory storage - will be replaced with Supabase
 */
export let groupRides: GroupRide[] = [
  {
    id: '1',
    title: 'Sobotna kava v Radovljico',
    region: 'gorenjska',
    startsAt: '2026-02-08T09:00:00Z',
    meetingPoint: 'Parkirišče Bled jezero',
    meetingCoordinates: { lat: 46.3683, lng: 14.0940 },
    routeId: '5', // Has polyline
    notes: 'Mirna vožnja, postanki za kavo. Dobrodošli vsi!',
    visibility: 'public',
    capacity: 15,
    createdBy: 'user-marko',
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    id: '2',
    title: 'Treningska tura Škofja Loka',
    region: 'gorenjska',
    startsAt: '2026-02-09T08:00:00Z',
    meetingPoint: 'Kranj Avtobusna Postaja',
    meetingCoordinates: { lat: 46.2395, lng: 14.3566 },
    routeId: '3', // Has polyline
    notes: 'Hitrejša vožnja za pripravo na sezono.',
    visibility: 'public',
    createdBy: 'user-petra',
    createdAt: '2026-01-22T14:00:00Z',
  },
  {
    id: '3',
    title: 'Družinska vožnja Pokljuka',
    region: 'gorenjska',
    startsAt: '2026-02-15T10:00:00Z',
    meetingPoint: 'Bled Info Center',
    meetingCoordinates: { lat: 46.3683, lng: 14.1146 },
    routeId: '4', // No polyline - will fallback to imageUrl
    notes: 'Prijazna vožnja za družine z otroki.',
    visibility: 'public',
    capacity: 20,
    createdBy: 'user-lea',
    createdAt: '2026-01-25T16:00:00Z',
  },
];

export let rsvps: GroupRideRSVP[] = [
  {
    id: 'r1',
    groupRideId: '1',
    userId: 'user-marko',
    userName: 'Marko',
    status: 'going',
    createdAt: '2026-01-20T10:05:00Z',
  },
  {
    id: 'r2',
    groupRideId: '1',
    userId: 'user-ana',
    userName: 'Ana',
    status: 'going',
    createdAt: '2026-01-21T08:30:00Z',
  },
  {
    id: 'r3',
    groupRideId: '1',
    userId: 'user-lea',
    userName: 'Lea',
    status: 'going',
    createdAt: '2026-01-21T12:00:00Z',
  },
  {
    id: 'r4',
    groupRideId: '2',
    userId: 'user-petra',
    userName: 'Petra',
    status: 'going',
    createdAt: '2026-01-22T14:05:00Z',
  },
  {
    id: 'r5',
    groupRideId: '2',
    userId: 'user-lea',
    userName: 'Lea',
    status: 'maybe',
    createdAt: '2026-01-23T09:00:00Z',
  },
  {
    id: 'r6',
    groupRideId: '3',
    userId: 'user-lea',
    userName: 'Lea',
    status: 'going',
    createdAt: '2026-01-25T16:05:00Z',
  },
];

/**
 * Mock current user
 * TODO: Replace with actual auth user when Supabase is integrated
 */
export const MOCK_CURRENT_USER = {
  id: 'user-lea',
  name: 'Lea',
};
