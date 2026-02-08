const http = require('http');

const PORT = 3000;
const adminId = "u_admin_001";
const playerIds = ["u_player_001", "u_player_002", "u_player_003", "u_player_004"];

function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/app' + path, // The api is mounted at /app/...? No, server.js says app.use(express.static) and api routes are root relative to server?
      // Wait, let's check server.js routes. They are defined as app.get('/tournaments', ...). 
      // But usually local dev is http://localhost:3000/tournaments
      // My previous tests used just /tournaments.
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
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  try {
    console.log("--- TEST: REOPEN FLOW ---");

    // 1. Create Tournament with 1 round
    console.log("1. Creating tournament...");
    const t1Res = await request("POST", "/tournaments", { "x-user-id": adminId }, {
      name: "Reopen Test",
      courtsCount: 1,
      maxParticipants: 4,
      format: "Round Robin",
      type: "Doubles",
      roundsCount: 1 // Important for completion
    });
    
    if (t1Res.status !== 201) {
        console.error("Failed to create tournament", t1Res.body);
        return;
    }
    const t1 = t1Res.body;
    console.log("Created T1:", t1.id, "Rounds:", t1.roundsCount);

    // 2. Join players
    console.log("2. Joining players...");
    for (const pid of playerIds) {
        await request("POST", `/tournaments/${t1.id}/join`, { "x-user-id": pid }, {});
    }
    
    // 3. Start Tournament
    console.log("3. Starting tournament...");
    await request("POST", `/tournaments/${t1.id}/start`, { "x-user-id": adminId });
    
    // 4. Generate Round 1
    console.log("4. Generating round 1...");
    const genRes = await request("POST", `/tournaments/${t1.id}/rounds/next`, { "x-user-id": adminId });
    console.log("Generate Round Response:", genRes.status, JSON.stringify(genRes.body));
    
    // Fetch matches
    const matchesRes = await request("GET", `/tournaments/${t1.id}/matches`, { "x-user-id": adminId });
    const matches = matchesRes.body;
    console.log("Fetched matches:", matches.length);

    // 5. Complete matches to trigger Tournament Completion
    console.log("5. Completing matches...");
    for (const m of matches) {
        // Update score
        const updateRes = await request("PATCH", `/matches/${m.id}`, { "x-user-id": adminId }, {
            score1: 11,
            score2: 9
        });
        // Check if tournament status changed?
        // The backend logic checks completion on every match update.
    }

    // 6. Check Tournament Status
    console.log("6. Checking status...");
    const t1After = (await request("GET", "/tournaments", { "x-user-id": adminId })).body.find(t => t.id === t1.id);
    console.log("Status after matches:", t1After.status); 
    // Expect "Completed" if logic works.

    if (t1After.status === "Completed") {
        console.log("Tournament Completed successfully.");
        
        // 7. Reopen Tournament
        console.log("7. Reopening tournament...");
        const reopenRes = await request("PATCH", `/tournaments/${t1.id}`, { "x-user-id": adminId }, {
            status: "Open"
        });
        
        console.log("Reopen response:", reopenRes.status, reopenRes.body.status);
        
        if (reopenRes.body.status === "Open") {
            console.log("SUCCESS: Tournament reopened.");
        } else {
            console.error("FAILURE: Tournament not reopened.");
        }

    } else {
        console.error("FAILURE: Tournament did not complete automatically.");
        // Maybe need to call finish round?
        // Backend logic: "if (allCompleted) ... if (currentRound >= roundsCount) status = Completed"
    }

  } catch (e) {
    console.error(e);
  }
}

run();
