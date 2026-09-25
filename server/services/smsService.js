const twilio = require("twilio");

const loadConfig = () => {
  return {
    provider: process.env.SMS_PROVIDER || "development",
    apiKey: process.env.SMS_API_KEY,
    apiSecret: process.env.SMS_API_SECRET,
    senderId: process.env.SMS_SENDER_ID,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
  };
};

const config = loadConfig();

const sendSMS = async ({ phone, message }) => {
  if (config.provider === "twilio" && config.twilioAccountSid && config.twilioAuthToken && config.twilioPhoneNumber) {
    const twilio = require("twilio");
    const client = twilio(config.twilioAccountSid, config.twilioAuthToken);

    await client.messages.create({
      body: message,
      from: config.twilioPhoneNumber,
      to: phone,
    });
  } else {
    // Development fallback: print OTP clearly in backend console.
    // Do not pretend an SMS was sent.
    console.log(`[SMS DEV MODE] To: ${phone} | Message: ${message}`);
  }
};

module.exports = { sendSMS };