require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const connectDB = require("../config/db");

const User = require("../models/User");
const Salon = require("../models/Salon");
const Service = require("../models/Service");
const Slot = require("../models/Slot");
const Booking = require("../models/Booking");

async function resetTestData() {
  console.log("WARNING: This will delete all existing UrbanGlow users and salons.");
  console.log("================================================================");

  await connectDB();

  try {
    const userCountBefore = await User.countDocuments();
    const salonCountBefore = await Salon.countDocuments();
    const serviceCountBefore = await Service.countDocuments();
    const slotCountBefore = await Slot.countDocuments();
    const bookingCountBefore = await Booking.countDocuments();

    console.log("\n--- BEFORE CLEANUP ---");
    console.log(`Users: ${userCountBefore}`);
    console.log(`Salons: ${salonCountBefore}`);
    console.log(`Services: ${serviceCountBefore}`);
    console.log(`Slots: ${slotCountBefore}`);
    console.log(`Bookings: ${bookingCountBefore}`);

    const userIds = await User.find({}, "_id").lean();
    const salonIds = await Salon.find({}, "_id").lean();

    const userIdSet = new Set(userIds.map(u => u._id.toString()));
    const salonIdSet = new Set(salonIds.map(s => s._id.toString()));

    const servicesWithOrphanSalon = await Service.countDocuments({
      salonId: { $in: [...salonIdSet] },
    });
    const slotsWithOrphanSalon = await Slot.countDocuments({
      salonId: { $in: [...salonIdSet] },
    });
    const bookingsWithOrphanCustomer = await Booking.countDocuments({
      customerId: { $in: [...userIdSet] },
    });
    const bookingsWithOrphanSalon = await Booking.countDocuments({
      salonId: { $in: [...salonIdSet] },
    });
    const bookingsWithOrphanService = await Booking.countDocuments({
      serviceId: { $exists: true },
    });
    const bookingsWithOrphanSlot = await Booking.countDocuments({
      slotId: { $exists: true },
    });

    console.log("\n--- DEPENDENCY CHECK (records that will reference deleted data) ---");
    console.log(`Services referencing deleted salons: ${servicesWithOrphanSalon}`);
    console.log(`Slots referencing deleted salons: ${slotsWithOrphanSalon}`);
    console.log(`Bookings referencing deleted customers: ${bookingsWithOrphanCustomer}`);
    console.log(`Bookings referencing deleted salons: ${bookingsWithOrphanSalon}`);
    console.log(`Bookings referencing any service: ${bookingsWithOrphanService}`);
    console.log(`Bookings referencing any slot: ${bookingsWithOrphanSlot}`);

    console.log("\n--- DELETING USERS AND SALONS ---");
    const userDeleteResult = await User.deleteMany({});
    const salonDeleteResult = await Salon.deleteMany({});

    console.log(`Users deleted: ${userDeleteResult.deletedCount}`);
    console.log(`Salons deleted: ${salonDeleteResult.deletedCount}`);

    const userCountAfter = await User.countDocuments();
    const salonCountAfter = await Salon.countDocuments();

    console.log("\n--- AFTER CLEANUP ---");
    console.log(`Remaining users: ${userCountAfter}`);
    console.log(`Remaining salons: ${salonCountAfter}`);

    console.log("\n================================================================");
    console.log("CLEANUP COMPLETE");
    console.log("================================================================");
    console.log("NOTE: Services, Slots, and Bookings were NOT deleted.");
    console.log("They may now reference non-existent users/salons.");
    console.log("Delete them manually if needed for a completely clean slate.");

  } catch (error) {
    console.error("ERROR during cleanup:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\nMongoDB connection closed.");
    process.exit(0);
  }
}

resetTestData();