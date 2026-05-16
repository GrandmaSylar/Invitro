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
  
  const paramPayload = {
    parameter_name: 'Param',
    units: 'mg',
    reference_range: 'Range',
    parameter_order_id: 1,
    trimester_type: 'Trimester'
  };

  const [tRes, pRes] = await Promise.all([
    supabase.from('tests').insert([testPayload]).select(),
    supabase.from('parameters').insert([paramPayload]).select()
  ]);

  console.log('Tests Error:', tRes.error?.message || 'None');
  console.log('Params Error:', pRes.error?.message || 'None');
  
  // Cleanup if they actually succeeded
  if (tRes.data?.[0]?.id) await supabase.from('tests').delete().eq('id', tRes.data[0].id);
  if (pRes.data?.[0]?.id) await supabase.from('parameters').delete().eq('id', pRes.data[0].id);
}

checkSchema();
