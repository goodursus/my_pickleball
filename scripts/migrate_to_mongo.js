require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { User, Tournament, TournamentEntry, Match } = require('../src/models');

const DATA_FILE = path.join(__dirname, "..", "data", "db.json");
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("Please set MONGODB_URI in your .env file first.");
    process.exit(1);
}

async function migrate() {
    if (!fs.existsSync(DATA_FILE)) {
        console.error("No db.json found at " + DATA_FILE);
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB.");

        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        
        // 1. Users
        if (data.users && data.users.length > 0) {
            console.log(`Migrating ${data.users.length} users...`);
            for (const u of data.users) {
                // Check if exists
                const exists = await User.findOne({ id: u.id });
                if (!exists) {
                    await User.create(u);
                }
            }
        }

        // 2. Tournaments
        if (data.tournaments && data.tournaments.length > 0) {
            console.log(`Migrating ${data.tournaments.length} tournaments...`);
            for (const t of data.tournaments) {
                const exists = await Tournament.findOne({ id: t.id });
                if (!exists) {
                    await Tournament.create(t);
                }
            }
        }

        // 3. Entries
        if (data.tournamentEntries && data.tournamentEntries.length > 0) {
            console.log(`Migrating ${data.tournamentEntries.length} entries...`);
            for (const e of data.tournamentEntries) {
                const exists = await TournamentEntry.findOne({ id: e.id });
                if (!exists) {
                    await TournamentEntry.create(e);
                }
            }
        }

        // 4. Matches
        if (data.matches && data.matches.length > 0) {
            console.log(`Migrating ${data.matches.length} matches...`);
            for (const m of data.matches) {
                const exists = await Match.findOne({ id: m.id });
                if (!exists) {
                    await Match.create(m);
                }
            }
        }

        console.log("Migration completed successfully!");
        process.exit(0);

    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
