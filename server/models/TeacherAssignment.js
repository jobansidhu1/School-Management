const mongoose = require("mongoose");

const teacherAssignmentSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class is required"],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: [true, "Teacher is required"],
    },
    section: {
      type: String,
      default: "A",
      trim: true,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },
    academicYear: {
      type: String,
      default: "2025-2026",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a subject is assigned once per class per section for a given academic year
teacherAssignmentSchema.index({ class: 1, section: 1, subject: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model("TeacherAssignment", teacherAssignmentSchema);
