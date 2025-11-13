import { getServiceSupabaseClient } from '@/server/supabase';

async function main() {
  const supabase = getServiceSupabaseClient();
  const enable = await supabase.rpc('set_hold_conflict_enforcement', { enabled: true });
  console.log('set result', enable.data, enable.error);
  const verify = await supabase.rpc('is_holds_strict_conflicts_enabled');
  console.log('verify', verify.data, verify.error);
}

main();
