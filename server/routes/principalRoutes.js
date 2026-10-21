const express = require("express");
const router = express.Router();
const {
  getAllClasses,
  getClassById,
  updateClassSections,
  createClassIncharge,
  getAllClassIncharges,
  getClassInchargeById,
  updateClassIncharge,
  deleteClassIncharge,
  assignClassIncharge,
  assignSubjectTeacher,
  deleteSubjectTeacher,
  getSchoolSettings,
  updateSchoolSettings,
  addAcademicSession,
} = require("../controllers/principalController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// All routes require authentication and PRINCIPAL role authorization
router.use(protect);
router.use(authorize("PRINCIPAL"));

// School & Academic Session routes
router.get("/school", getSchoolSettings);
router.put("/school", updateSchoolSettings);
router.post("/academic-sessions", addAcademicSession);

// Class routes
router.get("/classes", getAllClasses);
router.get("/classes/:id", getClassById);
router.put("/classes/:id/sections", updateClassSections);
router.put("/classes/:id/incharge", assignClassIncharge);
router.post("/classes/:id/subject-teachers", assignSubjectTeacher);
router.delete("/classes/:id/subject-teachers/:assignmentId", deleteSubjectTeacher);

// Class Incharge CRUD routes
router.route("/class-incharges")
  .get(getAllClassIncharges)
  .post(createClassIncharge);

router.route("/class-incharges/:id")
  .get(getClassInchargeById)
  .put(updateClassIncharge)
  .delete(deleteClassIncharge);

module.exports = router;
