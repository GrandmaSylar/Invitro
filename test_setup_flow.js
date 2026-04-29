async function triggerSetup() {
    const config = {
        name: "Test Config " + Date.now(),
        dbType: "sqlserver",
        host: "127.0.0.1",
        port: 1433,
        dbName: "BlooDB",
        username: "sa",
        password: "Password@123!",
        ssl: false
    };

    try {
        console.log('--- Step 1: Provision ---');
        const provRes = await fetch('http://localhost:4000/api/setup/provision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
        });
        console.log('Provision Status:', provRes.status);
        const provData = await provRes.json();
        console.log(provData);

        if (provRes.status !== 200) return;

        console.log('--- Step 2: Create Admin ---');
        const adminRes = await fetch('http://localhost:4000/api/setup/admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: 'Full Admin ' + Date.now(),
                email: 'fulladmin' + Date.now() + '@bloo.local',
                username: 'fulladmin' + Date.now(),
                password: 'Password@123'
            }),
        });
        console.log('Admin Status:', adminRes.status);
        const adminData = await adminRes.json();
        console.log(adminData);

    } catch (err) {
        console.error('Test error:', err.message);
    }
}

triggerSetup();
