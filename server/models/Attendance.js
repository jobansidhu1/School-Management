const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      trim: true,
    },
    studentRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },
    classStandard: {
      type: String,
      trim: true,
    },
    section: {
      type: String,
      trim: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "Half Day"],
      required: true,
      default: "Present",
    },
    subject: {
      type: String,
      trim: true,
      default: "",
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    markedBy: {
      type: String,
      trim: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    recordingUserId: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Compound index to guarantee uniqueness of student attendance per date
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
// Index for fast query by class, section and date
attendanceSchema.index({ classStandard: 1, section: 1, date: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
