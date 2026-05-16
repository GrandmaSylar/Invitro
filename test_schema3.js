import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
  const [tRes] = await Promise.all([
    supabase.from('test_parameters').insert([{ test_id: '00000000-0000-0000-0000-000000000000', parameter_id: '00000000-0000-0000-0000-000000000000', sort_order: 1 }]).select()
  ]);

  console.log('Test Parameters Error:', tRes.error?.message || 'None');
}

checkSchema();
