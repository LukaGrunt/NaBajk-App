import { Route, RouteCategory, TimeDuration } from '@/types/Route';

/**
 * Mock route data for the Gorenjska region
 * This will be replaced with backend data later
 */
export const mockRoutes: Route[] = [
  {
    id: '1',
    title: 'Vršič iz Kranjske Gore',
    distanceKm: 48,
    elevationM: 1200,
    durationMinutes: 180,
    difficulty: 'Težka',
    imageUrl: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800',
    featured: true,
    categories: ['vzponi'],
  },
  {
    id: '2',
    title: 'Bled – Bohinj – Soriška planina',
    distanceKm: 72,
    elevationM: 1450,
    durationMinutes: 240,
    difficulty: 'Težka',
    imageUrl: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=800',
    featured: true,
    categories: ['trainingLong', 'vzponi'],
  },
  {
    id: '3',
    title: 'Kranj – Škofja Loka – Žiri',
    distanceKm: 55,
    elevationM: 650,
    durationMinutes: 150,
    difficulty: 'Srednja',
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800',
    featured: false,
    categories: ['coffee'],
    polyline: 'qzp~Gexlq@wCeDoB_CoCyCyAsBqAiBmAcBkAaBiAaB{@wAy@sAs@kAu@iAaAuAoBeCqB_CkAgAgAcAy@o@w@g@}@g@cAc@eA[gAQkAGiA?kAHkAPiAZgAb@_Ad@{@h@y@n@u@r@q@x@',
  },
  {
    id: '4',
    title: 'Bled – Pokljuka',
    distanceKm: 35,
    elevationM: 900,
    durationMinutes: 120,
    difficulty: 'Srednja',
    imageUrl: 'https://images.unsplash.com/photo-1571188654248-7a89213915f7?w=800',
    featured: false,
    categories: [],
  },
  {
    id: '5',
    title: 'Radovljica – Kropa – Jamnik',
    distanceKm: 42,
    elevationM: 550,
    durationMinutes: 110,
    difficulty: 'Lahka',
    imageUrl: 'https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?w=800',
    featured: false,
    categories: ['family', 'coffee'],
    polyline: 'mfp~Govlq@qBkC}AyBiBsCmA_BkAeBgAiBgAwA{@wAw@sA{@uAaBiCqAoBoA}AgAkAcAaAmA_AoAu@}@k@eAe@{@Ww@Mc@@{@Hw@Ry@Zu@d@s@n@o@v@m@z@i@bAc@dA_@dAY`AQbAKfAA`AB|@Jz@Pv@V',
  },
];

export const featuredRoutes = mockRoutes.filter((route) => route.featured);
export const allRoutes = mockRoutes;

/**
 * Get routes filtered by category
 * Note: favourites category is handled separately via FavouritesContext
 */
export function getRoutesByCategory(category: RouteCategory): Route[] {
  return mockRoutes.filter((route) => route.categories.includes(category));
}

/**
 * Get routes filtered by time duration
 */
export function getRoutesByDuration(duration: TimeDuration): Route[] {
  switch (duration) {
    case '1h':
      return mockRoutes.filter((r) => r.durationMinutes <= 60);
    case '2h':
      return mockRoutes.filter((r) => r.durationMinutes > 60 && r.durationMinutes <= 120);
    case '3h':
      return mockRoutes.filter((r) => r.durationMinutes > 120 && r.durationMinutes <= 180);
    case '4h+':
      return mockRoutes.filter((r) => r.durationMinutes > 180);
    default:
      return mockRoutes;
  }
}
