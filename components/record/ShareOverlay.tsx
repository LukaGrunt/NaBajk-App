import React, { forwardRef, useImperativeHandle, useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import Colors from '@/constants/Colors';
import { coordinatesToSVGPath, getPolylineBounds, decodePolyline } from '@/utils/polyline';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/constants/i18n';

// ── public types ─────────────────────────────────────────

export interface ShareOverlayHandle {
  share(): Promise<void>;
}

interface ShareOverlayProps {
  polyline:        string;
  distanceMeters:  number;
  durationSeconds: number;
}

// ── helpers ───────────────────────────────────────────────

function formatDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function formatDur(s: number): string {
  const min = Math.floor(s / 60);
  const sec = s % 60;
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m}m`;
  }
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}

// ── card dimensions (fixed for ViewShot capture) ─────────

const CARD_W  = 340;
const CARD_H  = 280;
const PATH_W  = CARD_W - 48;   // 24 px padding each side
const PATH_H  = 140;

// ── component ────────────────────────────────────────────

export const ShareOverlay = forwardRef<ShareOverlayHandle, ShareOverlayProps>(
  ({ polyline, distanceMeters, durationSeconds }, ref) => {
    const { language } = useLanguage();
    const viewShotRef  = React.useRef<any>(null);

    /* ── imperative share ──────────────────────────────── */
    useImperativeHandle(ref, () => ({
      async share() {
        try {
          const uri = await viewShotRef.current?.capture();
          if (uri) {
            await Sharing.shareAsync(uri, {
              mimeType: 'image/png',
              dialogTitle: t(language, 'shareRecordedWith'),
            });
            return;
          }
        } catch {
          // ViewShot may fail in Expo Go — fall through to text share
        }
        await Share.share({
          message: `${t(language, 'shareRecordedWith')} – ${formatDist(distanceMeters)}, ${formatDur(durationSeconds)}`,
        });
      },
    }));

    /* ── SVG path ──────────────────────────────────────── */
    const pathString = useMemo(() => {
      if (!polyline) return '';
      const decoded = decodePolyline(polyline);
      if (decoded.length < 2) return '';
      return coordinatesToSVGPath(decoded, PATH_W, PATH_H, 12);
    }, [polyline]);

    const markers = useMemo(() => {
      if (!polyline) return null;
      const decoded = decodePolyline(polyline);
      if (decoded.length < 2) return null;

      const bounds   = getPolylineBounds(decoded);
      const pad      = 12;
      const availW   = PATH_W  - 2 * pad;
      const availH   = PATH_H  - 2 * pad;
      const latRange = bounds.maxLat - bounds.minLat || 1e-5;
      const lngRange = bounds.maxLng - bounds.minLng || 1e-5;

      const toSVG = (c: { lat: number; lng: number }) => ({
        x: ((c.lng - bounds.minLng) / lngRange) * availW + pad,
        y: ((bounds.maxLat - c.lat) / latRange) * availH + pad,
      });

      return { start: toSVG(decoded[0]), end: toSVG(decoded[decoded.length - 1]) };
    }, [polyline]);

    /* ── render ────────────────────────────────────────── */
    return (
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.95 }}>
        <View style={styles.card}>
          {/* header */}
          <Text style={styles.logo}>NaBajk</Text>

          {/* route preview */}
          <View style={styles.svgWrap}>
            {pathString ? (
              <Svg width={PATH_W} height={PATH_H}>
                <Path
                  d={pathString}
                  stroke={Colors.brandGreen}
                  strokeWidth={10}
                  strokeOpacity={0.12}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d={pathString}
                  stroke={Colors.brandGreen}
                  strokeWidth={3}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {markers && (
                  <>
                    <Circle cx={markers.start.x} cy={markers.start.y} r={6}   fill={Colors.brandGreen} />
                    <Circle cx={markers.start.x} cy={markers.start.y} r={3}   fill={Colors.cardSurface} />
                    <Circle cx={markers.end.x}   cy={markers.end.y}   r={6}   fill="#FB923C" />
                    <Circle cx={markers.end.x}   cy={markers.end.y}   r={3}   fill={Colors.cardSurface} />
                  </>
                )}
              </Svg>
            ) : null}
          </View>

          {/* stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatDist(distanceMeters)}</Text>
              <Text style={styles.statLabel}>{language === 'sl' ? 'razdalja' : 'distance'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatDur(durationSeconds)}</Text>
              <Text style={styles.statLabel}>{language === 'sl' ? 'čas' : 'duration'}</Text>
            </View>
          </View>

          {/* footer */}
          <Text style={styles.footer}>{t(language, 'shareRecordedWith')}</Text>
        </View>
      </ViewShot>
    );
  },
);

ShareOverlay.displayName = 'ShareOverlay';

// ── styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    width:            CARD_W,
    height:           CARD_H,
    backgroundColor:  Colors.cardSurface,
    borderRadius:     20,
    alignItems:       'center',
    padding:          24,
  },
  logo: {
    fontSize:    22,
    fontWeight:  '700',
    color:       Colors.brandGreen,
    marginBottom: 8,
  },
  svgWrap: {
    width:  PATH_W,
    height: PATH_H,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginTop:     12,
    gap:           24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize:   18,
    fontWeight: '600',
    color:      Colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color:    Colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width:            1,
    height:           32,
    backgroundColor:  Colors.border,
  },
  footer: {
    fontSize:   11,
    color:      Colors.textMuted,
    marginTop:  'auto',
  },
});
