import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/?apikey=${process.env.VITE_SUPABASE_ANON_KEY}`)
  .then(res => res.json())
  .then(data => {
    console.log(Object.keys(data.definitions));
    const t = data.definitions.tests?.properties;
    const p = data.definitions.parameters?.properties;
    if (t) console.log('tests table fields in DB:', Object.keys(t));
    if (p) console.log('parameters table fields in DB:', Object.keys(p));
  })
  .catch(console.error);
