const User = require("../models/User");
const Class = require("../models/Class");
const Teacher = require("../models/Teacher");
const TeacherAssignment = require("../models/TeacherAssignment");
const School = require("../models/School");
const {
  resolveUserAndTeacher,
  syncTeacherToUserAndClass,
  syncUserToTeacherAndClass,
  assignClassInchargeToClass,
  syncSectionIncharges,
  syncTeacherAssignmentsToTeacherDoc,
} = require("../utils/syncHelper");

// Grade-based default subjects for subject teacher assignment dropdown
const GRADE_SUBJECTS = {
  LKG:  ["English", "Hindi", "Mathematics", "EVS", "Drawing"],
  UKG:  ["English", "Hindi", "Mathematics", "EVS", "Drawing"],
  "1":  ["English", "Hindi", "Mathematics", "EVS", "GK"],
  "2":  ["English", "Hindi", "Mathematics", "EVS", "GK"],
  "3":  ["English", "Hindi", "Mathematics", "Science", "Social Studies", "GK"],
  "4":  ["English", "Hindi", "Mathematics", "Science", "Social Studies", "GK"],
  "5":  ["English", "Hindi", "Mathematics", "Science", "Social Studies", "GK"],
  "6":  ["English", "Hindi", "Mathematics", "Science", "Social Studies", "Sanskrit", "Computer"],
  "7":  ["English", "Hindi", "Mathematics", "Science", "Social Studies", "Sanskrit", "Computer"],
  "8":  ["English", "Hindi", "Mathematics", "Science", "Social Studies", "Sanskrit", "Computer"],
  "9":  ["English", "Hindi", "Mathematics", "Science", "Social Studies", "Sanskrit", "Computer"],
  "10": ["English", "Hindi", "Mathematics", "Science", "Social Studies", "Sanskrit", "Computer"],
  "11": ["English", "Hindi", "Mathematics", "Physics", "Chemistry", "Biology", "History", "Geography", "Economics", "Political Science", "Computer Science", "Physical Education"],
  "12": ["English", "Hindi", "Mathematics", "Physics", "Chemistry", "Biology", "History", "Geography", "Economics", "Political Science", "Computer Science", "Physical Education"],
};

const DEFAULT_CLASSES = [
  { name: "LKG", grade: "LKG" },
  { name: "UKG", grade: "UKG" },
  { name: "Class 1", grade: "1" },
  { name: "Class 2", grade: "2" },
  { name: "Class 3", grade: "3" },
  { name: "Class 4", grade: "4" },
  { name: "Class 5", grade: "5" },
  { name: "Class 6", grade: "6" },
  { name: "Class 7", grade: "7" },
  { name: "Class 8", grade: "8" },
  { name: "Class 9", grade: "9" },
  { name: "Class 10", grade: "10" },
  { name: "Class 11", grade: "11" },
  { name: "Class 12", grade: "12" },
];

// Helper to auto-seed default classes if none exist
const ensureDefaultClassesExist = async () => {
  const count = await Class.countDocuments();
  if (count === 0) {
    await Class.insertMany(DEFAULT_CLASSES);
    console.log("Auto-seeded default school classes (LKG to Class 12).");
  }
};

// Helper to auto-initialize School settings document if none exists
const ensureSchoolExists = async () => {
  let school = await School.findOne();
  if (!school) {
    school = await School.create({
      name: "Delhi Public Senior Secondary School",
      code: "DPS-1002",
      affiliationNumber: "CBSE/AFF/2025-26/0942",
      board: "CBSE",
      contactEmail: "principal@school.com",
      contactNumber: "+91 98765 43210",
      address: "123 Knowledge Park, Education Hub",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110001",
      website: "https://school.edu",
      principalName: "Principal Admin",
      currentSession: "2025-2026",
      academicSessions: [
        { name: "2024-2025", isCurrent: false },
        { name: "2025-2026", isCurrent: true },
        { name: "2026-2027", isCurrent: false },
      ],
      term: "Term 1",
      passingPercentage: "33%",
      resultPublishing: "Manual Review Required",
      emailNotifications: true,
      autoBackup: true,
    });
  }
  return school;
};

// Helper to construct class details payload with full Teacher ID and sections
const getClassByIdResponse = async (id, res, message = null) => {
  const schoolClass = await Class.findById(id)
    .populate("classIncharge", "name email role isActive")
    .populate("sections.classIncharge", "name email role isActive");

  if (!schoolClass) {
    return res.status(404).json({
      success: false,
      message: "Class not found.",
    });
  }

  // Create map of User ID -> Teacher ID & Teacher Doc
  const allTeachers = await Teacher.find({ accountStatus: { $ne: "Inactive" } }).sort({ fullName: 1 });
  const userToTeacherMap = new Map();
  allTeachers.forEach((t) => {
    if (t.userRef) userToTeacherMap.set(t.userRef.toString(), t);
    userToTeacherMap.set(t._id.toString(), t);
  });

  // Prepare available teachers for incharge assignment
  const availableIncharges = allTeachers.map((t) => ({
    _id: t.userRef ? t.userRef : t._id,
    teacherDbId: t._id,
    teacherId: t.teacherId,
    name: t.fullName,
    email: t.email,
    role: t.role,
    assignedClass: t.assignedClass,
  }));

  // Fetch subject teachers
  const teacherAssignments = await TeacherAssignment.find({ class: id })
    .populate("teacher", "fullName email role accountStatus teacherId")
    .sort({ section: 1, subject: 1 });

  const subjectTeachers = teacherAssignments.map((assignment) => ({
    assignmentId: assignment._id,
    subject: assignment.subject,
    section: assignment.section,
    academicYear: assignment.academicYear,
    teacher: assignment.teacher
      ? {
          _id: assignment.teacher._id,
          teacherId: assignment.teacher.teacherId || "N/A",
          name: assignment.teacher.fullName,
          email: assignment.teacher.email,
          role: assignment.teacher.role,
          isActive: assignment.teacher.accountStatus !== "Inactive",
        }
      : null,
  }));

  // Attach teacherId to main incharge
  let classInchargeData = null;
  if (schoolClass.classIncharge) {
    const tch = userToTeacherMap.get(schoolClass.classIncharge._id.toString());
    classInchargeData = {
      _id: schoolClass.classIncharge._id,
      name: schoolClass.classIncharge.name,
      email: schoolClass.classIncharge.email,
      role: schoolClass.classIncharge.role,
      isActive: schoolClass.classIncharge.isActive,
      teacherId: tch ? tch.teacherId : "N/A",
    };
  }

  // Attach teacherId to sections incharge
  const enrichedSections = (schoolClass.sections || []).map((sec) => {
    let secIncharge = null;
    if (sec.classIncharge) {
      const tch = userToTeacherMap.get(sec.classIncharge._id.toString());
      secIncharge = {
        _id: sec.classIncharge._id,
        name: sec.classIncharge.name,
        email: sec.classIncharge.email,
        role: sec.classIncharge.role,
        isActive: sec.classIncharge.isActive,
        teacherId: tch ? tch.teacherId : "N/A",
      };
    }
    return {
      _id: sec._id,
      name: sec.name,
      classIncharge: secIncharge,
    };
  });

  const gradeSubjects = GRADE_SUBJECTS[schoolClass.grade] || ["English", "Hindi", "Mathematics", "Science", "Social Studies"];
  const classSubjects = schoolClass.subjects || [];

  const responsePayload = {
    success: true,
    classDetails: {
      _id: schoolClass._id,
      name: schoolClass.name,
      grade: schoolClass.grade,
      section: schoolClass.section,
      hasSections: schoolClass.hasSections || false,
      sections: enrichedSections,
      academicYear: schoolClass.academicYear,
      isActive: schoolClass.isActive,
      classIncharge: classInchargeData,
      subjectTeachers,
      totalSubjectTeachers: subjectTeachers.length,
      availableIncharges,
      gradeSubjects,
      classSubjects,
    },
  };

  if (message) {
    responsePayload.message = message;
  }

  return res.status(200).json(responsePayload);
};

// @desc    Get all school classes (LKG to Class 12)
// @route   GET /api/principal/classes
// @access  Private (PRINCIPAL only)
const getAllClasses = async (req, res) => {
  try {
    await ensureDefaultClassesExist();

    const classes = await Class.find()
      .populate("classIncharge", "name email role isActive")
      .populate("sections.classIncharge", "name email role isActive")
      .sort({ createdAt: 1 });

    const allTeachers = await Teacher.find({ accountStatus: { $ne: "Inactive" } }).select("teacherId userRef fullName email");
    const userToTeacherMap = new Map();
    allTeachers.forEach((t) => {
      if (t.userRef) userToTeacherMap.set(t.userRef.toString(), t);
      userToTeacherMap.set(t._id.toString(), t);
    });

    const classesWithDetails = await Promise.all(
      classes.map(async (cls) => {
        const teacherAssignments = await TeacherAssignment.find({
          class: cls._id,
          isActive: true,
        }).populate("teacher", "fullName email role accountStatus teacherId");

        // Format main class incharge with teacherId
        let inchargeFormatted = null;
        if (cls.classIncharge) {
          const tch = userToTeacherMap.get(cls.classIncharge._id.toString());
          inchargeFormatted = {
            _id: cls.classIncharge._id,
            name: cls.classIncharge.name,
            email: cls.classIncharge.email,
            role: cls.classIncharge.role,
            isActive: cls.classIncharge.isActive,
            teacherId: tch ? tch.teacherId : "N/A",
          };
        }

        // Format section incharges with teacherId
        const sectionsFormatted = (cls.sections || []).map((sec) => {
          let secIncharge = null;
          if (sec.classIncharge) {
            const tch = userToTeacherMap.get(sec.classIncharge._id.toString());
            secIncharge = {
              _id: sec.classIncharge._id,
              name: sec.classIncharge.name,
              email: sec.classIncharge.email,
              role: sec.classIncharge.role,
              isActive: sec.classIncharge.isActive,
              teacherId: tch ? tch.teacherId : "N/A",
            };
          }
          return {
            _id: sec._id,
            name: sec.name,
            classIncharge: secIncharge,
          };
        });

        return {
          _id: cls._id,
          name: cls.name,
          grade: cls.grade,
          section: cls.section,
          hasSections: cls.hasSections || false,
          sections: sectionsFormatted,
          academicYear: cls.academicYear,
          isActive: cls.isActive,
          classIncharge: inchargeFormatted,
          totalSubjectTeachers: teacherAssignments.length,
          subjectTeachers: teacherAssignments.map((a) => ({
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
                }
              : null,
          })),
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: classesWithDetails.length,
      classes: classesWithDetails,
    });
  } catch (error) {
    console.error("getAllClasses error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch classes.",
      error: error.message,
    });
  }
};

// @desc    Get single class details with distinct Class Incharge & Subject Teachers
// @route   GET /api/principal/classes/:id
// @access  Private (PRINCIPAL only)
const getClassById = async (req, res) => {
  try {
    return await getClassByIdResponse(req.params.id, res);
  } catch (error) {
    console.error("getClassById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch class details.",
      error: error.message,
    });
  }
};

// @desc    Update class sections configuration and per-section incharges
// @route   PUT /api/principal/classes/:id/sections
// @access  Private (PRINCIPAL only)
const updateClassSections = async (req, res) => {
  try {
    const { id } = req.params;
    const { hasSections, sections } = req.body;

    const schoolClass = await Class.findById(id);
    if (!schoolClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }

    if (typeof hasSections === "boolean") {
      schoolClass.hasSections = hasSections;
    }

    if (schoolClass.hasSections) {
      if (Array.isArray(sections) && sections.length > 0) {
        await syncSectionIncharges(schoolClass, sections);
      } else if (!schoolClass.sections || schoolClass.sections.length === 0) {
        schoolClass.sections = [
          { name: "Section A", classIncharge: null },
          { name: "Section B", classIncharge: null },
          { name: "Section C", classIncharge: null },
          { name: "Section D", classIncharge: null },
        ];
        await schoolClass.save();
      }
    } else {
      await schoolClass.save();
    }

    return await getClassByIdResponse(id, res, "Class sections updated successfully.");
  } catch (error) {
    console.error("updateClassSections error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update class sections.",
      error: error.message,
    });
  }
};

// @desc    Assign Class Incharge to a class or section
// @route   PUT /api/principal/classes/:id/incharge
// @access  Private (PRINCIPAL only)
const assignClassIncharge = async (req, res) => {
  try {
    const { id } = req.params;
    const { classInchargeId, section } = req.body;

    await assignClassInchargeToClass(id, classInchargeId, section || null);

    return await getClassByIdResponse(id, res, "Class Incharge assigned and synchronized successfully.");
  } catch (error) {
    console.error("assignClassIncharge error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to assign Class Incharge.",
    });
  }
};

// @desc    Assign Subject Teacher
// @route   POST /api/principal/classes/:id/subject-teachers
// @access  Private (PRINCIPAL only)
const assignSubjectTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId, subject, section } = req.body;

    if (!teacherId || !subject) {
      return res.status(400).json({ success: false, message: "Teacher and Subject are required." });
    }

    const schoolClass = await Class.findById(id);
    if (!schoolClass) {
      return res.status(404).json({ success: false, message: "Class not found." });
    }

    const { user, teacher } = await resolveUserAndTeacher(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher not found." });
    }

    const sectionName = section || (schoolClass.hasSections && schoolClass.sections?.length > 0 ? schoolClass.sections[0].name : schoolClass.section || "A");
    const normalizedSubject = subject.trim();

    // Prevent duplicate: Upsert by class + section + subject (case-insensitive)
    let existing = await TeacherAssignment.findOne({
      class: id,
      section: sectionName,
      subject: new RegExp(`^${normalizedSubject}$`, "i"),
    });

    const previousTeacherId = existing ? existing.teacher : null;

    if (existing) {
      existing.teacher = teacher._id;
      existing.subject = normalizedSubject;
      existing.academicYear = schoolClass.academicYear || "2025-2026";
      existing.isActive = true;
      await existing.save();
    } else {
      await TeacherAssignment.create({
        class: id,
        section: sectionName,
        teacher: teacher._id,
        subject: normalizedSubject,
        academicYear: schoolClass.academicYear || "2025-2026",
        isActive: true,
      });
    }

    // Sync assigned subjects to Teacher model
    await syncTeacherAssignmentsToTeacherDoc(teacher._id);
    if (previousTeacherId && previousTeacherId.toString() !== teacher._id.toString()) {
      await syncTeacherAssignmentsToTeacherDoc(previousTeacherId);
    }

    return await getClassByIdResponse(id, res, "Subject Teacher assigned successfully.");
  } catch (error) {
    console.error("assignSubjectTeacher error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to assign Subject Teacher." });
  }
};

// @desc    Delete / Unassign Subject Teacher
// @route   DELETE /api/principal/classes/:id/subject-teachers/:assignmentId
// @access  Private (PRINCIPAL only)
const deleteSubjectTeacher = async (req, res) => {
  try {
    const { id, assignmentId } = req.params;

    const assignment = await TeacherAssignment.findOne({ _id: assignmentId, class: id });
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Subject assignment not found." });
    }

    const teacherId = assignment.teacher;
    await TeacherAssignment.findByIdAndDelete(assignmentId);

    if (teacherId) {
      await syncTeacherAssignmentsToTeacherDoc(teacherId);
    }

    return await getClassByIdResponse(id, res, "Subject teacher unassigned successfully.");
  } catch (error) {
    console.error("deleteSubjectTeacher error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to unassign Subject Teacher." });
  }
};

// @desc    Create a new Class Incharge user
// @route   POST /api/principal/class-incharges
// @access  Private (PRINCIPAL only)
const createClassIncharge = async (req, res) => {
  try {
    const { name, email, password, assignedClassId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    const newIncharge = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: password,
      role: "CLASS_INCHARGE",
      isActive: true,
    });

    await newIncharge.save();

    // Synchronize across Teacher & Class models
    await syncUserToTeacherAndClass(newIncharge, assignedClassId);

    const createdUser = await User.findById(newIncharge._id)
      .select("-password")
      .populate("assignedClass", "name grade section");

    return res.status(201).json({
      success: true,
      message: "Class Incharge created successfully.",
      classIncharge: createdUser,
    });
  } catch (error) {
    console.error("createClassIncharge error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create Class Incharge.",
      error: error.message,
    });
  }
};

// @desc    Get all Class Incharges
// @route   GET /api/principal/class-incharges
// @access  Private (PRINCIPAL only)
const getAllClassIncharges = async (req, res) => {
  try {
    const incharges = await User.find({ role: "CLASS_INCHARGE" })
      .select("-password")
      .populate("assignedClass", "name grade section")
      .sort({ createdAt: -1 });

    const populatedIncharges = await Promise.all(
      incharges.map(async (incharge) => {
        let assignedClassObj = null;

        // Check 1: Class where classIncharge = user._id
        const mainClass = await Class.findOne({ classIncharge: incharge._id }).select("name grade section");
        if (mainClass) {
          assignedClassObj = {
            _id: mainClass._id,
            name: mainClass.name,
            grade: mainClass.grade,
            section: mainClass.section || "A",
          };
        }

        // Check 2: Section where sections.classIncharge = user._id
        if (!assignedClassObj) {
          const classWithSection = await Class.findOne({
            "sections.classIncharge": incharge._id,
          });
          if (classWithSection) {
            const matchedSec = classWithSection.sections.find(
              (s) => s.classIncharge && s.classIncharge.toString() === incharge._id.toString()
            );
            assignedClassObj = {
              _id: classWithSection._id,
              name: `${classWithSection.name} (${matchedSec?.name || "Section"})`,
              grade: classWithSection.grade,
              section: matchedSec?.name || classWithSection.section,
            };
          }
        }

        // Check 3: incharge.assignedClass fallback
        if (!assignedClassObj && incharge.assignedClass) {
          assignedClassObj = {
            _id: incharge.assignedClass._id,
            name: incharge.assignedClass.name,
            grade: incharge.assignedClass.grade,
            section: incharge.assignedClass.section || "A",
          };
        }

        const tch = await Teacher.findOne({
          $or: [{ userRef: incharge._id }, { email: incharge.email }],
        });

        return {
          _id: incharge._id,
          name: incharge.name,
          teacherId: tch ? tch.teacherId : `TCH${String(incharge._id).slice(-4).toUpperCase()}`,
          email: incharge.email,
          role: incharge.role,
          isActive: incharge.isActive,
          createdAt: incharge.createdAt,
          assignedClass: assignedClassObj,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: populatedIncharges.length,
      classIncharges: populatedIncharges,
    });
  } catch (error) {
    console.error("getAllClassIncharges error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Class Incharges.",
      error: error.message,
    });
  }
};

// @desc    Get single Class Incharge by ID
// @route   GET /api/principal/class-incharges/:id
// @access  Private (PRINCIPAL only)
const getClassInchargeById = async (req, res) => {
  try {
    const { id } = req.params;

    const incharge = await User.findOne({ _id: id, role: "CLASS_INCHARGE" })
      .select("-password")
      .populate("assignedClass", "name grade section");

    if (!incharge) {
      return res.status(404).json({
        success: false,
        message: "Class Incharge not found.",
      });
    }

    let assignedClassObj = incharge.assignedClass;
    if (!assignedClassObj) {
      const classWithSection = await Class.findOne({ "sections.classIncharge": incharge._id });
      if (classWithSection) {
        const matchedSec = classWithSection.sections.find(
          (s) => s.classIncharge && s.classIncharge.toString() === incharge._id.toString()
        );
        assignedClassObj = {
          _id: classWithSection._id,
          name: `${classWithSection.name} (${matchedSec?.name || "Section"})`,
          grade: classWithSection.grade,
          section: matchedSec?.name || classWithSection.section,
        };
      }
    }

    const tch = await Teacher.findOne({ $or: [{ userRef: incharge._id }, { email: incharge.email }] });

    return res.status(200).json({
      success: true,
      classIncharge: {
        _id: incharge._id,
        name: incharge.name,
        teacherId: tch ? tch.teacherId : `TCH${String(incharge._id).slice(-4).toUpperCase()}`,
        email: incharge.email,
        role: incharge.role,
        isActive: incharge.isActive,
        createdAt: incharge.createdAt,
        assignedClass: assignedClassObj,
      },
    });
  } catch (error) {
    console.error("getClassInchargeById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Class Incharge.",
      error: error.message,
    });
  }
};

// @desc    Update Class Incharge
// @route   PUT /api/principal/class-incharges/:id
// @access  Private (PRINCIPAL only)
const updateClassIncharge = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, assignedClassId, isActive } = req.body;

    const incharge = await User.findOne({ _id: id, role: "CLASS_INCHARGE" });
    if (!incharge) {
      return res.status(404).json({
        success: false,
        message: "Class Incharge not found.",
      });
    }

    if (name) incharge.name = name.trim();

    if (email && email.toLowerCase().trim() !== incharge.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "A user with this email already exists.",
        });
      }
      incharge.email = email.toLowerCase().trim();
    }

    if (typeof isActive === "boolean") {
      incharge.isActive = isActive;
    }

    if (password && password.trim().length >= 6) {
      incharge.password = password;
    }

    await incharge.save();

    // Synchronize across Teacher & Class models
    await syncUserToTeacherAndClass(incharge, assignedClassId);

    const updatedIncharge = await User.findById(id)
      .select("-password")
      .populate("assignedClass", "name grade section");

    return res.status(200).json({
      success: true,
      message: "Class Incharge updated successfully.",
      classIncharge: updatedIncharge,
    });
  } catch (error) {
    console.error("updateClassIncharge error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update Class Incharge.",
      error: error.message,
    });
  }
};

// @desc    Delete Class Incharge
// @route   DELETE /api/principal/class-incharges/:id
// @access  Private (PRINCIPAL only)
const deleteClassIncharge = async (req, res) => {
  try {
    const { id } = req.params;

    const incharge = await User.findOne({ _id: id, role: "CLASS_INCHARGE" });
    if (!incharge) {
      return res.status(404).json({
        success: false,
        message: "Class Incharge not found.",
      });
    }

    // Unassign from all classes & sections
    await Class.updateMany({ classIncharge: id }, { classIncharge: null });
    await Class.updateMany(
      { "sections.classIncharge": id },
      { $set: { "sections.$[elem].classIncharge": null } },
      { arrayFilters: [{ "elem.classIncharge": id }] }
    );

    // Update corresponding Teacher record to Subject Teacher
    const tch = await Teacher.findOne({ $or: [{ userRef: id }, { email: incharge.email }] });
    if (tch) {
      tch.role = "SUBJECT_TEACHER";
      tch.assignedClass = "";
      await tch.save();
      await syncTeacherAssignmentsToTeacherDoc(tch._id);
    }

    // Delete user
    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Class Incharge deleted successfully.",
    });
  } catch (error) {
    console.error("deleteClassIncharge error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete Class Incharge.",
      error: error.message,
    });
  }
};

// @desc    Get School Info & Academic Sessions
// @route   GET /api/principal/school
// @access  Private (PRINCIPAL only)
const getSchoolSettings = async (req, res) => {
  try {
    const school = await ensureSchoolExists();
    return res.status(200).json({
      success: true,
      school,
    });
  } catch (error) {
    console.error("getSchoolSettings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch school settings.",
      error: error.message,
    });
  }
};

// @desc    Update School Info & Academic Sessions
// @route   PUT /api/principal/school
// @access  Private (PRINCIPAL only)
const updateSchoolSettings = async (req, res) => {
  try {
    const school = await ensureSchoolExists();
    const updateData = req.body;

    Object.assign(school, updateData);

    // If current session changed, sync with classes
    if (updateData.currentSession) {
      await Class.updateMany({}, { academicYear: updateData.currentSession });
      school.academicSessions.forEach((s) => {
        s.isCurrent = s.name === updateData.currentSession;
      });
    }

    await school.save();

    return res.status(200).json({
      success: true,
      message: "School information and settings saved successfully.",
      school,
    });
  } catch (error) {
    console.error("updateSchoolSettings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update school settings.",
      error: error.message,
    });
  }
};

// @desc    Add / Switch Academic Session
// @route   POST /api/principal/academic-sessions
// @access  Private (PRINCIPAL only)
const addAcademicSession = async (req, res) => {
  try {
    const { sessionName, isCurrent } = req.body;
    if (!sessionName || !sessionName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Academic session name is required (e.g. 2026-2027).",
      });
    }

    const trimmed = sessionName.trim();
    const school = await ensureSchoolExists();

    const existingIdx = school.academicSessions.findIndex((s) => s.name === trimmed);
    if (existingIdx !== -1) {
      if (isCurrent) {
        school.academicSessions.forEach((s) => (s.isCurrent = false));
        school.academicSessions[existingIdx].isCurrent = true;
        school.currentSession = trimmed;
        await Class.updateMany({}, { academicYear: trimmed });
      }
    } else {
      if (isCurrent) {
        school.academicSessions.forEach((s) => (s.isCurrent = false));
        school.currentSession = trimmed;
        await Class.updateMany({}, { academicYear: trimmed });
      }
      school.academicSessions.push({ name: trimmed, isCurrent: !!isCurrent });
    }

    await school.save();

    return res.status(200).json({
      success: true,
      message: `Academic session "${trimmed}" saved successfully.`,
      school,
    });
  } catch (error) {
    console.error("addAcademicSession error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add academic session.",
      error: error.message,
    });
  }
};

module.exports = {
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
};
