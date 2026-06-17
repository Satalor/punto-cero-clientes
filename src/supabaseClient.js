import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://veoitekpjztzkskpslgz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BLXy6axf-kgElMupwAPUBA_oNfJdkzI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
