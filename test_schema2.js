import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
  const testPayload = {
    test_name: 'Test',
    department: 'Dept',
    test_cost: 10,
    result_header: 'Header',
    reference_range: 'Range',
    include_comprehensive: true
  };
  
  const [tRes] = await Promise.all([
    supabase.from('tests').insert([testPayload]).select()
  ]);

  console.log('Tests Error:', tRes.error?.message || 'None');
}

checkSchema();
