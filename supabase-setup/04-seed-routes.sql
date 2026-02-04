-- Seed initial routes from mockRoutes.ts
-- Run this in Supabase SQL Editor after completing the setup

-- Insert 5 initial routes for Gorenjska region
INSERT INTO routes (title, distance_km, elevation_m, duration_minutes, difficulty, image_url, featured, categories, polyline, region) VALUES
(
  'Vršič iz Kranjske Gore',
  48.00,
  1200,
  180,
  'Težka',
  'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800',
  true,
  ARRAY['vzponi']::TEXT[],
  NULL,
  'gorenjska'
),
(
  'Bled – Bohinj – Soriška planina',
  72.00,
  1450,
  240,
  'Težka',
  'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=800',
  true,
  ARRAY['trainingLong', 'vzponi']::TEXT[],
  NULL,
  'gorenjska'
),
(
  'Kranj – Škofja Loka – Žiri',
  55.00,
  650,
  150,
  'Srednja',
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800',
  false,
  ARRAY['coffee']::TEXT[],
  'qzp~Gexlq@wCeDoB_CoCyCyAsBqAiBmAcBkAaBiAaB{@wAy@sAs@kAu@iAaAuAoBeCqB_CkAgAgAcAy@o@w@g@}@g@cAc@eA[gAQkAGiA?kAHkAPiAZgAb@_Ad@{@h@y@n@u@r@q@x@',
  'gorenjska'
),
(
  'Bled – Pokljuka',
  35.00,
  900,
  120,
  'Srednja',
  'https://images.unsplash.com/photo-1571188654248-7a89213915f7?w=800',
  false,
  ARRAY[]::TEXT[],
  NULL,
  'gorenjska'
),
(
  'Radovljica – Kropa – Jamnik',
  42.00,
  550,
  110,
  'Lahka',
  'https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?w=800',
  false,
  ARRAY['family', 'coffee']::TEXT[],
  'mfp~Govlq@qBkC}AyBiBsCmA_BkAeBgAiBgAwA{@wAw@sA{@uAaBiCqAoBoA}AgAkAcAaAmA_AoAu@}@k@eAe@{@Ww@Mc@@{@Hw@Ry@Zu@d@s@n@o@v@m@z@i@bAc@dA_@dAY`AQbAKfAA`AB|@Jz@Pv@V',
  'gorenjska'
);

-- Verify the routes were inserted
SELECT id, title, distance_km, elevation_m, featured FROM routes ORDER BY title;
