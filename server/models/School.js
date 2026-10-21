const mongoose = require("mongoose");

const schoolSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "School name is required"],
      trim: true,
      default: "Delhi Public School",
    },
    code: {
      type: String,
      trim: true,
      default: "DPS-1002",
    },
    affiliationNumber: {
      type: String,
      trim: true,
      default: "CBSE/AFF/2025-26/0942",
    },
    board: {
      type: String,
      trim: true,
      default: "CBSE",
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "principal@school.com",
    },
    contactNumber: {
      type: String,
      trim: true,
      default: "+91 98765 43210",
    },
    address: {
      type: String,
      trim: true,
      default: "123 Knowledge Park, Education Hub",
    },
    city: {
      type: String,
      trim: true,
      default: "New Delhi",
    },
    state: {
      type: String,
      trim: true,
      default: "Delhi",
    },
    pincode: {
      type: String,
      trim: true,
      default: "110001",
    },
    website: {
      type: String,
      trim: true,
      default: "https://school.edu",
    },
    principalName: {
      type: String,
      trim: true,
      default: "Principal Admin",
    },
    currentSession: {
      type: String,
      trim: true,
      default: "2025-2026",
    },
    academicSessions: {
      type: [
        {
          name: { type: String, required: true, trim: true },
          isCurrent: { type: Boolean, default: false },
          startDate: { type: Date, default: null },
          endDate: { type: Date, default: null },
        },
      ],
      default: [
        { name: "2024-2025", isCurrent: false },
        { name: "2025-2026", isCurrent: true },
        { name: "2026-2027", isCurrent: false },
      ],
    },
    term: {
      type: String,
      trim: true,
      default: "Term 1",
    },
    passingPercentage: {
      type: String,
      trim: true,
      default: "33%",
    },
    resultPublishing: {
      type: String,
      trim: true,
      default: "Manual Review Required",
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    autoBackup: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("School", schoolSchema);
