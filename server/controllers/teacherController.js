const Teacher = require("../models/Teacher");
const User = require("../models/User");
const Class = require("../models/Class");
const TeacherAssignment = require("../models/TeacherAssignment");
const { syncTeacherToUserAndClass } = require("../utils/syncHelper");

// @desc    Get all teachers with search, filters, sorting, and pagination
// @route   GET /api/teachers
// @access  Private (PRINCIPAL only)
const getAllTeachers = async (req, res) => {
  try {
    const {
      search,
      gender,
      role,
      assignedClass,
      department,
      designation,
      accountStatus,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 100,
    } = req.query;

    const query = {};

    // Search term matching multiple fields
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { fullName: searchRegex },
        { teacherId: searchRegex },
        { email: searchRegex },
        { contactNumber: searchRegex },
        { employeeCode: searchRegex },
        { specialization: searchRegex },
        { department: searchRegex },
      ];
    }

    if (gender) query.gender = gender;
    if (role) query.role = role;
    if (assignedClass) query.assignedClass = new RegExp(`^${assignedClass.trim()}$`, "i");
    if (department) query.department = new RegExp(`^${department.trim()}$`, "i");
    if (designation) query.designation = new RegExp(`^${designation.trim()}$`, "i");
    if (accountStatus) query.accountStatus = accountStatus;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const totalTeachers = await Teacher.countDocuments(query);
    const teachers = await Teacher.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      total: totalTeachers,
      page: pageNum,
      totalPages: Math.ceil(totalTeachers / limitNum),
      teachers,
    });
  } catch (error) {
    console.error("getAllTeachers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch teachers.",
      error: error.message,
    });
  }
};

// @desc    Get teacher details by ID
// @route   GET /api/teachers/:id
// @access  Private (PRINCIPAL only)
const getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found.",
      });
    }

    return res.status(200).json({
      success: true,
      teacher,
    });
  } catch (error) {
    console.error("getTeacherById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch teacher details.",
      error: error.message,
    });
  }
};

// @desc    Create a new teacher record
// @route   POST /api/teachers
// @access  Private (PRINCIPAL only)
const createTeacher = async (req, res) => {
  try {
    const data = req.body;

    if (!data.teacherId || !data.fullName || !data.email) {
      return res.status(400).json({
        success: false,
        message: "Teacher ID, Full Name, and Email are required fields.",
      });
    }

    const normalizedEmail = data.email.toLowerCase().trim();
    const normalizedTeacherId = data.teacherId.trim();

    // Check duplicate Teacher ID or Email
    const existingTeacherId = await Teacher.findOne({ teacherId: normalizedTeacherId });
    if (existingTeacherId) {
      return res.status(400).json({
        success: false,
        message: `Teacher ID "${normalizedTeacherId}" already exists.`,
      });
    }

    const existingEmail = await Teacher.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: `Email "${normalizedEmail}" is already registered.`,
      });
    }

    if (data.employeeCode && data.employeeCode.trim()) {
      const existingEmpCode = await Teacher.findOne({ employeeCode: data.employeeCode.trim() });
      if (existingEmpCode) {
        return res.status(400).json({
          success: false,
          message: `Employee Code "${data.employeeCode.trim()}" already exists.`,
        });
      }
    }

    // Format array fields
    let assignedSubjects = [];
    if (Array.isArray(data.assignedSubjects)) {
      assignedSubjects = data.assignedSubjects.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof data.assignedSubjects === "string") {
      assignedSubjects = data.assignedSubjects.split(",").map((s) => s.trim()).filter(Boolean);
    }

    // Create user account if password provided
    let userRef = null;
    if (data.password && data.password.trim().length >= 6) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (!existingUser) {
        const newUser = new User({
          name: data.fullName.trim(),
          email: normalizedEmail,
          password: data.password,
          role: data.role === "CLASS_INCHARGE" ? "CLASS_INCHARGE" : "SUBJECT_TEACHER",
          isActive: data.accountStatus !== "Inactive" && data.accountStatus !== "Suspended",
        });
        await newUser.save();
        userRef = newUser._id;
      } else {
        userRef = existingUser._id;
      }
    }

    const newTeacher = new Teacher({
      ...data,
      teacherId: normalizedTeacherId,
      fullName: data.fullName.trim(),
      email: normalizedEmail,
      assignedSubjects,
      userRef,
    });

    await newTeacher.save();

    // Synchronize Class Incharge status & assignedClass across User and Class models
    await syncTeacherToUserAndClass(newTeacher, data.assignedClassId || data.assignedClass, data.assignedSection);

    return res.status(201).json({
      success: true,
      message: "Teacher created successfully.",
      teacher: newTeacher,
    });
  } catch (error) {
    console.error("createTeacher error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create teacher.",
      error: error.message,
    });
  }
};

// @desc    Update teacher record
// @route   PUT /api/teachers/:id
// @access  Private (PRINCIPAL only)
const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found.",
      });
    }

    // Check unique teacherId if changed
    if (data.teacherId && data.teacherId.trim() !== teacher.teacherId) {
      const existingId = await Teacher.findOne({ teacherId: data.teacherId.trim() });
      if (existingId) {
        return res.status(400).json({
          success: false,
          message: `Teacher ID "${data.teacherId.trim()}" is already in use.`,
        });
      }
    }

    // Check unique email if changed
    if (data.email && data.email.toLowerCase().trim() !== teacher.email) {
      const existingEmail = await Teacher.findOne({ email: data.email.toLowerCase().trim() });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: `Email "${data.email.toLowerCase().trim()}" is already in use.`,
        });
      }
    }

    // Format assignedSubjects
    if (data.assignedSubjects !== undefined) {
      if (Array.isArray(data.assignedSubjects)) {
        data.assignedSubjects = data.assignedSubjects.map((s) => String(s).trim()).filter(Boolean);
      } else if (typeof data.assignedSubjects === "string") {
        data.assignedSubjects = data.assignedSubjects.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }

    Object.assign(teacher, data);
    await teacher.save();

    // Synchronize Class Incharge role & class assignment across User and Class models
    await syncTeacherToUserAndClass(teacher, data.assignedClassId || data.assignedClass, data.assignedSection);

    return res.status(200).json({
      success: true,
      message: "Teacher record updated successfully.",
      teacher,
    });
  } catch (error) {
    console.error("updateTeacher error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update teacher record.",
      error: error.message,
    });
  }
};

// @desc    Delete teacher record
// @route   DELETE /api/teachers/:id
// @access  Private (PRINCIPAL only)
const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found.",
      });
    }

    // Delete associated User account if exists and unassign from classes & sections
    let userIdToDelete = teacher.userRef;
    if (!userIdToDelete && teacher.email) {
      const u = await User.findOne({ email: teacher.email.toLowerCase().trim() });
      if (u) userIdToDelete = u._id;
    }

    if (userIdToDelete) {
      await Class.updateMany({ classIncharge: userIdToDelete }, { classIncharge: null });
      await Class.updateMany(
        { "sections.classIncharge": userIdToDelete },
        { $set: { "sections.$[elem].classIncharge": null } },
        { arrayFilters: [{ "elem.classIncharge": userIdToDelete }] }
      );
      await User.findByIdAndDelete(userIdToDelete);
    }

    // Remove any subject teacher assignments for this teacher
    await TeacherAssignment.deleteMany({ teacher: id });

    await Teacher.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Teacher deleted successfully.",
    });
  } catch (error) {
    console.error("deleteTeacher error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete teacher record.",
      error: error.message,
    });
  }
};

// @desc    Bulk import extracted valid teacher records
// @route   POST /api/teachers/bulk-import
// @access  Private (PRINCIPAL only)
const bulkImportTeachers = async (req, res) => {
  try {
    const { teachers } = req.body;

    if (!Array.isArray(teachers) || teachers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid teacher records provided for import.",
      });
    }

    let insertedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (let index = 0; index < teachers.length; index++) {
      const item = teachers[index];

      if (!item.teacherId || !item.fullName || !item.email) {
        skippedCount++;
        errors.push(`Row ${index + 1}: Missing required fields (Teacher ID, Full Name, or Email).`);
        continue;
      }

      const normalizedTeacherId = String(item.teacherId).trim();
      const normalizedEmail = String(item.email).toLowerCase().trim();

      // Check existing teacherId or email in DB
      const existingTeacher = await Teacher.findOne({
        $or: [{ teacherId: normalizedTeacherId }, { email: normalizedEmail }],
      });

      if (existingTeacher) {
        skippedCount++;
        errors.push(`Row ${index + 1}: Teacher ID "${normalizedTeacherId}" or Email "${normalizedEmail}" already exists.`);
        continue;
      }

      let assignedSubjects = [];
      if (Array.isArray(item.assignedSubjects)) {
        assignedSubjects = item.assignedSubjects;
      } else if (typeof item.assignedSubjects === "string") {
        assignedSubjects = item.assignedSubjects.split(",").map((s) => s.trim()).filter(Boolean);
      }

      const newTeacher = new Teacher({
        teacherId: normalizedTeacherId,
        employeeCode: item.employeeCode ? String(item.employeeCode).trim() : "",
        fullName: String(item.fullName).trim(),
        email: normalizedEmail,
        contactNumber: item.contactNumber ? String(item.contactNumber).trim() : "",
        alternateContactNumber: item.alternateContactNumber ? String(item.alternateContactNumber).trim() : "",
        gender: item.gender || "",
        dateOfBirth: item.dateOfBirth ? new Date(item.dateOfBirth) : null,
        qualification: item.qualification ? String(item.qualification).trim() : "",
        specialization: item.specialization ? String(item.specialization).trim() : "",
        experience: item.experience ? String(item.experience).trim() : "",
        joiningDate: item.joiningDate ? new Date(item.joiningDate) : null,
        designation: item.designation ? String(item.designation).trim() : "Teacher",
        role: item.role || "SUBJECT_TEACHER",
        assignedClass: item.assignedClass ? String(item.assignedClass).trim() : "",
        assignedSubjects,
        department: item.department ? String(item.department).trim() : "",
        profilePhoto: item.profilePhoto || "",
        address: item.address ? String(item.address).trim() : "",
        city: item.city ? String(item.city).trim() : "",
        state: item.state ? String(item.state).trim() : "",
        pincode: item.pincode ? String(item.pincode).trim() : "",
        username: item.username ? String(item.username).trim() : normalizedEmail,
        accountStatus: item.accountStatus || "Active",
      });

      await newTeacher.save();
      insertedCount++;
    }

    return res.status(200).json({
      success: true,
      message: `Successfully imported ${insertedCount} teacher record(s). ${skippedCount} skipped.`,
      insertedCount,
      skippedCount,
      errors,
    });
  } catch (error) {
    console.error("bulkImportTeachers error:", error);
    return res.status(500).json({
      success: false,
      message: "Bulk import failed.",
      error: error.message,
    });
  }
};

module.exports = {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  bulkImportTeachers,
};
