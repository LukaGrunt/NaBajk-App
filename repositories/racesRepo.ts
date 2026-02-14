import { supabase } from '@/lib/supabase';

export interface Race {
  id: string;
  name: string;
  raceDate: string; // YYYY-MM-DD
  region?: string;
  link?: string;
}

// Supabase row type (snake_case from database)
interface SupabaseRaceRow {
  id: string;
  name: string;
  race_date: string;
  region: string | null;
  link: string | null;
}

/**
 * Fetch upcoming races (race_date >= today), ordered by date ascending.
 * Throws on network/query error — caller is responsible for handling.
 */
export async function listRaces(): Promise<Race[]> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const { data, error } = await supabase
    .from('races')
    .select('id, name, race_date, region, link')
    .gte('race_date', today)
    .order('race_date', { ascending: true });

  if (error) throw error;

  return (data || []).map((row: SupabaseRaceRow) => ({
    id:        row.id,
    name:      row.name,
    raceDate:  row.race_date,
    region:    row.region  ?? undefined,
    link:      row.link    ?? undefined,
  }));
}
