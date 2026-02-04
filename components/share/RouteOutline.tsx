import React, { useMemo } from 'react';
import Svg, { Path } from 'react-native-svg';
import { decodePolyline, coordinatesToSVGPath } from '@/utils/polyline';

interface RouteOutlineProps {
  polyline:     string;
  width:        number;
  height:       number;
  strokeColor?: string;
  strokeWidth?: number;
  padding?:     number;
}

/**
 * Renders an SVG route outline from a Google-encoded polyline.
 * Two-layer rendering: a faint glow (4× width, 12 % opacity) underneath
 * the crisp main stroke.
 */
export function RouteOutline({
  polyline,
  width,
  height,
  strokeColor = '#00BF76',
  strokeWidth = 3.5,
  padding     = 24,
}: RouteOutlineProps) {
  const pathD = useMemo(() => {
    if (!polyline) return '';
    const coords = decodePolyline(polyline);
    if (coords.length < 2) return '';
    return coordinatesToSVGPath(coords, width, height, padding);
  }, [polyline, width, height, padding]);

  if (!pathD) return null;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* glow */}
      <Path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth * 4}
        strokeOpacity={0.12}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* main stroke */}
      <Path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
