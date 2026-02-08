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

const data = loadData();

// 1. Ensure 10 players exist
const requiredPlayers = 10;
let players = data.users.filter(u => u.role === 'Player');
let admin = data.users.find(u => u.role === 'Organizer');

if (!admin) {
    console.error("No organizer found. Please run the server once to generate default data.");
    process.exit(1);
}

console.log(`Found ${players.length} existing players.`);

for (let i = players.length + 1; i <= requiredPlayers; i++) {
    const id = `u_player_${String(i).padStart(3, '0')}`;
    const newUser = {
        id,
        email: `player${i}@test.com`,
        password: "Password123!",
        fullName: `Player ${i}`,
        role: "Player",
        location: { city: "Test City", country: "Testland" },
        skillLevel: "Intermediate",
        preferredNotificationChannel: "Email"
    };
    data.users.push(newUser);
    console.log(`Created user: ${newUser.fullName}`);
}

// Reload players
players = data.users.filter(u => u.role === 'Player' || u.id.startsWith('u_player')); 
// Note: standard players might be mixed, just taking first 10 for the tournament
const participants = players.slice(0, 10);

if (participants.length < 10) {
    // If we still don't have 10, use admin or others? 
    // Actually we just created them.
    // Ensure we have 10 distinct users.
    const needed = 10 - participants.length;
    // Add dummy users if needed (shouldn't happen with the loop above)
}

// 2. Create Tournament
const tournamentId = "t_test_example_001";
// Remove existing if any
data.tournaments = data.tournaments.filter(t => t.id !== tournamentId);
data.tournamentEntries = data.tournamentEntries.filter(e => e.tournamentId !== tournamentId);
data.matches = data.matches.filter(m => m.tournamentId !== tournamentId);

const tournament = {
    id: tournamentId,
    name: "Test Tournament (Pairs)",
    description: "Auto-generated test tournament. 10 participants, 2 courts, 5 rounds.",
    location: { name: "Test Court", city: "Test City", country: "Testland" },
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
    status: "Open", // Will be "In Progress" after start
    registrationOpenAt: null,
    registrationCloseAt: null,
    createdBy: admin.id
};

data.tournaments.push(tournament);
console.log("Created tournament: " + tournament.name);

// 3. Register Participants
participants.forEach((p, idx) => {
    const entry = {
        id: `te_test_${idx + 1}`,
        tournamentId: tournament.id,
        userId: p.id,
        status: "confirmed"
    };
    data.tournamentEntries.push(entry);
});
console.log(`Registered ${participants.length} participants.`);

saveData(data);
console.log("Done! Data saved to db.json");
