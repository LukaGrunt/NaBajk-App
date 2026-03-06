/**
 * ClimbListItem — card for the /climbs screen.
 * Shows name/stats on left, gradient chart (or orange slope placeholder) on right.
 * Includes a share button to post to Instagram stories.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Svg, { Path, Polyline, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { Route } from '@/types/Route';
import { GradientProfile } from './GradientProfile';
import { StoryShareSheet } from '@/components/share/StoryShareSheet';
import { parseGpxWithElevation } from '@/utils/gpx';
import { computeElevationProfileFromPoints } from '@/repositories/routesRepo';
import { calculateRideMinutes } from '@/utils/rideTimeCalculator';
import { useRiderLevel } from '@/contexts/RiderLevelContext';

const VISUAL_W = 148;
const VISUAL_H = 88;

function gradientColor(pct: number): string {
  if (pct < 3) return '#00BF76';
  if (pct < 5) return '#AAEE00';
  if (pct < 7) return '#FF9900';
  if (pct < 9) return '#FF4400';
  return '#CC0000';
}

/** Orange rising-slope visual for climbs with no stored elevation profile */
function ClimbSlopePlaceholder() {
  const w = VISUAL_W;
  const h = VISUAL_H;
  const fillPath = `M 0 ${h} L ${w * 0.15} ${h * 0.78} L ${w * 0.42} ${h * 0.44} L ${w * 0.72} ${h * 0.18} L ${w} 2 L ${w} ${h} Z`;
  const linePoints = `0,${h} ${w * 0.15},${h * 0.78} ${w * 0.42},${h * 0.44} ${w * 0.72},${h * 0.18} ${w},2`;
  return (
    <Svg width={w} height={h}>
      <Defs>
        <SvgGradient id="og" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#FF4400" stopOpacity={0.2} />
          <Stop offset="1" stopColor="#FF9900" stopOpacity={0.6} />
        </SvgGradient>
      </Defs>
      <Path d={fillPath} fill="url(#og)" />
      {/* Glow */}
      <Polyline
        points={linePoints}
        fill="none"
        stroke="rgba(255,140,50,0.35)"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Crisp line */}
      <Polyline
        points={linePoints}
        fill="none"
        stroke="rgba(255,155,65,0.9)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface Props {
  route: Route;
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function ClimbListItem({ route }: Props) {
  const router = useRouter();
  const { riderLevel } = useRiderLevel();
  const [shareVisible, setShareVisible] = useState(false);
  const [computedProfile, setComputedProfile] = useState<number[] | null>(null);

  // Compute elevation profile from GPX if not stored in DB
  useEffect(() => {
    if (route.elevationProfile && route.elevationProfile.length >= 2) return;
    if (!route.gpxData || route.distanceKm <= 0) return;
    const pts = parseGpxWithElevation(route.gpxData);
    if (pts.some(p => p.alt !== null)) {
      const profile = computeElevationProfileFromPoints(
        pts.map(p => ({ lat: p.lat, lng: p.lng, alt: p.alt ?? undefined })),
        route.distanceKm
      );
      setComputedProfile(profile);
    }
  }, [route.id]);

  const activeProfile = route.elevationProfile ?? computedProfile ?? undefined;
  const rideMinutes = calculateRideMinutes(route.distanceKm, route.elevationM, riderLevel);

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => router.push(`/route/${route.id}`)}
      >
        {/* Left: info */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{route.title}</Text>

          <View style={styles.statsRow}>
            <FontAwesome name="road" size={12} color={Colors.textMuted} />
            <Text style={styles.stat}>{route.distanceKm} km</Text>
            <FontAwesome name="line-chart" size={12} color={Colors.textMuted} />
            <Text style={styles.stat}>{route.elevationM} m</Text>
            <FontAwesome name="clock-o" size={12} color={Colors.textMuted} />
            <Text style={styles.stat}>{formatMinutes(rideMinutes)}</Text>
          </View>

          <View style={styles.bottomRow}>
            {route.avgGradient != null ? (
              <View style={[styles.gradBadge, { backgroundColor: gradientColor(route.avgGradient) + '33', borderColor: gradientColor(route.avgGradient) }]}>
                <Text style={[styles.gradText, { color: gradientColor(route.avgGradient) }]}>
                  ▲ {route.avgGradient.toFixed(1)}%
                </Text>
              </View>
            ) : <View />}

            <TouchableOpacity
              style={styles.shareBtn}
              onPress={() => setShareVisible(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome name="share-square-o" size={15} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Right: gradient visualization */}
        <View style={styles.visualWrap}>
          {activeProfile && activeProfile.length >= 2 ? (
            <GradientProfile
              elevationProfile={activeProfile}
              distanceKm={route.distanceKm}
              width={VISUAL_W}
              height={VISUAL_H}
              showLabels={false}
            />
          ) : (
            <ClimbSlopePlaceholder />
          )}
        </View>
      </TouchableOpacity>

      <StoryShareSheet
        visible={shareVisible}
        onSkip={() => setShareVisible(false)}
        rideName={route.title}
        distanceKm={route.distanceKm.toFixed(2)}
        durationSeconds={route.durationMinutes * 60}
        isClimb
        elevationProfile={activeProfile}
        avgGradient={route.avgGradient ?? undefined}
        elevationM={route.elevationM ?? undefined}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: Colors.surface1,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.22)',
    overflow: 'hidden',
  },
  info: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 10,
    gap: 7,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stat: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gradBadge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  gradText: {
    fontSize: 12,
    fontWeight: '700',
  },
  shareBtn: {
    padding: 2,
  },
  visualWrap: {
    width: VISUAL_W,
    backgroundColor: '#0D0D0E',
    overflow: 'hidden',
  },
});
