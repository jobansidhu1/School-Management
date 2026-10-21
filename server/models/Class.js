const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Class name is required"],
      trim: true,
      unique: true,
    },
    grade: {
      type: String,
      required: [true, "Grade level is required"],
      trim: true,
    },
    section: {
      type: String,
      default: "A",
      trim: true,
    },
    hasSections: {
      type: Boolean,
      default: false,
    },
    sections: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        classIncharge: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
      },
    ],
    classIncharge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    academicYear: {
      type: String,
      default: "2025-2026",
    },
    subjects: {
      type: [String],
      default: [],
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

module.exports = mongoose.model("Class", classSchema);
