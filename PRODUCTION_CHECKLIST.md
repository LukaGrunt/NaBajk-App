# Production Build Checklist

Before publishing NaBajk to App Store and Google Play Store, complete these steps:

## 1. Restore MapLibre Maps

**Current Status:** Map component is using a placeholder for Expo Go compatibility.

**Steps to restore:**

```bash
# Install MapLibre
npm install @maplibre/maplibre-react-native
```

**Replace `components/RouteMap.tsx` with this code:**

```typescript
import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { decodePolyline } from '@/utils/polyline';
import Colors from '@/constants/Colors';

// Configure MapLibre (no access token needed for free tiles)
MapLibreGL.setAccessToken(null);

interface RouteMapProps {
  polyline: string;
  height?: number;
}

export function RouteMap({ polyline, height = 300 }: RouteMapProps) {
  const routeGeoJSON = useMemo(() => {
    if (!polyline) return null;

    const decoded = decodePolyline(polyline);
    // Convert to [lng, lat] format (GeoJSON format)
    const coordinates = decoded.map(coord => [coord.lng, coord.lat]);

    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates,
      },
    };
  }, [polyline]);

  const bounds = useMemo(() => {
    if (!routeGeoJSON) return null;

    const coords = routeGeoJSON.geometry.coordinates;
    const lngs = coords.map((c: number[]) => c[0]);
    const lats = coords.map((c: number[]) => c[1]);

    return {
      ne: [Math.max(...lngs), Math.max(...lats)],
      sw: [Math.min(...lngs), Math.min(...lats)],
      paddingTop: 50,
      paddingBottom: 50,
      paddingLeft: 50,
      paddingRight: 50,
    };
  }, [routeGeoJSON]);

  if (!polyline || !routeGeoJSON) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No route data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <MapLibreGL.MapView
        style={styles.map}
        styleURL="https://tiles.openfreemap.org/styles/liberty"
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MapLibreGL.Camera
          bounds={bounds}
          animationDuration={0}
        />

        <MapLibreGL.ShapeSource id="routeSource" shape={routeGeoJSON}>
          <MapLibreGL.LineLayer
            id="routeLine"
            style={{
              lineColor: Colors.brandGreen,
              lineWidth: 4,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </MapLibreGL.ShapeSource>
      </MapLibreGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.cardSurface,
  },
  map: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.cardSurface,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
```

## 2. Build Production Version

### For iOS (requires Apple Developer account - $99/year)

```bash
# Build production version
npx eas build --profile production --platform ios

# Or build development version for TestFlight testing first
npx eas build --profile development --platform ios
```

**After build completes:**
- Download from EAS or wait for TestFlight email
- Test on physical device via TestFlight
- When satisfied, submit to App Store

### For Android (Google Play - $25 one-time fee)

```bash
# Build production version
npx eas build --profile production --platform android

# Or build development version for testing first
npx eas build --profile development --platform android
```

**After build completes:**
- Download APK from EAS
- Install on Android device for testing
- When satisfied, upload to Google Play Console

## 3. Pre-Launch Testing Checklist

Test these features before going live:

- [ ] Routes display correctly with real GPX data
- [ ] MapLibre maps show route polylines in green
- [ ] Maps are free (no API key errors or billing prompts)
- [ ] Group rides load from Supabase
- [ ] RSVP functionality works
- [ ] User authentication (if implemented)
- [ ] Language switching (Slovenian/English)
- [ ] All images and icons display correctly
- [ ] App doesn't crash on route detail screens
- [ ] Weather forecast displays (if implemented)
- [ ] Collections feature works (if implemented)

## 4. Environment Variables

Verify these are set correctly in EAS Secrets (not committed to git):

```bash
# Set in EAS (not in .env file for production)
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://zymssfxffkymkkfndssf.supabase.co"
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key"
```

**Never commit SUPABASE_SERVICE_ROLE_KEY to production builds** - that's only for admin scripts.

## 5. App Store Assets Needed

### Both Platforms
- [ ] App icon (1024x1024)
- [ ] Screenshots (various sizes)
- [ ] Privacy policy URL
- [ ] Terms of service (if applicable)
- [ ] App description (Slovenian and English)

### iOS Specific
- [ ] Apple Developer account ($99/year)
- [ ] App Store Connect setup
- [ ] TestFlight beta testing (optional)

### Android Specific
- [ ] Google Play Developer account ($25 one-time)
- [ ] Signed APK/AAB
- [ ] Content rating questionnaire

## 6. Cost Summary

**Development (Current):** $0/month
- Expo Go: Free
- Supabase: Free tier
- MapLibre: Free (no API keys)

**Production:**
- Apple Developer Program: $99/year (iOS only)
- Google Play Developer: $25 one-time (Android only)
- Supabase: Free tier (upgrade if needed)
- MapLibre: Always free
- EAS Build: Free tier (limited builds) or $29/month for unlimited

**Total ongoing costs:** ~$8.25/month if publishing to both iOS and Android

## 7. Post-Launch

- [ ] Set up crash reporting (Sentry or similar)
- [ ] Monitor Supabase usage
- [ ] Plan admin dashboard at nabajk.si/admin
- [ ] Add more GPX routes via admin panel
- [ ] Implement route CRUD operations
- [ ] Add group ride moderation features

---

## Quick Reference - Production Commands

```bash
# 1. Restore MapLibre
npm install @maplibre/maplibre-react-native

# 2. Update RouteMap.tsx (see code above)

# 3. Test build locally (optional, requires Xcode/Android Studio)
npx expo run:ios
# or
npx expo run:android

# 4. Build for production
npx eas build --profile production --platform ios
npx eas build --profile production --platform android

# 5. Submit to stores
npx eas submit --platform ios
npx eas submit --platform android
```

## Notes

- MapLibre is completely free on both iOS and Android
- No API keys required - uses OpenFreeMap tiles
- GPX data is already loaded in Supabase (route: 874bb03d-e107-41c8-b2fb-d1f7a017f68e)
- Admin GPX parser script available at `scripts/parse-gpx-admin.js`
