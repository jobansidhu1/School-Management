const express = require("express");
const router = express.Router();
const {
  sendNotification,
  getTeacherNotifications,
  getSentNotifications,
  markAsRead,
  getUnreadCount,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// All routes require authentication
router.use(protect);

router.post("/", authorize("PRINCIPAL"), sendNotification);
router.get("/sent", authorize("PRINCIPAL"), getSentNotifications);

router.get("/teacher", authorize("CLASS_INCHARGE", "SUBJECT_TEACHER"), getTeacherNotifications);
router.get("/unread-count", authorize("CLASS_INCHARGE", "SUBJECT_TEACHER"), getUnreadCount);
router.put("/:id/read", authorize("CLASS_INCHARGE", "SUBJECT_TEACHER"), markAsRead);

module.exports = router;
