const { DataSource } = require('typeorm');
require('dotenv').config({ path: './.env' });

const options = {
    type: 'mssql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '1433'),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        cryptoCredentialsDetails: { rejectUnauthorized: false }
    }
};

const ds = new DataSource(options);
ds.initialize().then(async () => {
    const users = await ds.query("SELECT * FROM dbo.Users");
    console.log('--- USERS IN DB ---');
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
}).catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
});
