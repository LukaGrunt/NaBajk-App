/**
 * GradientProfile — colour-coded SVG elevation/gradient chart.
 * Used in route detail (showLabels=true) and share card (showLabels=false).
 *
 * Colour scale by segment gradient % (Garmin standard 5-band):
 *  <3%   →  #00BF76  (green)
 *  3–6%  →  #AAEE00  (lime)
 *  6–9%  →  #FF9900  (orange)
 *  9–12% →  #FF4400  (red)
 *  >12%  →  #CC0000  (dark red)
 */

import React from 'react';
import { View } from 'react-native';
import Svg, { Rect, Line, Polyline, Text as SvgText } from 'react-native-svg';

interface Props {
  elevationProfile: number[];  // numBars+1 elevation values
  distanceKm: number;
  width: number;
  height: number;
  showLabels?: boolean;
  showBarLabels?: boolean;
}

function gradientColor(pct: number): string {
  if (pct < 3)  return '#00BF76'; // green   (<3%)
  if (pct < 6)  return '#AAEE00'; // lime    (3–6%)
  if (pct < 9)  return '#FF9900'; // orange  (6–9%)
  if (pct < 12) return '#FF4400'; // red     (9–12%)
  return '#CC0000';               // dark red (>12%)
}

export function GradientProfile({
  elevationProfile,
  distanceKm,
  width,
  height,
  showLabels = true,
  showBarLabels = false,
}: Props) {
  const profile = elevationProfile;
  if (!profile || profile.length < 2) return <View style={{ width, height }} />;

  const numBars = profile.length - 1;
  const segmentKm = distanceKm / numBars;

  const padL = showLabels ? 40 : 4;
  const padR = 4;
  const padT = 6;
  const padB = showLabels ? 28 : 4;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const minElev = Math.min(...profile);
  const maxElev = Math.max(...profile);
  const elevRange = maxElev - minElev || 1;

  const barW = chartW / numBars;

  // Compute segment gradients
  const grads: number[] = [];
  for (let i = 0; i < numBars; i++) {
    const rise = profile[i + 1] - profile[i];
    const run = segmentKm * 1000; // metres
    grads.push((rise / run) * 100);
  }

  // Y coordinate for an elevation value
  function elevY(elev: number): number {
    return padT + chartH - ((elev - minElev) / elevRange) * chartH;
  }

  // Build silhouette polyline points
  const silhouette = profile.map((elev, i) => {
    const x = padL + (i / numBars) * chartW;
    const y = elevY(elev);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  // Horizontal grid lines (3 lines)
  const gridLines = [0.25, 0.5, 0.75].map(frac => ({
    y: padT + chartH * frac,
    elev: Math.round(maxElev - frac * elevRange),
  }));

  return (
    <View style={{ width, height, backgroundColor: '#0A0A0B', borderRadius: showLabels ? 0 : 8, overflow: 'hidden' }}>
      <Svg width={width} height={height}>

        {/* Grid lines */}
        {gridLines.map((g, i) => (
          <Line
            key={i}
            x1={padL}
            y1={g.y}
            x2={padL + chartW}
            y2={g.y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />
        ))}

        {/* Bars — one per segment */}
        {grads.map((grad, i) => {
          const x = padL + i * barW;
          const barH = Math.max(2, ((Math.max(profile[i], profile[i + 1]) - minElev) / elevRange) * chartH);
          const y = padT + chartH - barH;
          const color = gradientColor(Math.abs(grad));
          return (
            <Rect
              key={i}
              x={x}
              y={y}
              width={barW - 0.5}
              height={barH}
              fill={color}
              opacity={0.55}
            />
          );
        })}

        {/* Silhouette glow (wide faint) */}
        <Polyline
          points={silhouette}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Silhouette crisp line */}
        <Polyline
          points={silhouette}
          fill="none"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Labels */}
        {showLabels && (
          <>
            {/* Y-axis elevation labels */}
            {gridLines.map((g, i) => (
              <SvgText
                key={i}
                x={padL - 4}
                y={g.y + 4}
                fontSize={9}
                fill="rgba(255,255,255,0.4)"
                textAnchor="end"
              >
                {g.elev}
              </SvgText>
            ))}

            {/* X-axis distance labels — every other bar if > 12 */}
            {Array.from({ length: numBars + 1 }).map((_, i) => {
              if (numBars > 12 && i % 2 !== 0) return null;
              const x = padL + (i / numBars) * chartW;
              const dist = (i * segmentKm).toFixed(i === 0 ? 0 : 0);
              return (
                <SvgText
                  key={i}
                  x={x}
                  y={height - 4}
                  fontSize={9}
                  fill="rgba(255,255,255,0.4)"
                  textAnchor="middle"
                >
                  {dist}
                </SvgText>
              );
            })}

          </>
        )}


      </Svg>
    </View>
  );
}
