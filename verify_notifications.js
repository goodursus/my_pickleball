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
        console.log("=== 1. Registering new user ===");
        const user = await request('POST', '/auth/signup', {
            email: `notify_user_${Date.now()}@test.com`,
            password: "Password123!",
            fullName: "Notification Tester",
            role: "Player",
            preferredNotificationChannel: "Email"
        });
        console.log("User registered:", user.id);

        console.log("\n=== 2. Creating tournament (Admin) ===");
        // Should trigger Invitation to all users (including our new user)
        const tournament = await request('POST', '/tournaments', {
            name: `Notification Test Tournament ${Date.now()}`,
            startDate: "2026-06-01T09:00:00Z",
            endDate: "2026-06-01T18:00:00Z",
            courtsCount: 2
        }, { 'x-user-id': 'u_admin_001' }); // Assuming u_admin_001 exists
        console.log("Tournament created:", tournament.id);

        console.log("\n=== 3. Joining tournament ===");
        // Should trigger Registration Confirmation
        const entry = await request('POST', `/tournaments/${tournament.id}/join`, {}, { 'x-user-id': user.id });
        console.log("Joined tournament:", entry.status);

        console.log("\n=== 4. Starting tournament ===");
        // Should trigger Status Update (Started)
        const started = await request('POST', `/tournaments/${tournament.id}/start`, {}, { 'x-user-id': 'u_admin_001' });
        console.log("Tournament status:", started.status);

        console.log("\n=== 5. Finishing tournament ===");
        // Should trigger Results email
        const finished = await request('POST', `/tournaments/${tournament.id}/finish`, {}, { 'x-user-id': 'u_admin_001' });
        console.log("Tournament status:", finished.status);

        console.log("\n=== 6. Resetting tournament ===");
        // Should trigger Reset email
        const reset = await request('POST', `/tournaments/${tournament.id}/reset`, {}, { 'x-user-id': 'u_admin_001' });
        console.log("Reset message:", reset.message);

    } catch (err) {
        console.error("Error:", err);
    }
}

run();