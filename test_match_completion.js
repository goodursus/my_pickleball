const http = require('http');

function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/app' + path, // The server is mounted at /app ? No, server.js says app.listen(port).
      // Wait, server.js: app.listen(port). It serves at root.
      // But user memory says "The web application is served at `http://localhost:3000/app`".
      // That memory might refer to the frontend being served at /app or something?
      // Let's check server.js for paths.
      // app.get('/tournaments', ...) -> It is at root.
      // The memory says "The web application is served at .../app... not the root URL (which returns a JSON status)".
      // Let's check root handler in server.js.
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : {} });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (headers) {
      for (const k in headers) req.setHeader(k, headers[k]);
    }
    req.setHeader('Content-Type', 'application/json');
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Adjust request function to not use /app prefix based on my previous tests which worked without it?
// In test_repro_flow.js I used: path: path
// And I called it with "/tournaments".
// So I should use root paths.

async function run() {
  const adminId = "u_admin_001";
  
  // Create 4 players
  const playerIds = [];
  for (let i = 1; i <= 4; i++) {
      const email = `testp${Date.now()}_${i}@example.com`;
      console.log(`Creating player ${i}...`);
      const res = await request("POST", "/auth/signup", {}, {
          fullName: `Test Player ${i}`,
          email: email,
          password: "password"
      });
      if (res.status !== 200 && res.status !== 201) {
          console.error("Failed to create player", res.body);
          return;
      }
      playerIds.push(res.body.id);
  }
  const [p1, p2, p3, p4] = playerIds;

  // 1. Create Tournament
  console.log("Creating tournament...");
  let res = await request("POST", "/tournaments", { "x-user-id": adminId }, {
    name: "Match Completion Test " + Date.now(),
    courtsCount: 1,
    maxParticipants: 4,
    format: "Round Robin",
    type: "Doubles"
  });
  console.log("Create Res:", res.status, res.body);
  const tid = res.body.id;
  console.log("Tournament ID:", tid);

  // 2. Join Players
  console.log("Joining players...");
  await request("POST", `/tournaments/${tid}/join`, { "x-user-id": p1 }, {});
  await request("POST", `/tournaments/${tid}/join`, { "x-user-id": p2 }, {});
  await request("POST", `/tournaments/${tid}/join`, { "x-user-id": p3 }, {});
  await request("POST", `/tournaments/${tid}/join`, { "x-user-id": p4 }, {});

  // 3. Start Tournament
  console.log("Starting tournament...");
  await request("POST", `/tournaments/${tid}/start`, { "x-user-id": adminId });

  // 4. Generate Round
  console.log("Generating round...");
  await request("POST", `/tournaments/${tid}/rounds/next`, { "x-user-id": adminId });

  // 5. Get Matches
  console.log("Getting matches...");
  res = await request("GET", `/tournaments/${tid}/matches`);
  const matches = res.body;
  console.log("Matches found:", matches.length);
  const m1 = matches[0];
  console.log("Match 1 ID:", m1.id, "Status:", m1.status);

  // 6. Update Score (Partial)
  console.log("Updating score 1...");
  await request("PATCH", `/matches/${m1.id}`, { "x-user-id": adminId }, { score1: 11 });
  
  res = await request("GET", `/tournaments/${tid}/matches`);
  let m1_updated = res.body.find(m => m.id === m1.id);
  console.log("Match 1 Status (Partial):", m1_updated.status, "Score1:", m1_updated.score1, "Score2:", m1_updated.score2);

  // 7. Update Score (Complete)
  console.log("Updating score 2...");
  await request("PATCH", `/matches/${m1.id}`, { "x-user-id": adminId }, { score2: 5 });

  res = await request("GET", `/tournaments/${tid}/matches`);
  m1_updated = res.body.find(m => m.id === m1.id);
  console.log("Match 1 Status (Complete):", m1_updated.status, "Score1:", m1_updated.score1, "Score2:", m1_updated.score2);

  if (m1_updated.status === "completed") {
      console.log("SUCCESS: Match status is completed.");
  } else {
      console.error("FAILURE: Match status is NOT completed.");
  }

  // 8. Finish Round (Simulate organizer clicking Finish Round)
  console.log("Finishing round...");
  await request("POST", `/tournaments/${tid}/round/finish`, { "x-user-id": adminId });

  // 9. Verify Matches again (ensure status didn't revert)
  res = await request("GET", `/tournaments/${tid}/matches`);
  m1_updated = res.body.find(m => m.id === m1.id);
  console.log("Match 1 Status after Finish Round:", m1_updated.status);

}

function request(method, path, headers = {}, body = null) {
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

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

run();
