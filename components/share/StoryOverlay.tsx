/**
 * StoryOverlay – 360 × 640 (9:16) branded canvas for IG / FB Stories.
 *
 * Three layout variants selected via the `type` prop:
 *   route      – route-outline SVG  +  glass card (name, distance)
 *   climb      – elevation-profile SVG  +  glass card (name, avg-gradient badge)
 *   groupRide  – single glass card (title, date, location, join badge)
 *
 * Brand colours in this file are intentionally DIFFERENT from the app's
 * Colors.ts – they follow the marketing-spec palette that was approved
 * for Story assets.
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { t, Language } from '@/constants/i18n';
import { RouteOutline } from '@/components/share/RouteOutline';
import { ClimbProfile } from '@/components/share/ClimbProfile';

// ── marketing brand tokens ─────────────────────────────────
const B = {
  bg:        '#0A0A0B',
  surface1:  '#121214',
  border:    '#2A2A2E',
  textPri:   '#FAFAFA',
  textSec:   '#8A8A8F',
  green:     '#00BF76',
  orange:    '#FF6B35',
};

// ── public data types ──────────────────────────────────────

export interface RouteOverlayData {
  name:           string;
  distanceMeters: number;
  polyline:       string;
}

export interface ClimbOverlayData {
  name:              string;
  avgGradientPercent: number;
  elevationProfile:  number[];
}

export interface GroupRideOverlayData {
  title:        string;
  startsAt:     string;   // already-formatted date string
  meetingPoint: string;
  language:     Language;
  thumbnailUrl?: string;
  routeInfo?:   { distanceKm: number; elevationM: number };
}

export type StoryType = 'route' | 'climb' | 'groupRide';

export interface StoryOverlayProps {
  type:       StoryType;
  route?:     RouteOverlayData;
  climb?:     ClimbOverlayData;
  groupRide?: GroupRideOverlayData;
}

// ── main component ─────────────────────────────────────────

export function StoryOverlay({ type, route, climb, groupRide }: StoryOverlayProps) {
  return (
    <LinearGradient
      style={styles.canvas}
      colors={['#161618', B.bg]}
      locations={[0, 1]}
    >
      {/* logo */}
      <Image
        source={require('@/assets/images/logo-navbar.png')}
        style={styles.logoImage}
        resizeMode="contain"
      />

      {/* centred content */}
      <View style={styles.content}>
        {type === 'route'     && route     && <RouteLayout     data={route}     />}
        {type === 'climb'     && climb     && <ClimbLayout     data={climb}     />}
        {type === 'groupRide' && groupRide && <GroupRideLayout data={groupRide} />}
      </View>

      {/* footer */}
      <Text style={styles.footer}>
        {type === 'groupRide' ? 'nabajk.si' : 'Recorded with @NaBajk.si'}
      </Text>
    </LinearGradient>
  );
}

// ── layout variants ────────────────────────────────────────

function RouteLayout({ data }: { data: RouteOverlayData }) {
  const distLabel = data.distanceMeters >= 1000
    ? `${(data.distanceMeters / 1000).toFixed(1)} km`
    : `${Math.round(data.distanceMeters)} m`;

  return (
    <>
      <RouteOutline polyline={data.polyline} width={296} height={220} />
      <GlassCard>
        <Text style={styles.cardTitle}>{data.name}</Text>
        <View style={styles.statRow}>
          <FontAwesome name="bicycle" size={14} color={B.green} />
          <Text style={styles.statValue}>{distLabel}</Text>
        </View>
      </GlassCard>
    </>
  );
}

function ClimbLayout({ data }: { data: ClimbOverlayData }) {
  return (
    <>
      <ClimbProfile elevationProfile={data.elevationProfile} width={296} height={180} />
      <GlassCard>
        <Text style={styles.cardTitle}>{data.name}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.orangeBadge}>
            <Text style={styles.badgeText}>avg {data.avgGradientPercent.toFixed(1)}%</Text>
          </View>
        </View>
      </GlassCard>
    </>
  );
}

function GroupRideLayout({ data }: { data: GroupRideOverlayData }) {
  return (
    <>
      {/* Hero photo */}
      {data.thumbnailUrl ? (
        <View style={styles.heroWrapper}>
          <Image source={{ uri: data.thumbnailUrl }} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(10,10,11,0)', B.bg]}
            style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
          />
        </View>
      ) : null}

      {/* Info card */}
      <GlassCard style={styles.groupCard}>
        {/* Label */}
        <View style={styles.groupLabel}>
          <FontAwesome name="bicycle" size={11} color={B.green} />
          <Text style={styles.groupLabelText}>{t(data.language, 'groupRideBadge')}</Text>
        </View>

        <View style={styles.thinDivider} />

        {/* Title */}
        <Text style={styles.groupTitle}>{data.title}</Text>

        {/* Date */}
        <View style={styles.infoLine}>
          <FontAwesome name="calendar" size={12} color={B.green} />
          <Text style={styles.infoText}>{data.startsAt}</Text>
        </View>

        {/* Meeting point */}
        <View style={styles.infoLine}>
          <FontAwesome name="map-marker" size={13} color={B.green} />
          <Text style={styles.infoText}>{data.meetingPoint}</Text>
        </View>

        {/* Route stats (optional) */}
        {data.routeInfo && (
          <View style={styles.infoLine}>
            <FontAwesome name="road" size={11} color={B.textSec} />
            <Text style={[styles.infoText, { color: B.textSec }]}>
              {data.routeInfo.distanceKm.toFixed(1)} km  ·  {data.routeInfo.elevationM} m ↑
            </Text>
          </View>
        )}

        <View style={styles.thinDivider} />

        {/* CTA badge */}
        <View style={styles.greenBadge}>
          <FontAwesome name="bicycle" size={11} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.badgeText}>{t(data.language, 'joinNaBajk')}</Text>
        </View>
      </GlassCard>
    </>
  );
}

// ── glass card ──────────────────────────────────────────────

function GlassCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.glass, style]}>{children}</View>;
}

// ── styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  /* 9:16 canvas */
  canvas: {
    width:  360,
    height: 640,
    paddingTop:    48,
    paddingBottom: 40,
    alignItems: 'center',
  },

  /* logo image */
  logoImage: {
    width:  130,
    height: 40,
  },

  /* centred content wrapper */
  content: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    gap:             20,
  },

  /* glass card base */
  glass: {
    backgroundColor:  'rgba(18,18,20,0.88)',
    borderWidth:      1,
    borderColor:      'rgba(42,42,46,0.5)',
    borderRadius:     20,
    padding:          20,
    width:            296,
    alignItems:       'center',
  },

  /* group-ride card */
  groupCard: { gap: 8 },

  /* hero photo */
  heroWrapper: {
    width:        296,
    height:       148,
    borderRadius: 16,
    overflow:     'hidden',
  },
  heroImage: {
    width:  '100%',
    height: '100%',
  },

  /* label row */
  groupLabel: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  groupLabelText: {
    color:         B.green,
    fontSize:      11,
    fontWeight:    '700',
    letterSpacing: 1.5,
  },

  /* thin horizontal rule */
  thinDivider: {
    width:           '100%',
    height:          1,
    backgroundColor: B.border,
    marginVertical:  2,
  },

  /* group ride title — larger than generic cardTitle */
  groupTitle: {
    color:       B.textPri,
    fontSize:    19,
    fontWeight:  '700',
    textAlign:   'center',
    marginBottom: 4,
  },

  /* card internals */
  cardTitle: {
    color:       B.textPri,
    fontSize:    18,
    fontWeight:  '600',
    textAlign:   'center',
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  statValue: {
    color:      B.textPri,
    fontSize:   16,
    fontWeight: '500',
  },

  /* badges */
  badgeRow: { marginTop: 6 },
  orangeBadge: {
    backgroundColor:  B.orange,
    borderRadius:     999,
    paddingVertical:  4,
    paddingHorizontal: 12,
  },
  greenBadge: {
    flexDirection:    'row',
    alignItems:       'center',
    backgroundColor:  B.green,
    borderRadius:     999,
    paddingVertical:  6,
    paddingHorizontal: 16,
  },
  badgeText: {
    color:      '#FFFFFF',
    fontSize:   13,
    fontWeight: '600',
  },

  /* group-ride info lines */
  infoLine: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  infoText: {
    color:    B.textSec,
    fontSize: 14,
  },

  /* footer */
  footer: {
    color:         B.textSec,
    fontSize:      13,
    letterSpacing: 0.5,
  },
});
