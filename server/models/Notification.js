const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: {
      type: String,
      default: "Principal / Administration",
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },
    priority: {
      type: String,
      enum: ["Normal", "Important", "Urgent"],
      default: "Normal",
    },
    recipientType: {
      type: String,
      enum: ["ALL", "INDIVIDUAL", "MULTIPLE"],
      required: true,
    },
    recipients: [
      {
        teacher: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        isRead: {
          type: Boolean,
          default: false,
        },
        readAt: {
          type: Date,
          default: null,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
