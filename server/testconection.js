const mongoose = require("mongoose");
require("dotenv").config();

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Full Error:");
    console.error(error);
    process.exit(1);
  }
}

testConnection();