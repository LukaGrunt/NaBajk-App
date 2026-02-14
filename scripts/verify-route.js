#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zymssfxffkymkkfndssf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5bXNzZnhmZmt5bWtrZm5kc3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3Njk2OTMsImV4cCI6MjA4NTM0NTY5M30.2TH7S-Zlq0WmxZP-NG_ViYSuvaFu-CxA2Vrtqm676yI'
);

async function verifyRoute() {
  const routeId = '874bb03d-e107-41c8-b2fb-d1f7a017f68e';

  const { data, error } = await supabase
    .from('routes')
    .select('*')
    .eq('id', routeId)
    .single();

  if (error) {
    console.error('❌ Error fetching route:', error);
    return;
  }

  console.log('\n✅ Route Data from Database:\n');
  console.log(`Title: ${data.title}`);
  console.log(`Distance: ${data.distance_km} km`);
  console.log(`Elevation: ${data.elevation_m} m`);
  console.log(`Duration: ${data.duration_minutes} min`);
  console.log(`Polyline: ${data.polyline ? data.polyline.substring(0, 50) + '...' : 'MISSING!'}`);
  console.log(`Polyline length: ${data.polyline ? data.polyline.length : 0} chars`);
  console.log(`\nFull route object:`);
  console.log(JSON.stringify(data, null, 2));
}

verifyRoute().then(() => process.exit(0));
