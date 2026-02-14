#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://zymssfxffkymkkfndssf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5bXNzZnhmZmt5bWtrZm5kc3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3Njk2OTMsImV4cCI6MjA4NTM0NTY5M30.2TH7S-Zlq0WmxZP-NG_ViYSuvaFu-CxA2Vrtqm676yI'
);

async function getRoutes() {
  const { data, error } = await supabase
    .from('routes')
    .select('id, title')
    .order('title');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n🚴 Available Routes:\n');
  data.forEach((route, i) => {
    console.log(`${i + 1}. ${route.title}`);
    console.log(`   ID: ${route.id}\n`);
  });
}

getRoutes().then(() => process.exit(0));
