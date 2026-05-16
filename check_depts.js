import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkDepts() {
  const { data, error } = await supabase.from('departments').select('*').limit(1);
  console.log('Error:', error?.message);
  console.log('Data:', data);
}

checkDepts();
