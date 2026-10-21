const Notification = require("../models/Notification");
const User = require("../models/User");

// @desc    Send a notification to teacher(s)
// @route   POST /api/notifications
// @access  Private (Principal Only)
const sendNotification = async (req, res) => {
  try {
    const { title, message, priority, recipientType, recipientTeacherIds } = req.body;

    if (!title || !message || !recipientType) {
      return res.status(400).json({
        success: false,
        message: "Title, message, and recipientType are required.",
      });
    }

    let recipientList = [];

    if (recipientType === "ALL") {
      // Find all teachers (CLASS_INCHARGE or SUBJECT_TEACHER)
      const teachers = await User.find({
        role: { $in: ["CLASS_INCHARGE", "SUBJECT_TEACHER"] },
        isActive: true,
      });

      recipientList = teachers.map((t) => ({
        teacher: t._id,
        isRead: false,
        readAt: null,
      }));
    } else if (recipientType === "INDIVIDUAL" || recipientType === "MULTIPLE") {
      if (!recipientTeacherIds || !Array.isArray(recipientTeacherIds) || recipientTeacherIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please select at least one teacher recipient.",
        });
      }

      recipientList = recipientTeacherIds.map((id) => ({
        teacher: id,
        isRead: false,
        readAt: null,
      }));
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid recipientType. Must be ALL, INDIVIDUAL, or MULTIPLE.",
      });
    }

    if (recipientList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No active teachers found matching recipient selection.",
      });
    }

    const notification = await Notification.create({
      sender: req.user._id,
      senderName: req.user.name || "Principal / Administration",
      title,
      message,
      priority: priority || "Normal",
      recipientType,
      recipients: recipientList,
    });

    // ── Real-time Socket.IO delivery ───────────────────────────────────────
    const io = req.app.get("io");
    if (io) {
      const payload = {
        _id: notification._id,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        senderName: notification.senderName,
        createdAt: notification.createdAt,
        isRead: false,
        readAt: null,
      };

      // Emit to each recipient's personal room
      recipientList.forEach((r) => {
        io.to(`user_${r.teacher}`).emit("new_notification", payload);
      });
    }
    // ──────────────────────────────────────────────────────────────────────

    res.status(201).json({
      success: true,
      message: `Notification sent to ${recipientList.length} teacher(s).`,
      data: notification,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({
      success: false,
      message: "Server error while sending notification.",
      error: error.message,
    });
  }
};

// @desc    Get notifications for logged-in teacher
// @route   GET /api/notifications/teacher
// @access  Private (Teachers: CLASS_INCHARGE, SUBJECT_TEACHER)
const getTeacherNotifications = async (req, res) => {
  try {
    const teacherId = req.user._id;

    // Find notifications where recipients array contains teacherId
    const notifications = await Notification.find({
      "recipients.teacher": teacherId,
    })
      .sort({ createdAt: -1 });

    // Calculate unread count and format item per teacher
    let unreadCount = 0;
    const formattedNotifications = notifications.map((notif) => {
      const recipientInfo = notif.recipients.find(
        (r) => r.teacher.toString() === teacherId.toString()
      );
      if (recipientInfo && !recipientInfo.isRead) {
        unreadCount++;
      }

      return {
        _id: notif._id,
        title: notif.title,
        message: notif.message,
        priority: notif.priority,
        senderName: notif.senderName,
        createdAt: notif.createdAt,
        isRead: recipientInfo ? recipientInfo.isRead : false,
        readAt: recipientInfo ? recipientInfo.readAt : null,
      };
    });

    res.status(200).json({
      success: true,
      unreadCount,
      count: formattedNotifications.length,
      data: formattedNotifications,
    });
  } catch (error) {
    console.error("Error fetching teacher notifications:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching notifications.",
      error: error.message,
    });
  }
};

// @desc    Get sent notifications history (Principal Only)
// @route   GET /api/notifications/sent
// @access  Private (Principal Only)
const getSentNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ sender: req.user._id })
      .populate("recipients.teacher", "name email role assignedClass")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    console.error("Error fetching sent notifications:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching sent notifications.",
      error: error.message,
    });
  }
};

// @desc    Mark a notification as read for logged-in teacher
// @route   PUT /api/notifications/:id/read
// @access  Private (Teachers)
const markAsRead = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const notificationId = req.params.id;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    const recipientIndex = notification.recipients.findIndex(
      (r) => r.teacher.toString() === teacherId.toString()
    );

    if (recipientIndex === -1) {
      return res.status(403).json({
        success: false,
        message: "You are not a recipient of this notification.",
      });
    }

    notification.recipients[recipientIndex].isRead = true;
    notification.recipients[recipientIndex].readAt = new Date();

    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read.",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Server error while marking notification as read.",
      error: error.message,
    });
  }
};

// @desc    Get unread notification count for logged-in teacher (for polling)
// @route   GET /api/notifications/unread-count
// @access  Private (Teachers)
const getUnreadCount = async (req, res) => {
  try {
    const teacherId = req.user._id;

    const notifications = await Notification.find({
      "recipients.teacher": teacherId,
      "recipients": {
        $elemMatch: {
          teacher: teacherId,
          isRead: false,
        },
      },
    });

    res.status(200).json({
      success: true,
      unreadCount: notifications.length,
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching unread count.",
      error: error.message,
    });
  }
};

module.exports = {
  sendNotification,
  getTeacherNotifications,
  getSentNotifications,
  markAsRead,
  getUnreadCount,
};
