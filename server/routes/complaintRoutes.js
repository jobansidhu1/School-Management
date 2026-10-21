const express = require("express");
const router = express.Router();
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
} = require("../controllers/complaintController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// All routes require authentication
router.use(protect);

router.route("/")
  .post(createComplaint)
  .get(getComplaints);

router.route("/:id")
  .get(getComplaintById);

router.route("/:id/status")
  .put(authorize("PRINCIPAL"), updateComplaintStatus);

module.exports = router;
