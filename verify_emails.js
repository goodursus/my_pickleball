const http = require('http');

function request(method, path, body, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function run() {
    try {
        console.log("1. Registering new user...");
        const user = await request('POST', '/auth/signup', {
            email: `newuser_${Date.now()}@test.com`,
            password: "Password123!",
            fullName: "New User Test",
            role: "Player"
        });
        console.log("User registered:", user.id);

        console.log("2. Creating tournament (Admin)...");
        // Need admin ID. Assuming u_admin_001 exists from default data.
        const tournament = await request('POST', '/tournaments', {
            name: `Email Test Tournament ${Date.now()}`,
            startDate: "2026-05-01T09:00:00Z",
            endDate: "2026-05-01T18:00:00Z",
            courtsCount: 2
        }, { 'x-user-id': 'u_admin_001' });
        console.log("Tournament created:", tournament.id);

        console.log("3. Joining tournament...");
        const entry = await request('POST', `/tournaments/${tournament.id}/join`, {}, { 'x-user-id': user.id });
        console.log("Joined tournament:", entry.status);

    } catch (err) {
        console.error("Error:", err);
    }
}

run();
