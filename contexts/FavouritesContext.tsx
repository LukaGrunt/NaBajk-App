/**
 * FavouritesContext - Global state for user's favourited routes
 * Provides functionality to star/unstar routes and check favourite status
 */

import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  getFavourites,
  toggleFavourite as toggleFavouriteStorage,
} from '@/utils/favouritesStorage';

interface FavouritesContextType {
  favourites: string[];
  toggleFavourite: (routeId: string) => Promise<void>;
  isFavourite: (routeId: string) => boolean;
  isLoading: boolean;
}

const FavouritesContext = createContext<FavouritesContextType>({
  favourites: [],
  toggleFavourite: async () => {},
  isFavourite: () => false,
  isLoading: true,
});

export function FavouritesProvider({ children }: { children: React.ReactNode }) {
  const [favourites, setFavourites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load favourites from AsyncStorage on mount
  useEffect(() => {
    async function loadFavourites() {
      const fav = await getFavourites();
      setFavourites(fav);
      setIsLoading(false);
    }
    loadFavourites();
  }, []);

  // Toggle a route's favourite status
  const toggleFavourite = async (routeId: string) => {
    const newFavourites = await toggleFavouriteStorage(routeId);
    setFavourites(newFavourites);
  };

  // Check if a route is favourited
  const isFavourite = (routeId: string): boolean => {
    return favourites.includes(routeId);
  };

  return (
    <FavouritesContext.Provider value={{ favourites, toggleFavourite, isFavourite, isLoading }}>
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites() {
  return useContext(FavouritesContext);
}
