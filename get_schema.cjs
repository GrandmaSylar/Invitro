const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:54322/postgres' });
client.connect().then(() => {
  return client.query(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name IN ('tests', 'parameters')
  `);
}).then(res => {
  console.log(res.rows);
  client.end();
}).catch(console.error);
