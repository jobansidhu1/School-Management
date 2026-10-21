const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
  {
    teacherId: {
      type: String,
      required: [true, "Teacher ID is required"],
      unique: true,
      trim: true,
    },
    employeeCode: {
      type: String,
      trim: true,
      default: "",
    },
    fullName: {
      type: String,
      required: [true, "Full Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    contactNumber: {
      type: String,
      trim: true,
      default: "",
    },
    alternateContactNumber: {
      type: String,
      trim: true,
      default: "",
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", ""],
      default: "",
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    qualification: {
      type: String,
      trim: true,
      default: "",
    },
    specialization: {
      type: String,
      trim: true,
      default: "",
    },
    experience: {
      type: String,
      trim: true,
      default: "",
    },
    joiningDate: {
      type: Date,
      default: null,
    },
    designation: {
      type: String,
      trim: true,
      default: "Teacher",
    },
    role: {
      type: String,
      enum: ["SUBJECT_TEACHER", "CLASS_INCHARGE", "HEAD_OF_DEPARTMENT", "OTHER"],
      default: "SUBJECT_TEACHER",
    },
    assignedClass: {
      type: String,
      trim: true,
      default: "",
    },
    assignedSubjects: {
      type: [String],
      default: [],
    },
    department: {
      type: String,
      trim: true,
      default: "",
    },
    profilePhoto: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    state: {
      type: String,
      trim: true,
      default: "",
    },
    pincode: {
      type: String,
      trim: true,
      default: "",
    },
    username: {
      type: String,
      trim: true,
      default: "",
    },
    accountStatus: {
      type: String,
      enum: ["Active", "Inactive", "Pending", "Suspended"],
      default: "Active",
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    userRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Teacher", teacherSchema);
