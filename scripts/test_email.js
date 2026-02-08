require('dotenv').config();
const emailService = require('../src/emailService');

async function testEmail() {
    console.log("Starting email test...");
    
    const dummyUser = {
        email: "veteranpickle@gmail.com",
        fullName: "Test User",
        preferredNotificationChannel: "Email"
    };

    try {
        const info = await emailService.sendWelcomeEmail(dummyUser);
        console.log("Email test completed.");
        console.log("Info:", info);
    } catch (error) {
        console.error("Failed to send email:", error);
    }
}

testEmail();
