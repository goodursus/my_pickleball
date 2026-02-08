const nodemailer = require("nodemailer");

// Create a transporter. 
// For development without SMTP, we can use 'streamTransport' (logs to console/buffer) or Ethereal.
// Since we want to see the "output" in the logs as proof of work for the user, 
// we will just log the email details to the console if SMTP is not configured.
// Ideally, the user would provide SMTP_HOST, SMTP_USER, etc. in environment variables.

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function sendEmail(to, subject, text, html) {
    try {
        console.log(`[Email Service] Sending email to ${to}...`);
        
        const info = await transporter.sendMail({
            from: `"Pickleball App" <${process.env.SMTP_USER}>`,
            to: to,
            subject: subject,
            text: text,
            html: html
        });

        // Log the message for verification
        console.log("---------------------------------------------------");
        console.log(`EMAIL SENT TO: ${to}`);
        console.log(`SUBJECT: ${subject}`);
        console.log(`CONTENT: ${text}`);
        console.log("---------------------------------------------------");
        
        return info;
    } catch (error) {
        console.error("[Email Service] Error sending email:", error);
    }
}

const emailService = {
    sendWelcomeEmail: async (user) => {
        if (user.preferredNotificationChannel !== "Email") return;

        const subject = "Welcome to Pickleball App!";
        const text = `Dear ${user.fullName},

Welcome to the Pickleball Tournament App! 
We are excited to have you on board. We wish you great success and many victories in future tournaments.

Best regards,
The Pickleball Team`;
        
        const html = `<h2>Welcome, ${user.fullName}!</h2>
<p>Welcome to the <b>Pickleball Tournament App</b>!</p>
<p>We are excited to have you on board. We wish you great success and many victories in future tournaments.</p>
<p>Best regards,<br>The Pickleball Team</p>`;

        return sendEmail(user.email, subject, text, html);
    },

    sendTournamentInvitation: async (user, tournament) => {
        if (user.preferredNotificationChannel !== "Email") return;

        const subject = `Invitation: ${tournament.name}`;
        const locationStr = tournament.location ? `${tournament.location.name}, ${tournament.location.city}` : "TBD";
        const dateStr = tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : "TBD";
        const timeStr = tournament.startDate ? new Date(tournament.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "";
        
        const text = `Dear ${user.fullName},

We are happy to invite you to participate in our new tournament: "${tournament.name}"!

Details:
- Date: ${dateStr} ${timeStr}
- Location: ${locationStr}
- Format: ${tournament.format || "Round Robin"}

Log in to the app to register now!

Best regards,
The Pickleball Team`;

        const html = `<h3>New Tournament Invitation!</h3>
<p>Dear ${user.fullName},</p>
<p>We are happy to invite you to participate in our new tournament: <b>${tournament.name}</b>!</p>
<ul>
<li><b>Date:</b> ${dateStr} ${timeStr}</li>
<li><b>Location:</b> ${locationStr}</li>
<li><b>Format:</b> ${tournament.format || "Round Robin"}</li>
</ul>
<p><a href="http://localhost:3000">Log in to the app</a> to register now!</p>
<p>Best regards,<br>The Pickleball Team</p>`;

        return sendEmail(user.email, subject, text, html);
    },

    sendTournamentRegistrationConfirmation: async (user, tournament, status) => {
        if (user.preferredNotificationChannel !== "Email") return;

        const subject = `Registration Confirmation: ${tournament.name}`;
        const statusMsg = status === "waitlist" 
            ? "You are currently on the WAITLIST." 
            : "You are successfully registered as a PARTICIPANT.";
            
        const text = `Dear ${user.fullName},

This email confirms your registration for "${tournament.name}".

Status: ${statusMsg}

We will notify you if there are any changes.

Best regards,
The Pickleball Team`;

        const html = `<h3>Registration Confirmed</h3>
<p>Dear ${user.fullName},</p>
<p>This email confirms your registration for <b>${tournament.name}</b>.</p>
<p><b>Status:</b> ${statusMsg}</p>
<p>We will notify you if there are any changes.</p>
<p>Best regards,<br>The Pickleball Team</p>`;

        return sendEmail(user.email, subject, text, html);
    },

    sendTournamentWithdrawalConfirmation: async (user, tournament) => {
        if (user.preferredNotificationChannel !== "Email") return;

        const subject = `Withdrawal Confirmation: ${tournament.name}`;
        
        const text = `Dear ${user.fullName},

This email confirms your withdrawal from "${tournament.name}".

If this was a mistake, please register again through the application.

Best regards,
The Pickleball Team`;

        const html = `<h3>Withdrawal Confirmed</h3>
<p>Dear ${user.fullName},</p>
<p>This email confirms your withdrawal from <b>${tournament.name}</b>.</p>
<p>If this was a mistake, please register again through the application.</p>
<p>Best regards,<br>The Pickleball Team</p>`;

        return sendEmail(user.email, subject, text, html);
    },

    sendTournamentResults: async (user, tournament, resultsText) => {
        if (user.preferredNotificationChannel !== "Email") return;

        const subject = `Results: ${tournament.name}`;
        
        const text = `Dear ${user.fullName},

The tournament "${tournament.name}" has concluded. Thank you for participating!

Here are the final results:

${resultsText}

We wish you continued success in your pickleball journey!

Best regards,
The Pickleball Team`;

        // Simple HTML version - converting newlines to <br> for the table part
        const html = `<h3>Tournament Results</h3>
<p>Dear ${user.fullName},</p>
<p>The tournament <b>${tournament.name}</b> has concluded. Thank you for participating!</p>
<p>Here are the final results:</p>
<pre>${resultsText}</pre>
<p>We wish you continued success in your pickleball journey!</p>
<p>Best regards,<br>The Pickleball Team</p>`;

        return sendEmail(user.email, subject, text, html);
    },

    sendTournamentStatusUpdate: async (user, tournament, status) => {
        if (user.preferredNotificationChannel !== "Email") return;

        const subject = `Tournament Update: ${tournament.name}`;
        
        let message = "";
        if (status === "In Progress") {
            message = `The tournament "${tournament.name}" has STARTED! Please check your match schedule in the app.`;
        } else if (status === "Reset") {
            message = `The tournament "${tournament.name}" has been RESET by the organizer. All matches and entries have been cleared.`;
        } else {
            message = `The status of tournament "${tournament.name}" has changed to: ${status}.`;
        }
        
        const text = `Dear ${user.fullName},

${message}

Best regards,
The Pickleball Team`;

        const html = `<h3>Tournament Update</h3>
<p>Dear ${user.fullName},</p>
<p>${message}</p>
<p>Best regards,<br>The Pickleball Team</p>`;

        return sendEmail(user.email, subject, text, html);
    }
};

module.exports = emailService;
