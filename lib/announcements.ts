import { supabase } from '@/lib/supabase';
import { Language } from '@/constants/i18n';

export interface Announcement {
  id: string;
  language: Language;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

/**
 * Fetch the latest active announcement for the given language.
 *
 * Date filters handle nulls:
 *   start_date null  →  treat as "always started"
 *   end_date   null  →  treat as "never expires"
 *
 * Returns null when no matching announcement exists or on any error.
 */
export async function getLatestAnnouncement(language: Language): Promise<Announcement | null> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('active', true)
      .eq('language', language)
      .order('created_at', { ascending: false });

    if (error || !data) return null;

    // In-app date-range filter — correctly handles nullable start_date / end_date.
    // announcements is a small table so this is the clearest approach over
    // trying to compose multiple OR groups in a single PostgREST query.
    const row = data.find((a: any) => {
      const startOk = !a.start_date || a.start_date <= now;
      const endOk   = !a.end_date   || a.end_date   >= now;
      return startOk && endOk;
    });

    if (!row) return null;

    return {
      id:       row.id,
      language: row.language,
      title:    row.title,
      body:     row.body,
      ctaLabel: row.cta_label ?? undefined,
      ctaUrl:   row.cta_url   ?? undefined,
    };
  } catch {
    // Network failure or unexpected error — caller gets null, app keeps running.
    return null;
  }
}
