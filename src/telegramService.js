const TelegramBot = require('node-telegram-bot-api');

// Create a bot that uses 'polling' to fetch new updates if token is present
// We use polling only for development or simple setups. 
// Ideally for production with heavy load, use Webhooks, but polling is fine for this scale.
const token = process.env.TELEGRAM_TOKEN;
let bot = null;

if (token) {
    bot = new TelegramBot(token, { polling: false }); // Polling false because we only SEND messages mostly. 
    // If we want to reply to /start to give chat ID, we need polling or webhook.
    // Let's enable polling but handle errors gracefully if multiple instances run.
    // Actually, for Render free tier, polling is okay.
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
        
        const dateStr = tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : "TBD";
        const timeStr = tournament.startDate ? new Date(tournament.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "";
        
        const text = `🏆 New Tournament: ${tournament.name}\n\n` +
                     `📅 ${dateStr} ${timeStr}\n` +
                     `📍 ${tournament.location ? tournament.location.name : "TBD"}\n` +
                     `ℹ️ Format: ${tournament.format}\n\n` +
                     `Log in to the app to join!`;
        
        await telegramService.sendMessage(user.telegramChatId, text);
    },

    sendRegistrationConfirmation: async (user, tournament, status) => {
        if (user.preferredNotificationChannel !== "Telegram" || !user.telegramChatId) return;
        
        const statusIcon = status === "confirmed" ? "✅" : "⏳";
        const text = `${statusIcon} Registration Update: ${tournament.name}\n\n` +
                     `Status: ${status.toUpperCase()}\n` + 
                     (status === "waitlist" ? "You are on the waitlist." : "You are a confirmed participant.");
        
        await telegramService.sendMessage(user.telegramChatId, text);
    },

    sendWithdrawalConfirmation: async (user, tournament) => {
        if (user.preferredNotificationChannel !== "Telegram" || !user.telegramChatId) return;
        const text = `🚫 Withdrawal Confirmed: ${tournament.name}\n\nYou have been removed from the list.`;
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
    }
};

module.exports = telegramService;
