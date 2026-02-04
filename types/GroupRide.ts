export type GroupRideStatus = 'going' | 'maybe' | 'not_going';
export type GroupRideVisibility = 'public' | 'unlisted';

export interface GroupRide {
  id: string;
  title: string;
  region: 'gorenjska' | 'dolenjska' | 'stajerska';
  startsAt: string; // ISO 8601 timestamp
  meetingPoint: string;
  meetingCoordinates: {
    lat: number;
    lng: number;
  };
  routeId: string; // References Route.id
  notes?: string;
  externalUrl?: string;
  visibility: GroupRideVisibility;
  capacity?: number;
  createdBy: string; // User ID (mock: 'user-lea')
  createdAt: string;

  // TODO: For GPX upload - add optional customPolyline field
  // customPolyline?: string; // Encoded polyline for custom GPX routes
}

export interface GroupRideRSVP {
  id: string;
  groupRideId: string;
  userId: string;
  userName: string;
  status: GroupRideStatus;
  createdAt: string;
}
