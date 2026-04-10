const { DataSource } = require('typeorm');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './.env' });
const { UserEntity } = require('./dist/entities/User');

const options = {
    type: 'mssql',
    host: '127.0.0.1',
    port: 1433,
    username: 'sa',
    password: 'Password@123!',
    database: 'BlooDB',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        cryptoCredentialsDetails: { rejectUnauthorized: false }
    },
    entities: [UserEntity]
};

const ds = new DataSource(options);
ds.initialize().then(async () => {
    const repo = ds.getRepository(UserEntity);
    const user = new UserEntity();
    user.id = 'usr_test_' + Date.now();
    user.fullName = 'Test User';
    user.email = 'test' + Date.now() + '@bloo.local';
    user.username = 'testuser' + Date.now();
    user.roleId = 'developer';
    user.status = 'active';
    user.setPassword('Password@123');
    
    await repo.save(user);
    console.log('User saved successfully');
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
