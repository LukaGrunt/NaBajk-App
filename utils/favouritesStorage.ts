/**
 * AsyncStorage utilities for managing favourite routes
 * Persists user's starred routes across app restarts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVOURITES_KEY = '@nabajk_favourites';

/**
 * Get the list of favourited route IDs from AsyncStorage
 * @returns Array of route IDs, empty array if none found
 */
export async function getFavourites(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(FAVOURITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading favourites from storage:', error);
    return [];
  }
}

/**
 * Save the list of favourited route IDs to AsyncStorage
 * @param favourites Array of route IDs to save
 */
export async function setFavourites(favourites: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FAVOURITES_KEY, JSON.stringify(favourites));
  } catch (error) {
    console.error('Error saving favourites to storage:', error);
  }
}

/**
 * Toggle a route's favourite status
 * If route is favourited, remove it. If not, add it.
 * @param routeId The route ID to toggle
 * @returns Updated array of favourite route IDs
 */
export async function toggleFavourite(routeId: string): Promise<string[]> {
  const current = await getFavourites();
  const newFavourites = current.includes(routeId)
    ? current.filter((id) => id !== routeId)
    : [...current, routeId];
  await setFavourites(newFavourites);
  return newFavourites;
}
