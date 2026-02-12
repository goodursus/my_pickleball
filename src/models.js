const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, default: 'Player' },
  location: {
    city: String,
    country: String,
    name: String
  },
  skillLevel: { type: String, default: 'Beginner' },
  preferredNotificationChannel: { type: String, default: 'None' },
  recentMatchesCount: { type: Number, default: 5 },
  phone: String,
  telegramChatId: String,
  adminTelegramGroupId: String // New field
}, { timestamps: true });

const tournamentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  location: {
    name: String,
    city: String,
    country: String
  },
  startDate: Date,
  endDate: Date,
  durationMinutes: Number,
  courtsCount: { type: Number, default: 0 },
  maxParticipants: Number,
  roundsCount: Number,
  roundDurationMinutes: Number,
  breakTimeMinutes: Number,
  type: { type: String, default: 'Singles' },
  schedulingMode: { type: String, default: 'fixed' },
  currentRound: { type: Number, default: 0 },
  lastFinishedRound: { type: Number, default: 0 },
  roundStartTime: Date,
  format: { type: String, default: 'Round Robin' },
  status: { type: String, default: 'Open' },
  registrationOpenAt: Date,
  registrationCloseAt: Date,
  createdBy: { type: String, required: true },
  courtProgress: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

const tournamentEntrySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  tournamentId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  status: { type: String, default: 'confirmed' }
}, { timestamps: true });

const matchSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  tournamentId: { type: String, required: true, index: true },
  player1Id: String,
  partner1Id: String,
  player2Id: String,
  partner2Id: String,
  score1: Number,
  score2: Number,
  status: { type: String, default: 'scheduled' },
  round: Number,
  court: Number,
  pendingScore1: Number,
  pendingScore2: Number,
  submittedBy: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Tournament = mongoose.model('Tournament', tournamentSchema);
const TournamentEntry = mongoose.model('TournamentEntry', tournamentEntrySchema);
const Match = mongoose.model('Match', matchSchema);

module.exports = { User, Tournament, TournamentEntry, Match };
