const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminName = process.env.SUPER_ADMIN_NAME || "Principal Admin";
    const adminEmail = process.env.SUPER_ADMIN_EMAIL || "principal@school.com";
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD || "Principal@123";

    if (!adminEmail || !adminPassword) {
      console.error("Error: SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in .env file.");
      process.exit(1);
    }

    // Check if Principal account already exists
    const existingAdmin = await User.findOne({
      $or: [{ email: adminEmail.toLowerCase().trim() }, { role: "PRINCIPAL" }],
    });

    if (existingAdmin) {
      console.log(`Principal / Super Admin account already exists: (${existingAdmin.email})`);
      process.exit(0);
    }

    // Create Principal account
    const principal = new User({
      name: adminName,
      email: adminEmail.toLowerCase().trim(),
      password: adminPassword, // Will be hashed automatically by User pre-save hook
      role: "PRINCIPAL",
      isActive: true,
    });

    await principal.save();

    console.log("--------------------------------------------------");
    console.log("Super Admin / Principal account successfully created!");
    console.log(`Name  : ${principal.name}`);
    console.log(`Email : ${principal.email}`);
    console.log(`Role  : ${principal.role}`);
    console.log("--------------------------------------------------");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding Principal account:", error);
    process.exit(1);
  }
};

seedAdmin();
