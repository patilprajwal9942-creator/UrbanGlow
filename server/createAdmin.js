require("dotenv").config();

const mongoose = require("mongoose");

const connectDB = require("./config/db");
const Admin = require("./models/admin.js");

const createAdmin = async () => {
  try {
    // ==========================================
    // Check Required Environment Variables
    // ==========================================

    const requiredEnvVariables = [
      "MONGO_URI",
      "ADMIN_NAME",
      "ADMIN_EMAIL",
      "ADMIN_PASSWORD",
    ];

    for (const variable of requiredEnvVariables) {
      if (!process.env[variable]) {
        throw new Error(
          `${variable} is missing in the .env file`
        );
      }
    }

    // ==========================================
    // Connect Database
    // ==========================================

    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL
      .trim()
      .toLowerCase();

    // ==========================================
    // Check Existing Admin
    // ==========================================

    const existingAdmin = await Admin.findOne({
      email: adminEmail,
    });

    if (existingAdmin) {
      console.log(
        "\n⚠️ Admin already exists with this email"
      );

      console.log(`Email: ${adminEmail}`);
      console.log("No changes made.");

      return;
    }

    // ==========================================
    // Create Admin
    // ==========================================

    const admin = await Admin.create({
      name: process.env.ADMIN_NAME.trim(),

      email: adminEmail,

      password: process.env.ADMIN_PASSWORD,

      isActive: true,
    });

    // ==========================================
    // Success Message
    // ==========================================

    console.log("\n=================================");
    console.log("✅ ADMIN CREATED SUCCESSFULLY");
    console.log("=================================");

    console.log(`Name: ${admin.name}`);
    console.log(`Email: ${admin.email}`);

    console.log("Collection: admins");

    console.log("=================================");

  } catch (error) {

    console.error(
      "\n❌ Failed to create admin:"
    );

    console.error(error.message);

    process.exitCode = 1;

  } finally {

    // ==========================================
    // Disconnect Database
    // ==========================================

    if (mongoose.connection.readyState !== 0) {

      await mongoose.disconnect();

      console.log("\nMongoDB disconnected");
    }
  }
};

createAdmin();