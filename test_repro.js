
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
    console.log("--- TEST: MANUAL JOIN ---");
    // 1. Create Tournament
    const t1Res = await request("POST", "/tournaments", { "x-user-id": adminId }, {
      name: "Manual Join Test",
      courtsCount: 1,
      maxParticipants: 4,
      format: "Round Robin",
      type: "Doubles"
    });
    if (t1Res.status !== 201) throw new Error("Failed to create T1: " + JSON.stringify(t1Res.body));
    const t1 = t1Res.body;
    console.log("Created T1:", t1.id);

    // 2. Players Join
    for (const pid of playerIds) {
        const jRes = await request("POST", `/tournaments/${t1.id}/join`, { "x-user-id": pid }, {});
        if (jRes.status !== 201) console.error(`Failed to join ${pid}:`, jRes.body);
        else console.log(`Joined ${pid}`);
    }

    // 3. Check Tournament Status as seen by Admin (via /tournaments list)
    const listRes = await request("GET", "/tournaments", { "x-user-id": adminId });
    const t1Updated = listRes.body.find(t => t.id === t1.id);
    console.log("T1 Status:", t1Updated.status);
    console.log("T1 Registered:", t1Updated.registeredCount);
    console.log("T1 Waitlist:", t1Updated.waitlistCount);

    console.log("\n--- TEST: RANDOM FILL ---");
    // 1. Create Tournament
    const t2Res = await request("POST", "/tournaments", { "x-user-id": adminId }, {
      name: "Random Fill Test",
      courtsCount: 1,
      maxParticipants: 4,
      format: "Round Robin",
      type: "Doubles"
    });
    if (t2Res.status !== 201) throw new Error("Failed to create T2: " + JSON.stringify(t2Res.body));
    const t2 = t2Res.body;
    console.log("Created T2:", t2.id);

    // 2. Random Fill
    const fillRes = await request("POST", `/tournaments/${t2.id}/fill-participants-random`, { "x-user-id": adminId }, {});
    console.log("Fill Result:", fillRes.body);

    // 3. Check Tournament Status
    const listRes2 = await request("GET", "/tournaments", { "x-user-id": adminId });
    const t2Updated = listRes2.body.find(t => t.id === t2.id);
    console.log("T2 Status:", t2Updated.status);
    console.log("T2 Registered:", t2Updated.registeredCount);
    console.log("T2 Waitlist:", t2Updated.waitlistCount);

  } catch (e) {
    console.error(e);
  }
}

run();
