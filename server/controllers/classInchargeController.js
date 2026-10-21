const User = require("../models/User");
const Class = require("../models/Class");
const TeacherAssignment = require("../models/TeacherAssignment");
const Teacher = require("../models/Teacher");

const { syncTeacherAssignmentsToTeacherDoc } = require("../utils/syncHelper");

// Helper: find the assigned class for a class incharge user
const findAssignedClass = async (userId, assignedClassFromUser) => {
  // 1. Class where classIncharge = userId
  let assignedClass = await Class.findOne({ classIncharge: userId });
  let assignedSection = null;

  // 2. Class where a section's classIncharge = userId
  if (!assignedClass) {
    const classWithSection = await Class.findOne({ "sections.classIncharge": userId });
    if (classWithSection) {
      assignedClass = classWithSection;
      const sec = classWithSection.sections.find(
        (s) => s.classIncharge && s.classIncharge.toString() === userId.toString()
      );
      if (sec) assignedSection = sec.name;
    }
  }

  // 3. Fallback: user.assignedClass field
  if (!assignedClass && assignedClassFromUser) {
    assignedClass = await Class.findById(assignedClassFromUser);
  }

  return { assignedClass, assignedSection };
};

// @desc    Get Class Incharge Dashboard details & assigned class metrics
// @route   GET /api/class-incharge/dashboard
// @access  Private (CLASS_INCHARGE only)
const getClassInchargeDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const { assignedClass, assignedSection } = await findAssignedClass(userId, req.user.assignedClass);

    let subjectTeachers = [];
    if (assignedClass) {
      const query = { class: assignedClass._id };
      if (assignedSection) query.section = assignedSection;

      // Populate teacher from Teacher collection with teacherId
      const assignments = await TeacherAssignment.find(query)
        .populate("teacher", "fullName email role accountStatus teacherId")
        .sort({ subject: 1 });

      subjectTeachers = assignments.map((a) => ({
        assignmentId: a._id,
        subject: a.subject,
        section: a.section,
        academicYear: a.academicYear,
        teacher: a.teacher
          ? {
              _id: a.teacher._id,
              teacherId: a.teacher.teacherId || "N/A",
              name: a.teacher.fullName,
              email: a.teacher.email,
              role: a.teacher.role,
              isActive: a.teacher.accountStatus !== "Inactive",
            }
          : null,
      }));
    }

    return res.status(200).json({
      success: true,
      incharge: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        isActive: req.user.isActive,
      },
      assignedClass: assignedClass
        ? {
            _id: assignedClass._id,
            name: assignedClass.name,
            grade: assignedClass.grade,
            section: assignedSection || assignedClass.section,
            academicYear: assignedClass.academicYear,
          }
        : null,
      subjectTeachers,
      totalSubjectTeachers: subjectTeachers.length,
    });
  } catch (error) {
    console.error("getClassInchargeDashboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Class Incharge dashboard.",
      error: error.message,
    });
  }
};

// @desc    Assign subject teacher
// @route   POST /api/class-incharge/assign-teacher
// @access  Private (CLASS_INCHARGE only)
const assignSubjectTeacher = async (req, res) => {
  try {
    const { subject, teacherId } = req.body;
    const userId = req.user._id;

    if (!subject || !teacherId) {
      return res.status(400).json({ success: false, message: "Subject and teacherId are required." });
    }

    const { assignedClass, assignedSection } = await findAssignedClass(userId, req.user.assignedClass);
    if (!assignedClass) {
      return res.status(404).json({ success: false, message: "No class assigned to you." });
    }

    // Validate that the teacherId is a valid Teacher document
    const teacherDoc = await Teacher.findById(teacherId);
    if (!teacherDoc) {
      return res.status(404).json({ success: false, message: "Teacher not found." });
    }

    const sectionName = assignedSection || assignedClass.section || "A";

    // Upsert: find existing by class+section+subject, update teacher; or create new
    let assignment = await TeacherAssignment.findOne({
      class: assignedClass._id,
      section: sectionName,
      subject: subject,
    });

    if (assignment) {
      assignment.teacher = teacherDoc._id;
      await assignment.save();
    } else {
      assignment = new TeacherAssignment({
        class: assignedClass._id,
        section: sectionName,
        teacher: teacherDoc._id,
        subject: subject,
        academicYear: assignedClass.academicYear || "2025-2026",
      });
      await assignment.save();
    }

    // Sync active subjects to Teacher model
    await syncTeacherAssignmentsToTeacherDoc(teacherDoc._id);

    return res.status(200).json({
      success: true,
      message: "Teacher assigned successfully",
      assignment: {
        assignmentId: assignment._id,
        subject: assignment.subject,
        section: assignment.section,
        academicYear: assignment.academicYear,
        teacher: {
          _id: teacherDoc._id,
          teacherId: teacherDoc.teacherId || "N/A",
          name: teacherDoc.fullName,
          email: teacherDoc.email,
          role: teacherDoc.role,
          isActive: teacherDoc.accountStatus !== "Inactive",
        },
      },
    });
  } catch (error) {
    console.error("assignSubjectTeacher error:", error);
    return res.status(500).json({ success: false, message: "Failed to assign teacher", error: error.message });
  }
};

// @desc    Get subjects for the incharge's assigned class
// @route   GET /api/class-incharge/subjects
// @access  Private (CLASS_INCHARGE only)
const getSubjects = async (req, res) => {
  try {
    const userId = req.user._id;
    const { assignedClass } = await findAssignedClass(userId, req.user.assignedClass);
    if (!assignedClass) {
      return res.status(404).json({ success: false, message: "No class assigned to you." });
    }
    return res.status(200).json({ success: true, subjects: assignedClass.subjects || [] });
  } catch (error) {
    console.error("getSubjects error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch subjects.", error: error.message });
  }
};

// @desc    Create (add) a subject to the incharge's class
// @route   POST /api/class-incharge/subjects
// @access  Private (CLASS_INCHARGE only)
const createSubject = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Subject name is required." });
    }
    const userId = req.user._id;
    const { assignedClass } = await findAssignedClass(userId, req.user.assignedClass);
    if (!assignedClass) {
      return res.status(404).json({ success: false, message: "No class assigned to you." });
    }
    const trimmed = name.trim();
    if (assignedClass.subjects.includes(trimmed)) {
      return res.status(400).json({ success: false, message: "Subject already exists." });
    }
    assignedClass.subjects.push(trimmed);
    await assignedClass.save();
    return res.status(201).json({ success: true, message: "Subject added.", subjects: assignedClass.subjects });
  } catch (error) {
    console.error("createSubject error:", error);
    return res.status(500).json({ success: false, message: "Failed to add subject.", error: error.message });
  }
};

// @desc    Update (rename) a subject in the incharge's class
// @route   PUT /api/class-incharge/subjects/:index
// @access  Private (CLASS_INCHARGE only)
const updateSubject = async (req, res) => {
  try {
    const { index } = req.params;
    const { name } = req.body;
    const idx = parseInt(index, 10);
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "New subject name is required." });
    }
    const userId = req.user._id;
    const { assignedClass } = await findAssignedClass(userId, req.user.assignedClass);
    if (!assignedClass) {
      return res.status(404).json({ success: false, message: "No class assigned to you." });
    }
    if (idx < 0 || idx >= assignedClass.subjects.length) {
      return res.status(400).json({ success: false, message: "Invalid subject index." });
    }
    const trimmed = name.trim();
    if (assignedClass.subjects.includes(trimmed) && assignedClass.subjects[idx] !== trimmed) {
      return res.status(400).json({ success: false, message: "Another subject with this name already exists." });
    }
    assignedClass.subjects[idx] = trimmed;
    assignedClass.markModified("subjects");
    await assignedClass.save();
    return res.status(200).json({ success: true, message: "Subject updated.", subjects: assignedClass.subjects });
  } catch (error) {
    console.error("updateSubject error:", error);
    return res.status(500).json({ success: false, message: "Failed to update subject.", error: error.message });
  }
};

// @desc    Delete a subject from the incharge's class
// @route   DELETE /api/class-incharge/subjects/:index
// @access  Private (CLASS_INCHARGE only)
const deleteSubject = async (req, res) => {
  try {
    const { index } = req.params;
    const idx = parseInt(index, 10);
    const userId = req.user._id;
    const { assignedClass } = await findAssignedClass(userId, req.user.assignedClass);
    if (!assignedClass) {
      return res.status(404).json({ success: false, message: "No class assigned to you." });
    }
    if (idx < 0 || idx >= assignedClass.subjects.length) {
      return res.status(400).json({ success: false, message: "Invalid subject index." });
    }
    assignedClass.subjects.splice(idx, 1);
    assignedClass.markModified("subjects");
    await assignedClass.save();
    return res.status(200).json({ success: true, message: "Subject deleted.", subjects: assignedClass.subjects });
  } catch (error) {
    console.error("deleteSubject error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete subject.", error: error.message });
  }
};
// @desc    Create credentials (User account) for an assigned subject teacher
// @route   POST /api/class-incharge/create-credentials
// @access  Private (CLASS_INCHARGE only)
const createTeacherCredentials = async (req, res) => {
  try {
    const { teacherId, password } = req.body;
    if (!teacherId || !password) {
      return res.status(400).json({ success: false, message: "Teacher selection and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found." });
    }

    // Check if User already exists for this email
    let user = await User.findOne({ email: teacher.email });
    if (user) {
      // Just update password if user exists
      user.password = password;
      await user.save();
    } else {
      user = new User({
        name: teacher.fullName,
        email: teacher.email,
        password: password,
        role: "SUBJECT_TEACHER",
        isActive: true,
      });
      await user.save();
    }

    // Link user to teacher if not linked
    if (teacher.userRef?.toString() !== user._id.toString()) {
      teacher.userRef = user._id;
      await teacher.save();
    }

    return res.status(200).json({
      success: true,
      message: "Teacher credentials created/updated successfully.",
    });
  } catch (error) {
    console.error("createTeacherCredentials error:", error);
    return res.status(500).json({ success: false, message: "Failed to create credentials.", error: error.message });
  }
};

module.exports = {
  getClassInchargeDashboard,
  assignSubjectTeacher,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  createTeacherCredentials,
};
