const http = require('http');

const PORT = 3000;
const adminId = "u_admin_001";

function request(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
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
    console.log("--- TEST: DELETE TOURNAMENT ---");

    // 1. Create Tournament
    console.log("1. Creating tournament...");
    const t1Res = await request("POST", "/tournaments", { "x-user-id": adminId }, {
      name: "Delete Test",
      courtsCount: 1,
      maxParticipants: 4,
      format: "Round Robin",
      type: "Doubles"
    });
    const t1 = t1Res.body;
    console.log("Created T1:", t1.id);

    // 2. Filling random (Should include Ursus)...
    console.log("2. Filling random (Should include Ursus)...");
    const fillRes = await request("POST", `/tournaments/${t1.id}/fill-participants-random`, { "x-user-id": adminId });
    console.log("Fill result:", fillRes.body);

    // Verify Ursus is in
    const pRes = await request("GET", `/tournaments/${t1.id}/participants`, { "x-user-id": adminId });
    const participants = [...(pRes.body.confirmed || []), ...(pRes.body.waitlist || [])];
    const ursus = participants.find(p => p.fullName === "Ursus" || p.name === "Ursus");
    
    if (ursus) {
        console.log("SUCCESS: Ursus found in participants");
    } else {
        console.error("FAILURE: Ursus NOT found in participants!");
    }

    // 3. Generate Round
    console.log("3. Generating round...");
    await request("POST", `/tournaments/${t1.id}/start`, { "x-user-id": adminId });
    const genRes = await request("POST", `/tournaments/${t1.id}/rounds/next`, { "x-user-id": adminId });
    console.log("Generated matches:", genRes.body.count);

    // 4. Delete Tournament
    console.log("4. Deleting tournament...");
    const delRes = await request("DELETE", `/tournaments/${t1.id}`, { "x-user-id": adminId });
    console.log("Delete status:", delRes.status, delRes.body);

    // 5. Verify Deletion
    console.log("5. Verifying deletion...");
    const checkT = await request("GET", `/tournaments/${t1.id}`, { "x-user-id": adminId });
    if (checkT.status === 404) {
        console.log("SUCCESS: Tournament 404 Not Found");
    } else {
        console.error("FAILURE: Tournament still exists", checkT.status);
    }

    // Check matches via /me/matches for admin (if he played?) or just trust 404 on tournament means cleaned up?
    // Ideally check backend data but via API we can only check what's exposed.
    
  } catch (e) {
    console.error(e);
  }
}

run();
