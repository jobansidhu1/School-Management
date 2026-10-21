const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    complainant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    complainantName: {
      type: String,
      required: true,
      trim: true,
    },
    complainantRole: {
      type: String,
      enum: ["PRINCIPAL", "CLASS_INCHARGE", "SUBJECT_TEACHER", "STUDENT"],
      required: true,
    },
    classOrDepartment: {
      type: String,
      trim: true,
      default: "General",
    },
    category: {
      type: String,
      enum: [
        "Electricity Issue",
        "Water Problem",
        "Washroom Problem",
        "Classroom Issue",
        "Furniture Damage",
        "Cleanliness",
        "Fan/AC Issue",
        "Light Issue",
        "Internet/Network Problem",
        "Laboratory Issue",
        "Library Issue",
        "Safety Concern",
        "Other General Problem",
      ],
      required: [true, "Complaint category is required"],
    },
    subject: {
      type: String,
      required: [true, "Subject/Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Detailed description is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Rejected"],
      default: "Pending",
    },
    attachmentUrl: {
      type: String,
      default: "",
    },
    responseRemark: {
      type: String,
      default: "",
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["Pending", "In Progress", "Resolved", "Rejected"],
        },
        remark: {
          type: String,
          default: "",
        },
        updatedBy: {
          type: String,
          default: "System",
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Complaint", complaintSchema);
