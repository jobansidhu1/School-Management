const Teacher = require("../models/Teacher");
const TeacherAssignment = require("../models/TeacherAssignment");

// @desc    Get teacher dashboard data
// @route   GET /api/dashboard/teacher
// @access  Private (SUBJECT_TEACHER, CLASS_INCHARGE, PRINCIPAL)
const getTeacherDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find the teacher profile associated with the logged-in user
    const teacher = await Teacher.findOne({ userRef: userId });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found.",
      });
    }

    // Find all assignments for this teacher and populate class details
    // We want to get class names, sections, and the class incharge
    const assignments = await TeacherAssignment.find({ teacher: teacher._id })
      .populate({
        path: "class",
        select: "name grade sections classIncharge",
        populate: {
          path: "classIncharge sections.classIncharge",
          select: "name email"
        }
      });

    return res.status(200).json({
      success: true,
      teacher: {
        _id: teacher._id,
        teacherId: teacher.teacherId,
        fullName: teacher.fullName,
        email: teacher.email,
        assignedSubjects: teacher.assignedSubjects,
        assignedClass: teacher.assignedClass,
        department: teacher.department,
        designation: teacher.designation,
      },
      assignments: assignments.map(a => ({
        _id: a._id,
        subject: a.subject,
        section: a.section,
        classDetails: a.class,
      })),
    });
  } catch (error) {
    console.error("getTeacherDashboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch teacher dashboard data.",
      error: error.message,
    });
  }
};

module.exports = {
  getTeacherDashboard,
};
