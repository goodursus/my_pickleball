
const BASE_URL = 'http://localhost:3000';
let tournamentId;
let organizerId;
let playerIds = [];

async function request(method, endpoint, data = null, headers = {}) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (data) options.body = JSON.stringify(data);
  
  const res = await fetch(BASE_URL + endpoint, options);
   const text = await res.text();
   let json = {};
   try {
       json = JSON.parse(text);
   } catch(e) {}
   
   if (!res.ok) {
       console.log('Request failed:', endpoint, res.status, text);
       throw new Error(json.error || res.statusText);
   }
   return { data: json, status: res.status };
}

async function runTest() {
  try {
    // 1. Login as Admin (Organizer)
    console.log('Logging in as Admin...');
    // Try default admin credentials
    let adminEmail = 'admin@pickleapp.com';
    let adminPass = 'Admin123!';
    
    // Attempt login
    const loginRes = await request('POST', '/auth/login', {
        email: adminEmail,
        password: adminPass
    });

    if (loginRes.data.user && loginRes.data.user.role === 'Organizer') {
        organizerId = loginRes.data.user.id;
        console.log('Logged in as Admin:', organizerId);
    } else {
        // Fallback: if default admin not found or changed, try to find ANY organizer via signup?
        // But we know signup forces Player if any organizer exists.
        // So we must find an existing organizer.
        // If login failed, maybe we can't run the test easily without resetting DB.
        throw new Error('Could not login as Admin. Setup requires an existing Organizer.');
    }

    // 2. Create 9 Players (for 2 courts: 5 + 4)
    console.log('Creating 9 players...');
    for (let i = 0; i < 9; i++) {
      const pRes = await request('POST', '/auth/signup', {
        email: `p${i}_${Date.now()}@test.com`,
        password: 'password',
        fullName: `Player ${i}`
      });
      playerIds.push(pRes.data.id);
    }
    console.log('Players created:', playerIds.length);

    // 3. Create Tournament with Shuffle Mode
    console.log('Creating Shuffle Tournament...');
    const tRes = await request('POST', '/tournaments', {
      name: 'Shuffle Test Tournament',
      courtsCount: 2,
      roundsCount: 3,
      schedulingMode: 'shuffle',
      type: 'Doubles',
      format: 'Shuffle Doubles'
    }, { 'x-user-id': organizerId });
    tournamentId = tRes.data.id;
    console.log('Tournament created:', tournamentId);

    // 4. Register Players
    console.log('Registering players...');
    for (const pid of playerIds) {
      await request('POST', `/tournaments/${tournamentId}/join`, {}, { 'x-user-id': pid });
    }

    // 6. Start Tournament
    console.log('Starting tournament...');
    const startRes = await request('POST', `/tournaments/${tournamentId}/start`, {}, { 'x-user-id': organizerId });
    console.log('Tournament started:', startRes.data.status);

    // 7. Generate Schedule
    console.log('Generating schedule...');
    const genRes = await request('POST', `/tournaments/${tournamentId}/generate-schedule`, {}, { 'x-user-id': organizerId });
    console.log('Schedule generated:', genRes.data.message);

    // 8. Fetch Matches
    console.log('Fetching matches...');
    const mRes = await request('GET', `/tournaments/${tournamentId}/matches`);
    const matches = mRes.data;
    console.log(`Generated ${matches.length} matches.`);

    // Verification
    const court1Matches = matches.filter(m => m.court === 1);
    const court2Matches = matches.filter(m => m.court === 2);
    
    console.log(`Court 1 Matches: ${court1Matches.length}`);
    console.log(`Court 2 Matches: ${court2Matches.length}`);

    if (matches.length > 0) {
        console.log('TEST PASSED: Schedule generated successfully for Shuffle Doubles.');
    } else {
        console.log('TEST FAILED: No matches generated.');
    }

  } catch (error) {
    console.error('TEST FAILED:', error.message);
  }
}

runTest();
