const express = require("express");
const router = express.Router();
const {
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkImportStudents,
} = require("../controllers/studentController");
const { protect } = require("../middleware/authMiddleware");

// Middleware to protect all student routes
router.use(protect);

router.route("/")
  .get(getAllStudents)
  .post(createStudent);

router.post("/bulk-import", bulkImportStudents);

router.route("/:id")
  .put(updateStudent)
  .delete(deleteStudent);

module.exports = router;
