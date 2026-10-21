const express = require("express");
const router = express.Router();
const { getTeacherDashboard } = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.use(protect);

router.get(
  "/teacher",
  authorize("SUBJECT_TEACHER", "CLASS_INCHARGE", "PRINCIPAL"),
  getTeacherDashboard
);

module.exports = router;
