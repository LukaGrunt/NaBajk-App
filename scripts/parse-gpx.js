#!/usr/bin/env node

/**
 * GPX Parser Script
 * Parses a GPX file from Supabase Storage and updates a route
 *
 * Usage: node scripts/parse-gpx.js <gpx-filename> <route-id>
 * Example: node scripts/parse-gpx.js Test_for_app.gpx <route-uuid>
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase config
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zymssfxffkymkkfndssf.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5bXNzZnhmZmt5bWtrZm5kc3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3Njk2OTMsImV4cCI6MjA4NTM0NTY5M30.2TH7S-Zlq0WmxZP-NG_ViYSuvaFu-CxA2Vrtqm676yI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Haversine distance formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Google Polyline encoding
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

// Simple XML parser (using regex - good enough for GPX)
function parseGPX(gpxData) {
  const trackPoints = [];

  // Match all <trkpt> elements
  const trkptRegex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>(.*?)<\/trkpt>/gs;
  let match;

  while ((match = trkptRegex.exec(gpxData)) !== null) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    const content = match[3];

    // Try to extract elevation
    const eleMatch = content.match(/<ele>([^<]+)<\/ele>/);
    const ele = eleMatch ? parseFloat(eleMatch[1]) : undefined;

    trackPoints.push({ lat, lng, ele });
  }

  return trackPoints;
}

async function parseAndUpdateRoute(gpxFilename, routeId) {
  try {
    console.log(`📥 Downloading GPX file: ${gpxFilename}`);

    // Download GPX file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('gpx-files')
      .download(gpxFilename);

    if (downloadError) {
      throw new Error(`Failed to download GPX: ${downloadError.message}`);
    }

    // Convert blob to text
    const gpxData = await fileData.text();

    console.log('🔍 Parsing GPX data...');
    const trackPoints = parseGPX(gpxData);

    if (trackPoints.length === 0) {
      throw new Error('No track points found in GPX file');
    }

    console.log(`✅ Found ${trackPoints.length} track points`);

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 1; i < trackPoints.length; i++) {
      totalDistance += calculateDistance(
        trackPoints[i - 1].lat,
        trackPoints[i - 1].lng,
        trackPoints[i].lat,
        trackPoints[i].lng
      );
    }

    // Calculate elevation gain
    let elevationGain = 0;
    for (let i = 1; i < trackPoints.length; i++) {
      const prevEle = trackPoints[i - 1].ele || 0;
      const currEle = trackPoints[i].ele || 0;
      if (currEle > prevEle) {
        elevationGain += (currEle - prevEle);
      }
    }

    // Estimate duration (13 km/h average)
    const avgSpeedKmh = 13;
    const durationMinutes = Math.round((totalDistance / avgSpeedKmh) * 60);

    // Simplify coordinates (keep every 10th point)
    const simplifiedCoordinates = trackPoints.filter((_, i) => i % 10 === 0);
    const polyline = encodePolyline(simplifiedCoordinates);

    console.log('\n📊 Parsed Data:');
    console.log(`   Distance: ${totalDistance.toFixed(2)} km`);
    console.log(`   Elevation Gain: ${Math.round(elevationGain)} m`);
    console.log(`   Duration: ${durationMinutes} min`);
    console.log(`   Polyline: ${polyline.substring(0, 50)}... (${polyline.length} chars)`);

    // Update route in database
    console.log(`\n💾 Updating route ${routeId}...`);
    const { data: updateData, error: updateError } = await supabase
      .from('routes')
      .update({
        distance_km: Math.round(totalDistance * 100) / 100,
        elevation_m: Math.round(elevationGain),
        duration_minutes: durationMinutes,
        polyline: polyline,
        gpx_file_url: `gpx-files/${gpxFilename}`,
      })
      .eq('id', routeId)
      .select();

    if (updateError) {
      throw new Error(`Failed to update route: ${updateError.message}`);
    }

    console.log('\n✅ Route updated successfully!');
    console.log(updateData[0]);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node scripts/parse-gpx.js <gpx-filename> <route-id>');
  console.log('Example: node scripts/parse-gpx.js Test_for_app.gpx abc-123-def');
  process.exit(1);
}

const [gpxFilename, routeId] = args;
parseAndUpdateRoute(gpxFilename, routeId);
