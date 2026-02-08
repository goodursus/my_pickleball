
const http = require('http');

const TOURNAMENT_NAME = "Test Tournament (Pairs) 25-01-26";
const API_URL = "http://localhost:3000";

function fetchJson(path, options = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request(API_URL + path, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });
        req.on('error', reject);
        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

async function run() {
    try {
        // 1. Find Tournament
        console.log("Finding tournament...");
        const { data: tournaments } = await fetchJson("/tournaments");
        const tournament = tournaments.find(t => t.name === TOURNAMENT_NAME);
        
        if (!tournament) {
            console.error(`Tournament "${TOURNAMENT_NAME}" not found!`);
            console.log("Available tournaments:", tournaments.map(t => t.name));
            return;
        }
        console.log(`Found tournament: ${tournament.name} (${tournament.id})`);

        // 2. Get Users
        console.log("Fetching users...");
        const { data: users } = await fetchJson("/users");
        console.log(`Found ${users.length} users.`);

        // 3. Register 10 Users
        let registeredCount = 0;
        for (const user of users) {
            if (registeredCount >= 10) break;
            
            // Skip if user is the creator (optional, but good for testing player perspective)
            // But usually the organizer can also play. I'll just register them.
            
            console.log(`Registering ${user.fullName} (${user.id})...`);
            
            const result = await fetchJson(`/tournaments/${tournament.id}/join`, {
                method: 'POST',
                headers: {
                    'x-user-id': user.id,
                    'Content-Type': 'application/json'
                }
            });

            if (result.status === 201) {
                console.log(`✅ Success`);
                registeredCount++;
            } else if (result.status === 400 && result.data.error === "User already joined this tournament") {
                console.log(`⚠️ Already joined`);
                registeredCount++; // Count them as part of our 10 target if they are already there
            } else {
                console.log(`❌ Failed: ${JSON.stringify(result.data)}`);
            }
        }
        
        console.log(`Done. ${registeredCount} players registered.`);

    } catch (err) {
        console.error("Error:", err);
    }
}

run();
