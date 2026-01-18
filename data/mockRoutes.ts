import { Route } from '@/types/Route';

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
  },
];

export const featuredRoutes = mockRoutes.filter((route) => route.featured);
export const allRoutes = mockRoutes;
