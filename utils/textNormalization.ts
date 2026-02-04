/**
 * Text normalization utilities for search
 * Handles Slovenian diacritics (č, š, ž, ć) for better search experience
 */

/**
 * Removes diacritics from Slovenian text for search matching
 * Maps: š→s, č→c, ć→c, ž→z (and uppercase variants)
 */
export function removeDiacritics(text: string): string {
  return text
    .replace(/[šŠ]/g, 's')
    .replace(/[čćČĆ]/g, 'c')
    .replace(/[žŽ]/g, 'z');
}

/**
 * Normalizes text for search: removes diacritics and converts to lowercase
 */
export function normalizeForSearch(text: string): string {
  return removeDiacritics(text).toLowerCase();
}
