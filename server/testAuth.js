require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const generateToken = require("./utils/generateToken");
const jwt = require("jsonwebtoken");

async function testAuth() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB for testing.");

  const principal = await User.findOne({ email: "principal@school.com" }).select("+password");
  if (!principal) {
    console.error("Principal user not found!");
    process.exit(1);
  }

  console.log("Found Principal user:", principal.name, principal.email, principal.role, "isActive:", principal.isActive);
  
  // Test password matching
  const isMatch = await principal.matchPassword("Principal@123");
  console.log("Password match test ('Principal@123'):", isMatch ? "SUCCESS ✅" : "FAILED ❌");

  const isWrongMatch = await principal.matchPassword("WrongPassword");
  console.log("Wrong password test ('WrongPassword'):", !isWrongMatch ? "SUCCESS (Rejected) ✅" : "FAILED ❌");

  // Test token generation
  const token = generateToken(principal._id, principal.role);
  console.log("Generated Token:", token ? "SUCCESS ✅" : "FAILED ❌");

  // Test token verification
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log("Decoded Payload:", decoded);

  await mongoose.disconnect();
  console.log("All Auth tests completed successfully!");
}

testAuth().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
