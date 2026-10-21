const mongoose = require("mongoose");

const marksSchema = new mongoose.Schema(
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
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    subjectRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
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
    examType: {
      type: String,
      enum: ["Unit Test", "Mid Term", "Final Exam", "Assignment", "Quiz", "Practical"],
      default: "Unit Test",
    },
    marksObtained: {
      type: Number,
      required: true,
      min: 0,
    },
    maxMarks: {
      type: Number,
      required: true,
      default: 100,
    },
    examDate: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Marks", marksSchema);
