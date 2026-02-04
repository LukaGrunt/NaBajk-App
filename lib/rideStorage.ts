import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'nabajk_saved_rides';

// ── types ────────────────────────────────────────────────

export interface SavedRide {
  id:              string;
  createdAt:       string;   // ISO 8601
  name:            string;
  region:          string;
  durationSeconds: number;
  distanceMeters:  number;
  polylineEncoded: string;   // Google polyline
  pointsCount:     number;
  gpxPath:         string;   // local file URI (expo-file-system)
  uploaded:        boolean;  // TODO: set true after Supabase upload
}

// ── CRUD ─────────────────────────────────────────────────

/** Prepend a new ride to the persisted list. */
export async function saveRide(ride: Omit<SavedRide, 'uploaded'>): Promise<void> {
  const rides = await listSavedRides();
  rides.unshift({ ...ride, uploaded: false });
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rides));
}

/** Return all saved rides (newest first). */
export async function listSavedRides(): Promise<SavedRide[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw) as SavedRide[]; }
  catch { return []; }
}

/** Fetch a single ride by id, or null. */
export async function getRide(id: string): Promise<SavedRide | null> {
  const rides = await listSavedRides();
  return rides.find(r => r.id === id) ?? null;
}

/**
 * TODO: After uploading the GPX file to Supabase Storage and inserting
 * a metadata row into the `rides` table, call markUploaded to flag it:
 *
 *   const { data } = await supabase.storage
 *     .from('gpx-files')
 *     .upload(fileName, gpxBlob, { contentType: 'application/gpx+xml' });
 *
 *   await supabase.from('rides').insert({ ...ride, gpx_url: data.path });
 *   await markUploaded(ride.id);
 */
export async function markUploaded(id: string): Promise<void> {
  const rides = await listSavedRides();
  const ride  = rides.find(r => r.id === id);
  if (ride) {
    ride.uploaded = true;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rides));
  }
}
