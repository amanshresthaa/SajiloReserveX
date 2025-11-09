import 'dotenv/config';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env.local');
loadEnv({ path: envPath, override: false });

import { getServiceSupabaseClient } from '@/server/supabase';

async function main() {
  const client = getServiceSupabaseClient();
  const { data, error } = await client
    .from('restaurants')
    .select('id, slug, name')
    .limit(5);
  if (error) {
    console.error('error', error);
    process.exit(1);
  }
  console.log('restaurants', data);
}

main();
