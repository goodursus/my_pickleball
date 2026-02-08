
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@pickleapp.com';

async function run() {
    console.log("=== STARTING SHUFFLE TOURNAMENT VERIFICATION ===");

    // 1. Get Users
    const usersRes = await fetch(BASE_URL + '/users');
    const users = await usersRes.json();
    const admin = users.find(u => u.email === ADMIN_EMAIL);
    const players = users.filter(u => u.fullName.startsWith("Player "));
    
    if (!admin) throw new Error("Admin not found");
    if (players.length < 10) throw new Error("Need at least 10 players");
    
    console.log(`Admin: ${admin.id}, Players available: ${players.length}`);
    players.forEach((p, idx) => console.log(`Player ${idx}: ${p.id} - ${p.fullName}`));

    // 2. Create Tournament (Shuffle, 2 Courts, 10 Players Max)
    const tData = {
        name: "Shuffle Verification Tournament",
        startDate: new Date().toISOString(),
        durationMinutes: 120,
        maxParticipants: 10,
        schedulingMode: "shuffle",
        format: "Round Robin",
        courtsCount: 2,
        roundsCount: 5,
        roundDurationMinutes: 10,
        breakTimeMinutes: 2,
        status: "Open",
        createdBy: admin.id
    };

    const createRes = await fetch(BASE_URL + '/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': admin.id },
        body: JSON.stringify(tData)
    });
    const tournament = await createRes.json();
    console.log(`Tournament created: ${tournament.id}`);

    // 3. Verify Start Button Logic (Should fail if not full)
    // We can't click the button, but we can try to call /start endpoint directly.
    // The frontend logic disables the button, but the backend doesn't explicitly forbid starting with fewer players 
    // UNLESS generate-schedule fails. Let's check frontend logic assumption:
    // "Start" calls /start then /generate-schedule.
    // /generate-schedule requires at least 2 participants.
    // User requirement is about the BUTTON being disabled.
    // We verified the button logic in code reading. Here we just test the flow.

    // 4. Join 10 Players
    console.log("Joining 10 players...");
    for (let i = 0; i < 10; i++) {
        const joinRes = await fetch(BASE_URL + `/tournaments/${tournament.id}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': players[i].id },
            body: JSON.stringify({ userId: players[i].id })
        });
        const joinData = await joinRes.json();
        if (!joinRes.ok) {
            console.error(`Failed to join player ${i}:`, joinData);
        } else {
            console.log(`Joined player ${i}: ${players[i].id}`);
        }
    }
    console.log("10 Players joined.");

    // 5. Start Tournament
    console.log("Starting tournament...");
    const startRes = await fetch(BASE_URL + `/tournaments/${tournament.id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': admin.id }
    });
    if (!startRes.ok) throw new Error("Failed to start tournament");
    
    // 6. Generate Schedule
    console.log("Generating schedule...");
    const scheduleRes = await fetch(BASE_URL + `/tournaments/${tournament.id}/generate-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': admin.id }
    });
    const scheduleData = await scheduleRes.json();
    console.log("Schedule generated:", scheduleData);

    // 7. Verify Matches & Courts
    const matchesRes = await fetch(BASE_URL + `/tournaments/${tournament.id}/matches`);
    if (!matchesRes.ok) {
        const txt = await matchesRes.text();
        throw new Error(`Failed to get matches: ${matchesRes.status} - ${txt}`);
    }
    const matchesData = await matchesRes.json();
    // The endpoint returns { matches: [...] } or just [...]?
    // Let's check server.js for /tournaments/:id/matches response format.
    // Wait, I didn't see the endpoint definition. I saw line 1906: app.get("/tournaments/:id/matches", ...
    // Let's assume it returns { matches: [...] } or [...] 
    // I will log it to see.
    console.log("Matches response:", matchesData);
    
    const matches = Array.isArray(matchesData) ? matchesData : (matchesData.matches || []);
    console.log(`Matches generated: ${matches.length}`);
    
    const court1Matches = matches.filter(m => m.court === 1);
    const court2Matches = matches.filter(m => m.court === 2);
    console.log(`Court 1 matches: ${court1Matches.length}`);
    console.log(`Court 2 matches: ${court2Matches.length}`);

    if (court1Matches.length === 0 || court2Matches.length === 0) {
        throw new Error("Matches not distributed to both courts");
    }

    // 8. Player Interaction (Start Round 2 for Court 1)
    // Find a player in Court 1
    const p1Id = court1Matches[0].player1Id;
    const player1 = users.find(u => u.id === p1Id);
    console.log(`Player on Court 1: ${player1.fullName} (${player1.id})`);

    console.log("Player attempting to start Round 2 on Court 1...");
    // Simulate what the button does: PATCH courtProgress
    const patchRes = await fetch(BASE_URL + `/tournaments/${tournament.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-id': player1.id },
        body: JSON.stringify({
            courtProgress: { "1": 2, "2": 1 } // Trying to update court 1 to round 2, keep court 2 at 1
        })
    });
    
    const patchData = await patchRes.json();
    if (patchRes.ok) {
        console.log("SUCCESS: Player updated court progress:", patchData.courtProgress);
    } else {
        console.error("FAILURE: Player could not update court progress:", patchData);
    }

    // 9. Verify Score Entry Access
    // In our code, canInteract = isExpanded && !isCompleted && (organizerCanEdit || isParticipant)
    // isExpanded depends on currentCourtRound.
    // If we set court 1 to round 2, then matches in round 2 for court 1 should be editable by participants.
    
    // Let's verify via "Start Round" simulation that the state is persisted.
    const tRes = await fetch(BASE_URL + `/tournaments`);
    const tList = await tRes.json();
    const tUpdated = tList.find(t => t.id === tournament.id);
    if (tUpdated.courtProgress["1"] === 2) {
        console.log("Verification Passed: Court 1 is at Round 2.");
    } else {
        console.error("Verification Failed: Court 1 is NOT at Round 2.");
    }

    console.log("=== VERIFICATION COMPLETE ===");
}

run().catch(e => console.error(e));
