import { supabase } from '@/lib/supabase';
import { GroupRide, GroupRideRSVP, GroupRideStatus } from '@/types/GroupRide';

// Supabase row types (snake_case from database)
interface SupabaseGroupRideRow {
  id: string;
  title: string;
  region: string;
  starts_at: string;
  meeting_point: string;
  meeting_coordinates: { lat: number; lng: number } | null;
  route_id: string | null;
  notes: string | null;
  external_url: string | null;
  visibility: string;
  capacity: number | null;
  created_by: string;
  created_at: string;
}

interface SupabaseRSVPRow {
  id: string;
  group_ride_id: string;
  user_id: string;
  user_name: string;
  status: GroupRideStatus;
  created_at: string;
}

// Helper: Map Supabase snake_case to TypeScript camelCase
function mapSupabaseToGroupRide(data: SupabaseGroupRideRow): GroupRide {
  return {
    id: data.id,
    title: data.title,
    region: data.region as GroupRide['region'],
    startsAt: data.starts_at,
    meetingPoint: data.meeting_point,
    meetingCoordinates: data.meeting_coordinates || { lat: 0, lng: 0 },
    routeId: data.route_id || '',
    notes: data.notes ?? undefined,
    externalUrl: data.external_url ?? undefined,
    visibility: (data.visibility === 'unlisted' ? 'unlisted' : 'public') as GroupRide['visibility'],
    capacity: data.capacity ?? undefined,
    createdBy: data.created_by,
    createdAt: data.created_at,
  };
}

function mapSupabaseToRSVP(data: SupabaseRSVPRow): GroupRideRSVP {
  return {
    id: data.id,
    groupRideId: data.group_ride_id,
    userId: data.user_id,
    userName: data.user_name,
    status: data.status,
    createdAt: data.created_at,
  };
}

/**
 * List all upcoming public group rides, sorted by startsAt
 */
export async function listGroupRides(): Promise<GroupRide[]> {
  const { data, error } = await supabase
    .from('group_rides')
    .select('*')
    .gte('starts_at', new Date().toISOString())
    .eq('visibility', 'public')
    .order('starts_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch group rides:', error);
    return [];
  }

  return data.map(mapSupabaseToGroupRide);
}

/**
 * Get single group ride by ID
 */
export async function getGroupRide(id: string): Promise<GroupRide | null> {
  const { data, error } = await supabase
    .from('group_rides')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to fetch group ride:', error);
    return null;
  }

  return mapSupabaseToGroupRide(data);
}

/**
 * Create new group ride
 */
export async function createGroupRide(
  ride: Omit<GroupRide, 'id' | 'createdAt'>
): Promise<GroupRide> {
  const { data, error } = await supabase
    .from('group_rides')
    .insert({
      title: ride.title,
      region: ride.region,
      starts_at: ride.startsAt,
      meeting_point: ride.meetingPoint,
      meeting_coordinates: ride.meetingCoordinates,
      route_id: ride.routeId || null,
      notes: ride.notes,
      external_url: ride.externalUrl,
      visibility: ride.visibility,
      capacity: ride.capacity,
      created_by: ride.createdBy,
    })
    .select()
    .single();

  if (error) throw error;
  return mapSupabaseToGroupRide(data);
}

/**
 * List RSVPs for a group ride
 */
export async function listRSVPs(groupRideId: string): Promise<GroupRideRSVP[]> {
  const { data, error } = await supabase
    .from('group_ride_rsvps')
    .select('*')
    .eq('group_ride_id', groupRideId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch RSVPs:', error);
    return [];
  }

  return data.map(mapSupabaseToRSVP);
}

/**
 * Create or update RSVP
 */
export async function upsertRSVP(
  groupRideId: string,
  userId: string,
  userName: string,
  status: GroupRideStatus
): Promise<GroupRideRSVP> {
  const { data, error } = await supabase
    .from('group_ride_rsvps')
    .upsert(
      {
        group_ride_id: groupRideId,
        user_id: userId,
        user_name: userName,
        status: status,
      },
      { onConflict: 'group_ride_id,user_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return mapSupabaseToRSVP(data);
}

/**
 * Get RSVP counts by status
 */
export async function getRSVPCounts(groupRideId: string): Promise<{
  going: number;
  maybe: number;
  notGoing: number;
}> {
  const rideRsvps = await listRSVPs(groupRideId);

  return {
    going: rideRsvps.filter((r) => r.status === 'going').length,
    maybe: rideRsvps.filter((r) => r.status === 'maybe').length,
    notGoing: rideRsvps.filter((r) => r.status === 'not_going').length,
  };
}
