const http = require('http');

const API_URL = "http://localhost:3000";
const TEST_EMAIL = "veteranpickle@gmail.com"; // User's email for verification

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
        console.log("--- Starting Full Email Flow Verification ---");

        // 1. Create a User with Email Preference
        console.log("\n1. Creating User with Email preference...");
        const user = await request('POST', '/auth/signup', {
            email: `test_player_${Date.now()}@test.com`, // Use a unique fake email for login
            // But wait, the email service sends to THIS email.
            // If I want the user to receive it at veteranpickle@gmail.com, I must use that email.
            // But I can't register multiple users with the same email if unique constraint exists.
            // server.js checks: if (users.find((u) => u.email === email)) ...
            
            // Hack: I will use a unique email for signup, but then PATCH the user to have the REAL email?
            // Or just manually modify the user object in memory if I could? No.
            // Or I can just trust the logs.
            // The user previously verified 'test_email.js' worked.
            // Here I want to verify the LOGIC triggers the send.
            // I'll use a dummy email `verify_flow_${Date.now()}@example.com` and check the SERVER LOGS.
            // The server logs (from emailService.js) will show "Sending email to ..." and the content.
            // Since I removed jsonTransport, it will try to send to example.com and might fail or be rejected by Gmail.
            // Gmail might reject sending to non-existent addresses or example.com.
            
            // To be safe and avoid blocking, I should use the REAL email if possible.
            // I'll try to use a "plus" address or similar if the system allows, or just use a random one and expect an error in logs but confirm the ATTEMPT.
            // Wait, if it fails, the catch block logs "Failed to send...".
            // That confirms the attempt was made.
            
            email: `verify_${Date.now()}@example.com`, 
            password: "Password123!",
            fullName: "Email Flow Tester",
            role: "Player",
            preferredNotificationChannel: "Email"
        });
        
        if (user.error) {
            console.error("Failed to create user:", user.error);
            return;
        }
        console.log(`User created: ${user.id} (${user.email})`);

        // 2. Create Tournament (Should trigger Invite)
        console.log("\n2. Creating Tournament (triggers Invite)...");
        // Need admin. Assuming u_admin_001.
        const tournament = await request('POST', '/tournaments', {
            name: `Email Flow Test ${Date.now()}`,
            startDate: "2026-06-01T09:00:00Z",
            endDate: "2026-06-01T18:00:00Z",
            courtsCount: 1,
            format: "Round Robin"
        }, { 'x-user-id': 'u_admin_001' });
        
        console.log(`Tournament created: ${tournament.id}`);
        console.log("CHECK SERVER LOGS for 'Invitation' email attempt.");

        // 3. Join Tournament (triggers Registration Confirmation)
        console.log("\n3. Joining Tournament (triggers Confirmation)...");
        const entry = await request('POST', `/tournaments/${tournament.id}/join`, {}, { 'x-user-id': user.id });
        console.log(`Joined status: ${entry.status}`);
        console.log("CHECK SERVER LOGS for 'Registration Confirmation' email attempt.");

        // 4. Leave Tournament (triggers Withdrawal Confirmation)
        console.log("\n4. Leaving Tournament (triggers Withdrawal)...");
        const leaveRes = await request('POST', `/tournaments/${tournament.id}/leave`, {}, { 'x-user-id': user.id });
        console.log("Left tournament:", leaveRes);
        console.log("CHECK SERVER LOGS for 'Withdrawal Confirmation' email attempt.");
        
        console.log("\n--- Verification Complete ---");
        console.log("If you see email attempts in the server console for the user above, the logic is working.");

    } catch (err) {
        console.error("Error:", err);
    }
}

run();
