
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'db.json');

function loadData() {
    if (fs.existsSync(DATA_FILE)) {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
    return { users: [], tournaments: [], tournamentEntries: [], matches: [] };
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function resetTestTournament() {
    const data = loadData();

    // 1. Cleanup old test data
    console.log("Cleaning up old test data...");
    const oldTournamentId = "t_test_example_001";
    data.tournaments = data.tournaments.filter(t => t.id !== oldTournamentId);
    data.tournamentEntries = data.tournamentEntries.filter(e => e.tournamentId !== oldTournamentId);
    data.matches = data.matches.filter(m => m.tournamentId !== oldTournamentId);

    // 2. Ensure we have 10 players
    console.log("Ensuring players exist...");
    const requiredPlayers = 10;
    // We expect u_player_001 to u_player_010
    // Check if they exist, if not create them
    for (let i = 1; i <= requiredPlayers; i++) {
        const id = `u_player_${String(i).padStart(3, '0')}`;
        if (!data.users.find(u => u.id === id)) {
            data.users.push({
                id,
                email: `player${i}@test.com`,
                password: "Password123!",
                fullName: `Player ${i}`,
                role: "Player",
                location: { city: "Test City", country: "Testland" },
                skillLevel: "Intermediate",
                preferredNotificationChannel: "Email"
            });
            console.log(`Created user ${id}`);
        }
    }

    // 3. Create new test tournament
    console.log("Creating new test tournament...");
    const newTournamentId = "t_test_example_002";
    const newTournament = {
        id: newTournamentId,
        name: "Test Tournament (Pairs)",
        description: "Auto-generated test tournament. 10 participants, 2 courts, 5 rounds.",
        location: {
            name: "Test Court",
            city: "Test City",
            country: "Testland"
        },
        startDate: new Date().toISOString(), // Starts now
        endDate: null,
        durationMinutes: 15,
        courtsCount: 2,
        maxParticipants: 10,
        roundsCount: 5,
        roundDurationMinutes: 2,
        currentRound: 0,
        roundStartTime: null,
        format: "Round Robin",
        status: "In Progress", // Ready to play
        registrationOpenAt: null,
        registrationCloseAt: null,
        createdBy: "u_admin_001"
    };
    data.tournaments.push(newTournament);

    // 4. Register participants
    console.log("Registering participants...");
    for (let i = 1; i <= 10; i++) {
        const userId = `u_player_${String(i).padStart(3, '0')}`;
        data.tournamentEntries.push({
            id: `te_test_${newTournamentId}_${i}`,
            tournamentId: newTournamentId,
            userId: userId,
            status: "confirmed"
        });
    }

    // 5. Generate Schedule (Logic duplicated from server.js for offline generation)
    console.log("Generating schedule...");
    
    // Generate all pairs
    const entries = data.tournamentEntries.filter(e => e.tournamentId === newTournamentId);
    let allMatchups = [];
    for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
            allMatchups.push({
                player1Id: entries[i].userId,
                player2Id: entries[j].userId
            });
        }
    }
    // Shuffle
    allMatchups.sort(() => Math.random() - 0.5);

    const targetRounds = 5;
    const courts = 2;
    let matchCount = 0;

    for (let r = 1; r <= targetRounds; r++) {
        let roundPlayers = new Set();
        let usedCourts = 0;

        for (let i = 0; i < allMatchups.length; i++) {
            if (usedCourts >= courts) break;

            let m = allMatchups[i];
            if (!roundPlayers.has(m.player1Id) && !roundPlayers.has(m.player2Id)) {
                matchCount++;
                usedCourts++;
                roundPlayers.add(m.player1Id);
                roundPlayers.add(m.player2Id);

                data.matches.push({
                    id: `m_${newTournamentId}_${matchCount}`,
                    tournamentId: newTournamentId,
                    player1Id: m.player1Id,
                    player2Id: m.player2Id,
                    score1: null,
                    score2: null,
                    status: "scheduled",
                    round: r,
                    court: usedCourts
                });

                allMatchups.splice(i, 1);
                i--;
            }
        }
    }
    console.log(`Generated ${matchCount} matches across ${targetRounds} rounds.`);

    saveData(data);
    console.log("Done!");
}

resetTestTournament();
