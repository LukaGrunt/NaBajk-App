#!/usr/bin/env node

/**
 * Kralj vzponov — checkpoint extractor (admin, uses service role key)
 *
 * For every climb (is_climb = true) with stored gpx_data, derives 5 detection
 * checkpoints along the track (start, 25%, 50%, 75%, summit) and writes them
 * to routes.climb_checkpoints. Run supabase-setup/05-climb-king.sql first.
 *
 * Usage:
 *   node scripts/extract-climb-checkpoints.js            # update all climbs
 *   node scripts/extract-climb-checkpoints.js --dry-run  # print, don't write
 */

const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  if (!SUPABASE_URL) console.error('   - EXPO_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nSet these in your .env file or environment before running this script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const dryRun = process.argv.includes('--dry-run');

// Fractions of total climb distance where checkpoints are placed.
const CHECKPOINT_FRACTIONS = [0, 0.25, 0.5, 0.75, 1];

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseTrackPoints(gpxData) {
  const points = [];
  const trkptRegex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>?/gs;
  let match;
  while ((match = trkptRegex.exec(gpxData)) !== null) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng)) points.push({ lat, lng });
  }
  return points;
}

function deriveCheckpoints(points) {
  if (points.length < 2) return null;

  const cumDist = [0];
  for (let i = 1; i < points.length; i++) {
    cumDist.push(cumDist[i - 1] + haversineMeters(
      points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng,
    ));
  }
  const total = cumDist[cumDist.length - 1];
  if (total < 200) return null; // too short to place meaningful checkpoints

  const checkpoints = CHECKPOINT_FRACTIONS.map(frac => {
    const target = frac * total;
    let bestIdx = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < points.length; i++) {
      const diff = Math.abs(cumDist[i] - target);
      if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
    }
    const p = points[bestIdx];
    return { lat: parseFloat(p.lat.toFixed(6)), lng: parseFloat(p.lng.toFixed(6)) };
  });

  // Drop accidental duplicates (very short climbs)
  const unique = checkpoints.filter((cp, i) =>
    i === 0 || cp.lat !== checkpoints[i - 1].lat || cp.lng !== checkpoints[i - 1].lng);
  return unique.length >= 2 ? unique : null;
}

async function main() {
  console.log(`🏔  Extracting climb checkpoints${dryRun ? ' (dry run)' : ''}...\n`);

  const { data: climbs, error } = await supabase
    .from('routes')
    .select('id, title, gpx_data, climb_checkpoints')
    .eq('is_climb', true);

  if (error) {
    console.error('❌ Failed to fetch climbs:', error.message);
    process.exit(1);
  }
  if (!climbs || climbs.length === 0) {
    console.log('No climbs (is_climb = true) found.');
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const climb of climbs) {
    if (!climb.gpx_data) {
      console.log(`⏭  ${climb.title} — no gpx_data, skipped`);
      skipped++;
      continue;
    }

    const points = parseTrackPoints(climb.gpx_data);
    const checkpoints = deriveCheckpoints(points);
    if (!checkpoints) {
      console.log(`⏭  ${climb.title} — track too short/invalid (${points.length} pts), skipped`);
      skipped++;
      continue;
    }

    console.log(`✅ ${climb.title} — ${points.length} pts → ${checkpoints.length} checkpoints`);
    checkpoints.forEach((cp, i) => console.log(`     ${i === 0 ? 'start ' : i === checkpoints.length - 1 ? 'summit' : `  ${i}   `}  ${cp.lat}, ${cp.lng}`));

    if (!dryRun) {
      const { error: updateError } = await supabase
        .from('routes')
        .update({ climb_checkpoints: checkpoints })
        .eq('id', climb.id);
      if (updateError) {
        console.error(`   ❌ update failed: ${updateError.message}`);
        skipped++;
        continue;
      }
    }
    updated++;
  }

  console.log(`\nDone. ${updated} climb(s) ${dryRun ? 'would be ' : ''}updated, ${skipped} skipped.`);
}

main();
