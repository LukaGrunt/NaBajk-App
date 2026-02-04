import { Language } from '@/constants/i18n';

/**
 * Format date/time for group ride display
 * SL: "Sobota, 8. februar ob 09:00"
 * EN: "Saturday, Feb 8 at 9:00 AM"
 */
export function formatGroupRideDateTime(isoDate: string, language: Language): string {
  const date = new Date(isoDate);

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
  };

  const locale = language === 'sl' ? 'sl-SI' : 'en-US';

  const dateStr = new Intl.DateTimeFormat(locale, dateOptions).format(date);
  const timeStr = new Intl.DateTimeFormat(locale, timeOptions).format(date);

  if (language === 'sl') {
    return `${dateStr} ob ${timeStr}`;
  } else {
    return `${dateStr} at ${timeStr}`;
  }
}

/**
 * Format short date for list items
 * SL: "Sob 8.2."
 * EN: "Sat Feb 8"
 */
export function formatShortDate(isoDate: string, language: Language): string {
  const date = new Date(isoDate);

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: language === 'sl' ? 'numeric' : 'short',
  };

  const locale = language === 'sl' ? 'sl-SI' : 'en-US';

  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * Format a date-only string (YYYY-MM-DD) for race/event list display.
 * Appends T12:00:00 before parsing so timezone offsets don't shift the day.
 * SL: "sob, 15. februar 2026"
 * EN: "Sat, Feb 15, 2026"
 */
export function formatRaceDate(dateStr: string, language: Language): string {
  const date = new Date(dateStr + 'T12:00:00');
  const locale = language === 'sl' ? 'sl-SI' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day:     'numeric',
    month:   'long',
    year:    'numeric',
  }).format(date);
}

/**
 * Format time only
 * "09:00"
 */
export function formatTime(isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}
