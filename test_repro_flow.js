
const http = require('http');

function request(method, path, headers, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const adminId = "u_admin_001";
const playerIds = ["u_player_001", "u_player_002", "u_player_003", "u_player_004"];

async function run() {
  try {
    console.log("--- TEST: MANUAL JOIN FLOW ---");
    // 1. Create Tournament
    const t1Res = await request("POST", "/tournaments", { "x-user-id": adminId }, {
      name: "Manual Join Test Flow",
      courtsCount: 1,
      maxParticipants: 4,
      format: "Round Robin",
      type: "Doubles"
    });
    const t1 = t1Res.body;
    console.log("Created T1:", t1.id);

    // 2. Players Join
    for (const pid of playerIds) {
        await request("POST", `/tournaments/${t1.id}/join`, { "x-user-id": pid }, {});
    }
    console.log("Joined 4 players");

    // 3. Start Tournament
    const startRes = await request("POST", `/tournaments/${t1.id}/start`, { "x-user-id": adminId });
    console.log("Start T1 status:", startRes.status, startRes.body.status);

    // 4. Generate Round
    // Frontend calls: /tournaments/:id/rounds/next
    const genRes = await request("POST", `/tournaments/${t1.id}/rounds/next`, { "x-user-id": adminId });
    console.log("Generate Round T1:", genRes.status, genRes.body);

    
    console.log("\n--- TEST: RANDOM FILL FLOW ---");
    // 1. Create Tournament
    const t2Res = await request("POST", "/tournaments", { "x-user-id": adminId }, {
      name: "Random Fill Test Flow",
      courtsCount: 1,
      maxParticipants: 4,
      format: "Round Robin",
      type: "Doubles"
    });
    const t2 = t2Res.body;
    console.log("Created T2:", t2.id);

    // 2. Random Fill
    await request("POST", `/tournaments/${t2.id}/fill-participants-random`, { "x-user-id": adminId }, {});
    console.log("Filled T2");

    // 3. Start Tournament
    const startRes2 = await request("POST", `/tournaments/${t2.id}/start`, { "x-user-id": adminId });
    console.log("Start T2 status:", startRes2.status, startRes2.body.status);

    // 4. Generate Round
    const genRes2 = await request("POST", `/tournaments/${t2.id}/rounds/next`, { "x-user-id": adminId });
    console.log("Generate Round T2:", genRes2.status, genRes2.body);

  } catch (e) {
    console.error(e);
  }
}

run();
