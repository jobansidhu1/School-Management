const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getMarksByStudent,
  getMyMarks,
  getMyAcademics,
  createMarks,
  updateMarks,
  deleteMarks,
  getClassDailyAttendance,
  getClassMonthlyAttendance,
  getAttendanceByStudent,
  getMyAttendance,
  markAttendance,
  bulkMarkAttendance,
  deleteAttendance,
} = require("../controllers/academicController");

router.use(protect);

// ─── Student Portal Academic Overview ─────────────────────────────────────────
router.get("/my-academics", getMyAcademics);

// ─── Subject Routes ────────────────────────────────────────────────────────────
router.get("/subjects", getAllSubjects);
router.post("/subjects", createSubject);
router.put("/subjects/:id", updateSubject);
router.delete("/subjects/:id", deleteSubject);

// ─── Marks Routes ─────────────────────────────────────────────────────────────
router.get("/marks/me", getMyMarks);                          // student: own marks
router.get("/marks/student/:studentId", getMarksByStudent);  // incharge/teacher: specific student
router.post("/marks", createMarks);
router.put("/marks/:id", updateMarks);
router.delete("/marks/:id", deleteMarks);

// ─── Attendance Routes ────────────────────────────────────────────────────────
router.get("/attendance/daily", getClassDailyAttendance);             // class daily attendance roster & metrics
router.get("/attendance/monthly", getClassMonthlyAttendance);         // class/student monthly attendance summary & rates
router.get("/attendance/me", getMyAttendance);                        // student: own attendance
router.get("/attendance/student/:studentId", getAttendanceByStudent); // authorized faculty: specific student
router.post("/attendance", markAttendance);                           // single record or correction
router.post("/attendance/bulk", bulkMarkAttendance);                  // bulk class daily records
router.delete("/attendance/:id", deleteAttendance);

module.exports = router;
