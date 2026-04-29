const fetch = require('node-fetch');

async function testAdminCreation() {
    try {
        const res = await fetch('http://localhost:4000/api/setup/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: 'Test Admin',
                email: 'test@bloo.local',
                username: 'testadmin',
                password: 'Password@123'
            }),
        });
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', data);
    } catch (err) {
        console.error('Fetch error:', err.message);
    }
}

testAdminCreation();
