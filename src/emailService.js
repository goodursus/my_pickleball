const axios = require("axios");

function renderTemplate(title, bodyHtml) {
  const brand = {
    name: "Pickleball Tournament",
    primary: "#3b82f6",
    dark: "#111827",
    text: "#374151",
    muted: "#6b7280",
    bg: "#f3f4f6"
  };
  return `
  <html>
    <body style="margin:0;padding:0;background:${brand.bg};font-family:Arial,Helvetica,sans-serif;color:${brand.text}">
      <div style="max-width:640px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 10px 20px rgba(0,0,0,0.08)">
        <div style="background:${brand.dark};color:#ffffff;padding:16px 20px;display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:20px">🏓</span>
            <strong style="font-size:16px">${brand.name}</strong>
          </div>
          <span style="font-size:12px;opacity:0.85">${title}</span>
        </div>
        <div style="padding:20px">${bodyHtml}</div>
        <div style="padding:14px 20px;border-top:1px solid #e5e7eb;color:${brand.muted};font-size:12px">
          This is an automated message. Replies are handled at
          <a href="mailto:vetursus@gmail.com" style="color:${brand.primary};text-decoration:none">vetursus@gmail.com</a>.
        </div>
      </div>
    </body>
  </html>
  `;
}

async function sendEmail(to, subject, text, htmlBody) {
  const apiKey = process.env.BREVO_API_KEY;
  const url = "https://api.brevo.com/v3/smtp/email";
  const sender = { name: "Pickleball Tournament", email: (process.env.SENDER_EMAIL || "veteranpickle@gmail.com") };
  const replyTo = { email: "vetursus@gmail.com", name: "Organizer" };
  const appUrl = process.env.APP_URL || "https://pickleball-app-s5wk.onrender.com/app";

  if (!apiKey) {
    console.log("[Email Service] BREVO_API_KEY not set; preview:");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Text:", text);
    return;
  }

  const htmlContent = renderTemplate(subject, htmlBody || `<pre style="white-space:pre-wrap">${text}</pre>`);

  const payload = {
    sender,
    to: [{ email: to }],
    replyTo,
    subject,
    htmlContent
  };

  const response = await axios.post(url, payload, {
    headers: { "api-key": apiKey, "Content-Type": "application/json" }
  });
  console.log(`✅ Email sent to ${to} (${response.data && response.data.messageId || "ok"})`);
  return response.data;
}

const emailService = {
  sendWelcomeEmail: async (user) => {
    if (user.preferredNotificationChannel !== "Email") return;
    const subject = `Welcome, ${user.fullName}!`;
    const text = `Welcome ${user.fullName}!\n\nYou have successfully subscribed to Pickleball Tournament notifications.`;
    const html = `<h2 style="margin:0 0 8px">Welcome ${user.fullName}!</h2><p>You have successfully subscribed to Pickleball Tournament notifications.</p>`;
    return sendEmail(user.email, subject, text, html);
  },

  sendTournamentInvitation: async (user, tournament) => {
    if (user.preferredNotificationChannel !== "Email") return;
    const dateObj = tournament.startDate ? new Date(tournament.startDate) : null;
    const dateStr = dateObj ? dateObj.toLocaleDateString('en-US') : "TBD";
    const timeStr = dateObj ? dateObj.toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit', hour12: true}) : "";
    const weekday = dateObj ? dateObj.toLocaleDateString('en-US', { weekday: 'long' }) : "";
    const locName = tournament.location ? tournament.location.name : "Location not set";
    const locCity = tournament.location && tournament.location.city ? `, ${tournament.location.city}` : "";
    const subject = `🏆 New Tournament: ${tournament.name}`;
    const text = `🏆 New Tournament: ${tournament.name}\n\n📅 ${weekday} ${dateStr} ${timeStr}\n📍 ${locName}${locCity}\nℹ️ Format: ${tournament.format} (${tournament.type || "Singles"}) - Mode: ${tournament.schedulingMode || "fixed"}\n🏟️ Courts: ${tournament.courtsCount || "?"}\n🔄 Rounds: ${tournament.roundsCount || "?"}\n⏱️ Duration: ${tournament.durationMinutes || "?"} minutes\n👥 Max participants: ${tournament.maxParticipants || "Unlimited"}\nStatus: ${tournament.status}\n\nLog in to the app to join!`;
    const html = `
      <h2 style="margin:0 0 8px">🏆 New Tournament: ${tournament.name}</h2>
      <div style="margin:10px 0">
        📅 ${weekday} ${dateStr} ${timeStr}<br/>
        📍 ${locName}${locCity}<br/>
        ℹ️ Format: ${tournament.format} (${tournament.type || "Singles"}) • Mode: ${tournament.schedulingMode || "fixed"}<br/>
        🏟️ Courts: ${tournament.courtsCount || "?"} • 🔄 Rounds: ${tournament.roundsCount || "?"}<br/>
        ⏱️ Duration: ${tournament.durationMinutes || "?"} minutes • 👥 Max: ${tournament.maxParticipants || "Unlimited"}<br/>
        Status: ${tournament.status}
      </div>
      <a href="${appUrl}" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none">Open App</a>
    `;
    return sendEmail(user.email, subject, text, html);
  },

  sendTournamentRegistrationConfirmation: async (user, tournament, status) => {
    if (user.preferredNotificationChannel !== "Email") return;
    const dateObj = tournament.startDate ? new Date(tournament.startDate) : null;
    const dateStr = dateObj ? dateObj.toLocaleDateString('en-US') : "TBD";
    const timeStr = dateObj ? dateObj.toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit', hour12: true}) : "";
    const weekday = dateObj ? dateObj.toLocaleDateString('en-US', { weekday: 'long' }) : "";
    const statusIcon = status === "confirmed" ? "✅" : "⏳";
    const subject = `${statusIcon} Registration Update: ${tournament.name}`;
    const text = `Dear ${user.fullName},\n\n${statusIcon} Registration Update: ${tournament.name}\n📅 ${weekday} ${dateStr} ${timeStr}\n\nStatus: ${status.toUpperCase()}\n${status === "waitlist" ? "You are on the waitlist." : "You are a confirmed participant."}`;
    const html = `
      <h2 style="margin:0 0 8px">${statusIcon} Registration Update: ${tournament.name}</h2>
      <p>Dear ${user.fullName},</p>
      <p>📅 ${weekday} ${dateStr} ${timeStr}</p>
      <p><b>Status:</b> ${status.toUpperCase()}</p>
      <p>${status === "waitlist" ? "You are on the waitlist." : "You are a confirmed participant."}</p>
      <a href="${process.env.APP_URL || "https://pickleball-app-s5wk.onrender.com/app"}" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none">Open App</a>
    `;
    return sendEmail(user.email, subject, text, html);
  },

  sendTournamentWithdrawalConfirmation: async (user, tournament) => {
    if (user.preferredNotificationChannel !== "Email") return;
    const dateObj = tournament.startDate ? new Date(tournament.startDate) : null;
    const dateStr = dateObj ? dateObj.toLocaleDateString('en-US') : "TBD";
    const timeStr = dateObj ? dateObj.toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit', hour12: true}) : "";
    const weekday = dateObj ? dateObj.toLocaleDateString('en-US', { weekday: 'long' }) : "";
    const subject = `🚫 Withdrawal Confirmed: ${tournament.name}`;
    const text = `Dear ${user.fullName},\n\n🚫 Withdrawal Confirmed: ${tournament.name}\n📅 ${weekday} ${dateStr} ${timeStr}\n\nYou have been removed from the list.`;
    const html = `
      <h2 style="margin:0 0 8px">🚫 Withdrawal Confirmed: ${tournament.name}</h2>
      <p>Dear ${user.fullName},</p>
      <p>📅 ${weekday} ${dateStr} ${timeStr}</p>
      <p>You have been removed from the list.</p>
      <a href="${process.env.APP_URL || "https://pickleball-app-s5wk.onrender.com/app"}" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none">Open App</a>
    `;
    return sendEmail(user.email, subject, text, html);
  },

  sendTournamentResults: async (user, tournament, resultsText) => {
    if (user.preferredNotificationChannel !== "Email") return;
    const subject = `🏁 Tournament Finished: ${tournament.name}`;
    const text = `🏁 Tournament Finished: ${tournament.name}\n\nResults:\n${resultsText}`;
    const html = `
      <h2 style="margin:0 0 8px">🏁 Tournament Finished: ${tournament.name}</h2>
      <pre style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;white-space:pre-wrap">${resultsText}</pre>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <a href="${process.env.APP_URL || "https://pickleball-app-s5wk.onrender.com/app"}" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none">Open App</a>
        <a href="${(process.env.APP_URL || "https://pickleball-app-s5wk.onrender.com/app") + (tournament && tournament.id ? ("?t=" + tournament.id + "&view=standings") : "")}" style="display:inline-block;background:#ffffff;color:#3b82f6;padding:10px 14px;border-radius:8px;text-decoration:none;border:1px solid #3b82f6">View Standings</a>
      </div>
    `;
    return sendEmail(user.email, subject, text, html);
  },

  sendTournamentStatusUpdate: async (user, tournament, status) => {
    if (user.preferredNotificationChannel !== "Email") return;
    let msg = `Update: ${tournament.name} is now ${status}.`;
    if (status === "In Progress") msg = `🚀 Tournament STARTED: ${tournament.name}\nCheck your matches!`;
    if (status === "Reset") msg = `🔄 Tournament RESET: ${tournament.name}`;
    const subject = `Tournament Update: ${tournament.name}`;
    const text = `Dear ${user.fullName},\n\n${msg}`;
    const html = `
      <h2 style="margin:0 0 8px">Tournament Update</h2>
      <p>${msg.replace(/\n/g, "<br/>")}</p>
      <a href="${process.env.APP_URL || "https://pickleball-app-s5wk.onrender.com/app"}" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none">Open App</a>
    `;
    return sendEmail(user.email, subject, text, html);
  },

  sendTournamentDeletion: async (user, tournamentName) => {
    if (user.preferredNotificationChannel !== "Email") return;
    const subject = `🗑️ Tournament Deleted: ${tournamentName}`;
    const text = `🗑️ Tournament Deleted: ${tournamentName}`;
    const html = `
      <h2 style="margin:0 0 8px">🗑️ Tournament Deleted: ${tournamentName}</h2>
      <a href="${process.env.APP_URL || "https://pickleball-app-s5wk.onrender.com/app"}" style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none">Open App</a>
    `;
    return sendEmail(user.email, subject, text, html);
  }
};

module.exports = emailService;
