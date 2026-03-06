/**
 * Free cycling/road images from Unsplash for use as route placeholders.
 * These are picked when a route has no imageUrl set.
 * All images are cycling-specific: road cycling, mountain biking, scenic routes.
 */
const CYCLING_IMAGES = [
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1571188654248-7a89213915f7?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519583272095-6433daf26b6e?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1420641519650-9d7d0ea0a829?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1421429167374-8fc8ab6d0f66?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1437651278606-e216cf8af1b0?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470920456752-d50214d7ed59?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1471506480208-91b3a4cc78be?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1472712277154-3f6239f25f61?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1478114340800-e32b29bc688e?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1488378207160-463e1eb439aa?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1495213882804-d108674f7b83?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1499455631844-d77c223bca19?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505935878866-7bdf95d778ce?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1510005294384-c03e247f0542?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511875766874-7a61dc1f52a0?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512142217490-9569385ec0d5?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512588617594-f80495876bff?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516118411813-58a79fd7648f?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516147697747-02adcafd3fda?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517305349393-aad1f0ee4328?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1526321391769-26f7321e469d?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1538123924316-45cfb482aeba?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1547981756-dc3f365327c2?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1435226148432-67c26cc5cbaf?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1452573992436-6d508f200b30?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1453169753818-2feab4b4246d?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1458372128312-1d1c1dd115e4?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1458708606976-4af51a03c931?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1465869185982-5a1a7522cbcb?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1473322780082-eca592c43a0f?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1475666675596-cca2035b3d79?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1476345692822-c597e09a0331?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1488401318902-f7feae66db20?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1501118090732-ca9f7489f49d?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502714636343-d41ed787c0c2?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1504495619773-d6762510888b?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505897623456-7c49ceb866b6?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511877150299-3622fc88aee3?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511994298241-608e28f14fde?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512141825035-caa03312b132?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1515722265856-49cdff079949?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518123035211-df59d5140c8e?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1523294026206-60fe99504e54?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1523815378073-a43ae3fbf36a?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1527061570860-2052a1ec015a?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1528271736611-d6698fd0f3ad?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1528964171698-ee39bff7c65e?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1530009016761-e8f2960ac767?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1530143584546-02191bc84eb5?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1531502774286-5e4e8e94879f?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1533107862482-0e6974b06ec4?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1533589067335-b0114bd0ab00?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534146789009-76ed5060ec70?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1536244792875-ae64f6842985?w=600&q=75&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1536244955395-0b8a2a5ab5df?w=600&q=75&auto=format&fit=crop',
];

/**
 * Returns a consistent placeholder image URL for a given route ID.
 * Same ID always returns the same image.
 */
export function getPlaceholderImage(routeId: string): string {
  let hash = 0;
  for (let i = 0; i < routeId.length; i++) {
    hash = (hash * 31 + routeId.charCodeAt(i)) & 0xffffffff;
  }
  const index = Math.abs(hash) % CYCLING_IMAGES.length;
  return CYCLING_IMAGES[index];
}
