const TelegramBot = require('node-telegram-bot-api');

// Create a bot that uses 'polling' to fetch new updates if token is present
// We use polling only for development or simple setups. 
// Ideally for production with heavy load, use Webhooks, but polling is fine for this scale.
const token = process.env.TELEGRAM_TOKEN;
let bot = null;

if (token) {
    bot = new TelegramBot(token, { polling: true }); 

    // Listen for /start to give users their Chat ID
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, `Hello! Your Telegram Chat ID is:\n\`${chatId}\`\n\nPlease copy this and paste it into your Pickleball App profile.`, { parse_mode: "Markdown" });
        console.log(`[Telegram] User started bot. Chat ID: ${chatId}`);
    });
    
    // Log polling errors to prevent crash
    bot.on("polling_error", (err) => {
        if (err.code !== 'ETELEGRAM') {
             console.log("[Telegram] Polling error:", err.code);
        }
    });
} else {
    console.log("[Telegram] No token provided, service disabled.");
}

const telegramService = {
    // Helper to format messages nicely
    sendMessage: async (chatId, text) => {
        if (!bot || !chatId) return;
        try {
            await bot.sendMessage(chatId, text);
            console.log(`[Telegram] Sent to ${chatId}: ${text.substring(0, 20)}...`);
        } catch (err) {
            console.error(`[Telegram] Failed to send to ${chatId}:`, err.message);
        }
    },

    sendWelcome: async (user) => {
        if (user.preferredNotificationChannel !== "Telegram" || !user.telegramChatId) return;
        const text = `Welcome ${user.fullName}!\n\nYou have successfully subscribed to Pickleball Tournament notifications.`;
        await telegramService.sendMessage(user.telegramChatId, text);
    },

    sendTournamentInvitation: async (user, tournament) => {
        if (user.preferredNotificationChannel !== "Telegram" || !user.telegramChatId) return;
        
        const dateObj = tournament.startDate ? new Date(tournament.startDate) : null;
        // Force en-US locale
        const dateStr = dateObj ? dateObj.toLocaleDateString('en-US') : "TBD";
        const timeStr = dateObj ? dateObj.toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit', hour12: true}) : "";
        
        const weekday = dateObj ? dateObj.toLocaleDateString('en-US', { weekday: 'long' }) : "";
        
        const locName = tournament.location ? tournament.location.name : "Location not set";
        const locCity = tournament.location && tournament.location.city ? `, ${tournament.location.city}` : "";
        
        const text = `🏆 New Tournament: ${tournament.name}\n\n` +
                     `📅 ${weekday} ${dateStr} ${timeStr}\n` +
                     `📍 ${locName}${locCity}\n` +
                     `ℹ️ Format: ${tournament.format} (${tournament.type || "Singles"}) - Mode: ${tournament.schedulingMode || "fixed"}\n` +
                     `🏟️ Courts: ${tournament.courtsCount || "?"}\n` +
                     `🔄 Rounds: ${tournament.roundsCount || "?"}\n` +
                     `⏱️ Duration: ${tournament.durationMinutes || "?"} minutes\n` +
                     `👥 Max participants: ${tournament.maxParticipants || "Unlimited"}\n` +
                     `Status: ${tournament.status}\n\n` +
                     `Log in to the app to join!`;
        
        await telegramService.sendMessage(user.telegramChatId, text);
    },

    sendRegistrationConfirmation: async (user, tournament, status) => {
        if (user.preferredNotificationChannel !== "Telegram" || !user.telegramChatId) return;
        
        const dateObj = tournament.startDate ? new Date(tournament.startDate) : null;
        // Force en-US locale to get English weekday names regardless of system locale
        const dateStr = dateObj ? dateObj.toLocaleDateString('en-US') : "TBD";
        const timeStr = dateObj ? dateObj.toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit', hour12: true}) : "";
        const weekday = dateObj ? dateObj.toLocaleDateString('en-US', { weekday: 'long' }) : "";

        const statusIcon = status === "confirmed" ? "✅" : "⏳";
        const text = `Dear ${user.fullName},\n\n` +
                     `${statusIcon} Registration Update: ${tournament.name}\n` +
                     `📅 ${weekday} ${dateStr} ${timeStr}\n\n` +
                     `Status: ${status.toUpperCase()}\n` + 
                     (status === "waitlist" ? "You are on the waitlist." : "You are a confirmed participant.");
        
        await telegramService.sendMessage(user.telegramChatId, text);
    },

    sendWithdrawalConfirmation: async (user, tournament) => {
        if (user.preferredNotificationChannel !== "Telegram" || !user.telegramChatId) return;
        
        const dateObj = tournament.startDate ? new Date(tournament.startDate) : null;
        const dateStr = dateObj ? dateObj.toLocaleDateString('en-US') : "TBD";
        const timeStr = dateObj ? dateObj.toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit', hour12: true}) : "";
        const weekday = dateObj ? dateObj.toLocaleDateString('en-US', { weekday: 'long' }) : "";

        const text = `Dear ${user.fullName},\n\n` +
                     `🚫 Withdrawal Confirmed: ${tournament.name}\n` +
                     `📅 ${weekday} ${dateStr} ${timeStr}\n\n` +
                     `You have been removed from the list.`;
        await telegramService.sendMessage(user.telegramChatId, text);
    },

    sendStatusUpdate: async (user, tournament, status) => {
        if (user.preferredNotificationChannel !== "Telegram" || !user.telegramChatId) return;
        
        let msg = `Update: ${tournament.name} is now ${status}.`;
        if (status === "In Progress") msg = `🚀 Tournament STARTED: ${tournament.name}\nCheck your matches!`;
        if (status === "Reset") msg = `🔄 Tournament RESET: ${tournament.name}`;
        
        await telegramService.sendMessage(user.telegramChatId, msg);
    },

    sendResults: async (user, tournament, resultsText) => {
        if (user.preferredNotificationChannel !== "Telegram" || !user.telegramChatId) return;
        
        const text = `🏁 Tournament Finished: ${tournament.name}\n\nResults:\n${resultsText}`;
        await telegramService.sendMessage(user.telegramChatId, text);
    },

    sendTournamentDeletion: async (user, tournamentName) => {
        if (user.preferredNotificationChannel !== "Telegram" || !user.telegramChatId) return;

        const text = `🗑️ Tournament Deleted: ${tournamentName}`;
        await telegramService.sendMessage(user.telegramChatId, text);
    }
};

module.exports = telegramService;
