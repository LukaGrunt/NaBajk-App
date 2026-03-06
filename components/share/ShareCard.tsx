/**
 * ShareCard — hidden view captured as a PNG for Instagram/Facebook story sharing.
 * Must be mounted in the tree (even if invisible) before captureRef is called.
 */

import React, { forwardRef } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import Colors from '@/constants/Colors';
import { GradientProfile } from '@/components/climbs/GradientProfile';
import { calculateRideMinutes } from '@/utils/rideTimeCalculator';

function gradientColor(pct: number): string {
  if (pct < 3) return '#00BF76';
  if (pct < 5) return '#AAEE00';
  if (pct < 7) return '#FF9900';
  if (pct < 9) return '#FF4400';
  return '#CC0000';
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

// ── Static map tile math (CartoDB dark tiles, no API key needed) ──────────────

const TILE_SIZE = 256;

function lngToPixelX(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * Math.pow(2, zoom) * TILE_SIZE;
}

function latToPixelY(lat: number, zoom: number): number {
  const latRad = lat * Math.PI / 180;
  return ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2)
    * Math.pow(2, zoom) * TILE_SIZE;
}

interface StaticMapData {
  tiles: Array<{ url: string; left: number; top: number }>;
  svgPoints: string;
}

function buildStaticMap(
  pts: Array<{ lat: number; lng: number }>,
  containerW: number,
  containerH: number,
): StaticMapData | null {
  if (pts.length < 2) return null;

  const lats = pts.map(p => p.lat);
  const lngs = pts.map(p => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  // Pick the highest zoom where the route + 30% padding fits
  let zoom = 12;
  for (let z = 14; z >= 3; z--) {
    const routeW = lngToPixelX(maxLng, z) - lngToPixelX(minLng, z);
    const routeH = latToPixelY(minLat, z) - latToPixelY(maxLat, z);
    if (routeW <= containerW * 0.70 && routeH <= containerH * 0.70) {
      zoom = z;
      break;
    }
  }

  // Viewport top-left in world pixels
  const centerPxX = lngToPixelX(centerLng, zoom);
  const centerPxY = latToPixelY(centerLat, zoom);
  const viewLeft  = centerPxX - containerW / 2;
  const viewTop   = centerPxY - containerH / 2;

  // Which tiles cover the viewport?
  const txStart = Math.floor(viewLeft / TILE_SIZE);
  const txEnd   = Math.floor((viewLeft + containerW - 1) / TILE_SIZE);
  const tyStart = Math.floor(viewTop  / TILE_SIZE);
  const tyEnd   = Math.floor((viewTop  + containerH - 1) / TILE_SIZE);

  const tiles: StaticMapData['tiles'] = [];
  for (let ty = tyStart; ty <= tyEnd; ty++) {
    for (let tx = txStart; tx <= txEnd; tx++) {
      tiles.push({
        url:  `https://a.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${tx}/${ty}@2x.png`,
        left: tx * TILE_SIZE - viewLeft,
        top:  ty * TILE_SIZE - viewTop,
      });
    }
  }

  // Route points → viewport pixel coords
  const svgPoints = pts.map(p =>
    `${(lngToPixelX(p.lng, zoom) - viewLeft).toFixed(1)},${(latToPixelY(p.lat, zoom) - viewTop).toFixed(1)}`
  ).join(' ');

  return { tiles, svgPoints };
}

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  rideName:          string;
  distanceKm:        string;
  durationSeconds:   number;
  points?:           Array<{ lat: number; lng: number }>;
  isClimb?:          boolean;
  elevationProfile?: number[];
  avgGradient?:      number;
  elevationM?:       number;
}

const ROUTE_W = 280;
const ROUTE_H = 200;

export const ShareCard = forwardRef<View, Props>(
  ({ rideName, distanceKm, points, isClimb, elevationProfile, avgGradient, elevationM }, ref) => {

    const isRegularRoute = !(isClimb && elevationProfile && elevationProfile.length >= 2);
    const staticMap = isRegularRoute && points && points.length >= 2
      ? buildStaticMap(points, ROUTE_W, ROUTE_H)
      : null;

    const predictedTime = isRegularRoute
      ? formatMinutes(calculateRideMinutes(parseFloat(distanceKm), elevationM ?? 0, 'intermediate'))
      : null;

    return (
      <View ref={ref} collapsable={false} style={styles.card}>

        {/* Logo */}
        <Image
          source={require('@/assets/images/logo-navbar.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* ── CLIMB branch ── */}
        {isClimb && elevationProfile && elevationProfile.length >= 2 ? (
          <>
            <View style={styles.routeContainer}>
              <GradientProfile
                elevationProfile={elevationProfile}
                distanceKm={parseFloat(distanceKm)}
                width={ROUTE_W}
                height={240}
                showLabels={false}
                showBarLabels={true}
              />
            </View>

            <Text style={styles.elevValue}>{elevationM ?? '—'}</Text>
            <Text style={styles.elevUnit}>M VZPON</Text>
            <Text style={styles.distSecondary}>{distanceKm} KM</Text>

            {avgGradient != null && (
              <View style={[styles.gradBadge, { backgroundColor: gradientColor(avgGradient) + '33', borderColor: gradientColor(avgGradient) }]}>
                <Text style={[styles.gradText, { color: gradientColor(avgGradient) }]}>
                  ▲ avg {avgGradient.toFixed(1)}%
                </Text>
              </View>
            )}
          </>

        ) : staticMap ? (
          /* ── REGULAR ROUTE with real map tiles ── */
          <View style={[styles.routeContainer, { width: ROUTE_W, height: ROUTE_H }]}>
            {/* Dark map tiles */}
            {staticMap.tiles.map((tile, i) => (
              <Image
                key={i}
                source={{ uri: tile.url }}
                style={{ position: 'absolute', left: tile.left, top: tile.top, width: TILE_SIZE, height: TILE_SIZE }}
              />
            ))}
            {/* Route overlay */}
            <Svg style={{ position: 'absolute' }} width={ROUTE_W} height={ROUTE_H}>
              <Polyline points={staticMap.svgPoints} fill="none"
                stroke="rgba(0,188,124,0.20)" strokeWidth={5}
                strokeLinecap="round" strokeLinejoin="round" />
              <Polyline points={staticMap.svgPoints} fill="none"
                stroke="rgba(0,188,124,0.45)" strokeWidth={2.5}
                strokeLinecap="round" strokeLinejoin="round" />
              <Polyline points={staticMap.svgPoints} fill="none"
                stroke={Colors.brandGreen} strokeWidth={1.5}
                strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>

        ) : (
          <View style={styles.divider} />
        )}

        {/* ── REGULAR ROUTE stats (2-row layout) ── */}
        {isRegularRoute && (
          <>
            {/* Row 1: Distance + Elevation */}
            <View style={styles.statsRow1}>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{distanceKm}</Text>
                <Text style={styles.statLabel}>KM</Text>
              </View>
              <View style={styles.statSep} />
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>↑ {elevationM ?? '—'}</Text>
                <Text style={styles.statLabel}>M VZPON</Text>
              </View>
            </View>

            {/* Row 2: Time */}
            <View style={styles.timeRow}>
              <Text style={styles.timeValue}>{predictedTime}</Text>
              <Text style={styles.timeLabel}>ČAS VOŽNJE</Text>
            </View>
          </>
        )}

        {/* Route name */}
        <View style={styles.divider} />
        <Text style={styles.rideName} numberOfLines={2}>{rideName}</Text>

      </View>
    );
  }
);

ShareCard.displayName = 'ShareCard';

const styles = StyleSheet.create({
  card: {
    width:             360,
    height:            640,
    backgroundColor:   Colors.background,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 40,
  },
  logo: {
    width:        120,
    height:       36,
    marginBottom: 16,
  },
  routeContainer: {
    borderWidth:  1,
    borderColor:  'rgba(0,188,124,0.20)',
    borderRadius: 16,
    marginBottom: 20,
    overflow:     'hidden',
    backgroundColor: '#0d1117',
  },
  divider: {
    width:           48,
    height:          2,
    backgroundColor: Colors.brandGreen,
    borderRadius:    1,
    marginVertical:  20,
  },
  // ── Regular route stats ──
  statsRow1: {
    flexDirection: 'row',
    alignItems:    'center',
    marginTop:     4,
    marginBottom:  10,
  },
  statBlock: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  statSep: {
    width:           1,
    height:          36,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  statValue: {
    fontSize:      36,
    fontWeight:    '800',
    color:         Colors.textPrimary,
    fontVariant:   ['tabular-nums'],
    letterSpacing: -1,
    lineHeight:    40,
  },
  statLabel: {
    fontSize:      10,
    fontWeight:    '700',
    color:         Colors.brandGreen,
    letterSpacing: 2,
    marginTop:     3,
  },
  timeRow: {
    alignItems:   'center',
    marginBottom: 4,
  },
  timeValue: {
    fontSize:      52,
    fontWeight:    '800',
    color:         Colors.textPrimary,
    fontVariant:   ['tabular-nums'],
    letterSpacing: -2,
    lineHeight:    56,
  },
  timeLabel: {
    fontSize:      10,
    fontWeight:    '700',
    color:         Colors.brandGreen,
    letterSpacing: 2,
    marginTop:     3,
  },
  rideName: {
    fontSize:   18,
    fontWeight: '600',
    color:      Colors.textSecondary,
    textAlign:  'center',
    lineHeight: 26,
  },
  // ── Climb stats ──
  gradBadge: {
    borderRadius:      10,
    borderWidth:       1,
    paddingHorizontal: 14,
    paddingVertical:   5,
    marginBottom:      12,
  },
  gradText: {
    fontSize:   14,
    fontWeight: '700',
  },
  elevValue: {
    fontSize:      88,
    fontWeight:    '800',
    color:         '#FF6B35',
    fontVariant:   ['tabular-nums'],
    letterSpacing: -3,
    lineHeight:    88,
  },
  elevUnit: {
    fontSize:      15,
    fontWeight:    '700',
    color:         '#FF6B35',
    letterSpacing: 3,
    marginTop:     6,
  },
  distSecondary: {
    fontSize:     22,
    fontWeight:   '500',
    color:        Colors.textSecondary,
    marginTop:    8,
    marginBottom: 12,
  },
});
