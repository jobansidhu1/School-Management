const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
    },
    classStandard: {
      type: String,
      trim: true,
    },
    section: {
      type: String,
      trim: true,
      default: "A",
    },
    classRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },
    teacher: {
      type: String,
      trim: true,
    },
    maxMarks: {
      type: Number,
      default: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", subjectSchema);
