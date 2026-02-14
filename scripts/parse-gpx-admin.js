#!/usr/bin/env node

/**
 * Admin GPX Parser Script (uses service role key to bypass RLS)
 * Parses a GPX file from your computer and updates a route
 *
 * Usage: node scripts/parse-gpx-admin.js <path-to-gpx-file> <route-id>
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
// Use service role key for admin operations (bypasses RLS)
// IMPORTANT: Never hardcode this key - set via environment variable
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  if (!SUPABASE_URL) console.error('   - EXPO_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nSet these in your .env file or environment before running this script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function encodePolyline(coordinates) {
  let encoded = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const coord of coordinates) {
    const lat = Math.round(coord.lat * 1e5);
    const lng = Math.round(coord.lng * 1e5);

    encoded += encodeValue(lat - prevLat);
    encoded += encodeValue(lng - prevLng);

    prevLat = lat;
    prevLng = lng;
  }

  return encoded;
}

function encodeValue(value) {
  let encoded = '';
  let num = value < 0 ? ~(value << 1) : value << 1;

  while (num >= 0x20) {
    encoded += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
    num >>= 5;
  }

  encoded += String.fromCharCode(num + 63);
  return encoded;
}

function parseGPX(gpxData) {
  const trackPoints = [];
  const trkptRegex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>(.*?)<\/trkpt>/gs;
  let match;

  while ((match = trkptRegex.exec(gpxData)) !== null) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    const content = match[3];

    const eleMatch = content.match(/<ele>([^<]+)<\/ele>/);
    const ele = eleMatch ? parseFloat(eleMatch[1]) : undefined;

    trackPoints.push({ lat, lng, ele });
  }

  return trackPoints;
}

async function parseAndUpdateRoute(gpxFilePath, routeId) {
  try {
    console.log(`📥 Reading GPX file: ${gpxFilePath}`);

    if (!fs.existsSync(gpxFilePath)) {
      throw new Error(`File not found: ${gpxFilePath}`);
    }

    const gpxData = fs.readFileSync(gpxFilePath, 'utf8');

    console.log('🔍 Parsing GPX data...');
    const trackPoints = parseGPX(gpxData);

    if (trackPoints.length === 0) {
      throw new Error('No track points found in GPX file');
    }

    console.log(`✅ Found ${trackPoints.length} track points`);

    // Calculate metrics
    let totalDistance = 0;
    for (let i = 1; i < trackPoints.length; i++) {
      totalDistance += calculateDistance(
        trackPoints[i - 1].lat,
        trackPoints[i - 1].lng,
        trackPoints[i].lat,
        trackPoints[i].lng
      );
    }

    let elevationGain = 0;
    for (let i = 1; i < trackPoints.length; i++) {
      const prevEle = trackPoints[i - 1].ele || 0;
      const currEle = trackPoints[i].ele || 0;
      if (currEle > prevEle) {
        elevationGain += (currEle - prevEle);
      }
    }

    const avgSpeedKmh = 13;
    const durationMinutes = Math.round((totalDistance / avgSpeedKmh) * 60);

    const simplifiedCoordinates = trackPoints.filter((_, i) => i % 10 === 0);
    const polyline = encodePolyline(simplifiedCoordinates);

    console.log('\n📊 Parsed Data:');
    console.log(`   Distance: ${totalDistance.toFixed(2)} km`);
    console.log(`   Elevation Gain: ${Math.round(elevationGain)} m`);
    console.log(`   Duration: ${durationMinutes} min`);
    console.log(`   Polyline: ${polyline.substring(0, 50)}... (${polyline.length} chars)`);

    console.log(`\n💾 Updating route ${routeId} (using service role key)...`);
    const { data: updateData, error: updateError } = await supabase
      .from('routes')
      .update({
        distance_km: Math.round(totalDistance * 100) / 100,
        elevation_m: Math.round(elevationGain),
        duration_minutes: durationMinutes,
        polyline: polyline,
      })
      .eq('id', routeId)
      .select();

    if (updateError) {
      throw new Error(`Failed to update route: ${updateError.message}`);
    }

    if (!updateData || updateData.length === 0) {
      throw new Error(`Route not found with ID: ${routeId}`);
    }

    console.log('\n✅ Route updated successfully!');
    console.log('\nUpdated route:');
    console.log(`  Title: ${updateData[0].title}`);
    console.log(`  Distance: ${updateData[0].distance_km} km`);
    console.log(`  Elevation: ${updateData[0].elevation_m} m`);
    console.log(`  Duration: ${updateData[0].duration_minutes} min`);
    console.log(`  Polyline length: ${updateData[0].polyline.length} chars`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node scripts/parse-gpx-admin.js <path-to-gpx-file> <route-id>');
  console.log('Example: node scripts/parse-gpx-admin.js ~/Downloads/route.gpx abc-123');
  process.exit(1);
}

const [gpxFilePath, routeId] = args;
parseAndUpdateRoute(gpxFilePath, routeId);
