const express = require("express");
const router = express.Router();
const {
  getClassInchargeDashboard,
  assignSubjectTeacher,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  createTeacherCredentials,
} = require("../controllers/classInchargeController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// All routes require authentication and CLASS_INCHARGE role authorization
router.use(protect);
router.use(authorize("CLASS_INCHARGE"));

// @route   GET /api/class-incharge/dashboard
router.get("/dashboard", getClassInchargeDashboard);

// @route   POST /api/class-incharge/assign-teacher
router.post("/assign-teacher", assignSubjectTeacher);

// @route   POST /api/class-incharge/create-credentials
router.post("/create-credentials", createTeacherCredentials);

// Subject CRUD routes
router.get("/subjects", getSubjects);
router.post("/subjects", createSubject);
router.put("/subjects/:index", updateSubject);
router.delete("/subjects/:index", deleteSubject);

module.exports = router;
