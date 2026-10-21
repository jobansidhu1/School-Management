const express = require("express");
const router = express.Router();
const {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  bulkImportTeachers,
} = require("../controllers/teacherController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router.use(protect);

// Allow both PRINCIPAL and CLASS_INCHARGE to view teachers
router.get("/", authorize("PRINCIPAL", "CLASS_INCHARGE"), getAllTeachers);

// Allow both PRINCIPAL and CLASS_INCHARGE to create teachers
router.post("/", authorize("PRINCIPAL", "CLASS_INCHARGE"), createTeacher);

// Rest require PRINCIPAL role
router.use(authorize("PRINCIPAL"));

router.post("/bulk-import", bulkImportTeachers);

router.route("/:id")
  .get(getTeacherById)
  .put(updateTeacher)
  .delete(deleteTeacher);

module.exports = router;
