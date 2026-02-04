import React, { useMemo } from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface ClimbProfileProps {
  elevationProfile: number[];  // metres ASL for each sample
  width:            number;
  height:           number;
  padding?:         number;
}

/**
 * Elevation-profile silhouette for the Climb Story overlay.
 *
 * - A vertical LinearGradient fills the area under the curve
 *   (green @ 40 %  →  green @ 2 %).
 * - A 2.5 px green line traces the top edge.
 */
export function ClimbProfile({
  elevationProfile,
  width,
  height,
  padding = 16,
}: ClimbProfileProps) {
  const { fillD, lineD } = useMemo(() => {
    if (elevationProfile.length < 2) return { fillD: '', lineD: '' };

    const minElev  = Math.min(...elevationProfile);
    const maxElev  = Math.max(...elevationProfile);
    const elevRange = maxElev - minElev || 1;

    const availW = width  - 2 * padding;
    const availH = height - 2 * padding;
    const stepX  = availW / (elevationProfile.length - 1);

    let line = '';
    let fill = '';

    elevationProfile.forEach((elev, i) => {
      const x = padding + i * stepX;
      const y = padding + availH - ((elev - minElev) / elevRange) * availH;
      const cmd = i === 0 ? 'M' : 'L';
      line += `${cmd} ${x.toFixed(2)} ${y.toFixed(2)} `;
      fill += `${cmd} ${x.toFixed(2)} ${y.toFixed(2)} `;
    });

    // close the fill path along the bottom edge
    const rightX  = (padding + availW).toFixed(2);
    const bottomY = (padding + availH).toFixed(2);
    fill += `L ${rightX} ${bottomY} L ${padding.toFixed(2)} ${bottomY} Z`;

    return { fillD: fill, lineD: line };
  }, [elevationProfile, width, height, padding]);

  if (!fillD) return null;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor="#00BF76" stopOpacity={0.4} />
          <Stop offset="100%" stopColor="#00BF76" stopOpacity={0.02} />
        </LinearGradient>
      </Defs>

      {/* filled area */}
      <Path d={fillD} fill="url(#elevGrad)" />

      {/* top-edge line */}
      <Path
        d={lineD}
        fill="none"
        stroke="#00BF76"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
