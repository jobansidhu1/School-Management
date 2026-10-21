const Subject = require("../models/Subject");
const Marks = require("../models/Marks");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Class = require("../models/Class");
const TeacherAssignment = require("../models/TeacherAssignment");
const Teacher = require("../models/Teacher");
const School = require("../models/School");
const User = require("../models/User");

// ─── SUBJECT CONTROLLERS ─────────────────────────────────────────────────────

const getAllSubjects = async (req, res) => {
  try {
    const { classStandard, section } = req.query;
    let query = {};
    if (classStandard) query.classStandard = classStandard;
    if (section) query.section = section;
    const subjects = await Subject.find(query).sort({ name: 1 });
    res.status(200).json({ success: true, subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch subjects", error: error.message });
  }
};

const createSubject = async (req, res) => {
  try {
    const subject = new Subject(req.body);
    await subject.save();
    res.status(201).json({ success: true, subject });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create subject", error: error.message });
  }
};

const updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });
    res.status(200).json({ success: true, subject });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update subject", error: error.message });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ success: false, message: "Subject not found" });
    res.status(200).json({ success: true, message: "Subject deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete subject", error: error.message });
  }
};

// ─── MARKS & STUDENT ACADEMICS CONTROLLERS ───────────────────────────────────────

// @desc    Get complete academic details for authenticated student
// @route   GET /api/academic/my-academics
// @access  Private (STUDENT only)
const getMyAcademics = async (req, res) => {
  try {
    if (req.user.role !== "STUDENT" || !req.user.studentId) {
      return res.status(403).json({ success: false, message: "Access denied. Student portal only." });
    }

    // 1. Fetch authenticated student's fresh record
    const student = await Student.findOne({ studentId: req.user.studentId }).lean();
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found." });
    }

    // 2. Fetch School info for official branding & active session
    const school = (await School.findOne({ isActive: true }).lean()) || (await School.findOne({}).lean()) || {
      name: "Delhi Public School",
      code: "DPS-1002",
      affiliationNumber: "CBSE/AFF/2025-26/0942",
      board: "CBSE",
      currentSession: "2025-2026",
      principalName: "Principal Admin",
      contactEmail: "principal@school.com",
      contactNumber: "+91 98765 43210",
      address: "123 Knowledge Park, Education Hub",
      city: "New Delhi",
      state: "Delhi",
    };

    // 3. Resolve Class
    let classDoc = null;
    if (student.classRef) {
      classDoc = await Class.findById(student.classRef)
        .populate("classIncharge", "name email")
        .populate("sections.classIncharge", "name email")
        .lean();
    }
    if (!classDoc && student.classStandard) {
      classDoc = await Class.findOne({
        $or: [
          { grade: student.classStandard },
          { name: new RegExp(`^Class\\s*${student.classStandard}$`, "i") },
          { name: student.classStandard },
        ],
      })
        .populate("classIncharge", "name email")
        .populate("sections.classIncharge", "name email")
        .lean();
    }

    // Determine Class Incharge name for this student's class and section
    let classInchargeInfo = null;
    if (classDoc) {
      if (classDoc.sections && Array.isArray(classDoc.sections)) {
        const secMatch = classDoc.sections.find(
          (s) => s.name === student.section || s.name === `Section ${student.section}`
        );
        if (secMatch && secMatch.classIncharge) {
          classInchargeInfo = secMatch.classIncharge;
        }
      }
      if (!classInchargeInfo && classDoc.classIncharge) {
        classInchargeInfo = classDoc.classIncharge;
      }
    }

    // 4. Resolve Teacher Assignments for student's class and section
    let teacherAssignments = [];
    if (classDoc) {
      teacherAssignments = await TeacherAssignment.find({
        class: classDoc._id,
        $or: [
          { section: student.section },
          { section: `Section ${student.section}` },
          { section: { $regex: new RegExp(`^${student.section}$`, "i") } },
        ],
        isActive: true,
      })
        .populate("teacher", "fullName teacherId email contactNumber designation department")
        .lean();
    }

    // 5. Query defined Subjects
    const subjectFilter = {
      $or: [
        ...(classDoc ? [{ classRef: classDoc._id }] : []),
        { classStandard: student.classStandard, section: student.section },
        { classStandard: student.classStandard },
      ],
    };
    const subjectsInDb = await Subject.find(subjectFilter).lean();

    // 6. Fetch marks for this student (strictly by studentId)
    const marks = await Marks.find({ studentId: student.studentId })
      .sort({ examDate: -1, createdAt: -1 })
      .lean();

    // 7. Compile unified Assigned Subjects list with Mapped Subject Teachers
    const subjectMap = new Map();

    // Add subjects from Teacher Assignments
    teacherAssignments.forEach((ta) => {
      const name = ta.subject;
      if (!subjectMap.has(name)) {
        subjectMap.set(name, {
          name,
          code: "",
          teacher: ta.teacher?.fullName || "Not Assigned",
          teacherId: ta.teacher?.teacherId || "",
          teacherEmail: ta.teacher?.email || "",
          teacherDesignation: ta.teacher?.designation || "Subject Teacher",
          maxMarks: 100,
        });
      }
    });

    // Add / enrich from Subject documents
    subjectsInDb.forEach((sub) => {
      if (!subjectMap.has(sub.name)) {
        subjectMap.set(sub.name, {
          name: sub.name,
          code: sub.code || "",
          teacher: sub.teacher || "Not Assigned",
          teacherId: "",
          teacherEmail: "",
          teacherDesignation: "Subject Teacher",
          maxMarks: sub.maxMarks || 100,
        });
      } else {
        const existing = subjectMap.get(sub.name);
        if (!existing.code && sub.code) existing.code = sub.code;
        if (sub.maxMarks) existing.maxMarks = sub.maxMarks;
        if ((!existing.teacher || existing.teacher === "Not Assigned") && sub.teacher) {
          existing.teacher = sub.teacher;
        }
      }
    });

    // Add from Class subjects array if defined
    if (classDoc && Array.isArray(classDoc.subjects)) {
      classDoc.subjects.forEach((sName) => {
        if (!subjectMap.has(sName)) {
          subjectMap.set(sName, {
            name: sName,
            code: "",
            teacher: "Not Assigned",
            teacherId: "",
            teacherEmail: "",
            teacherDesignation: "Subject Teacher",
            maxMarks: 100,
          });
        }
      });
    }

    // Add from existing Marks if any subject wasn't captured yet
    marks.forEach((m) => {
      if (!subjectMap.has(m.subjectName)) {
        subjectMap.set(m.subjectName, {
          name: m.subjectName,
          code: "",
          teacher: "Not Assigned",
          teacherId: "",
          teacherEmail: "",
          teacherDesignation: "Subject Teacher",
          maxMarks: m.maxMarks || 100,
        });
      }
    });

    const assignedSubjects = Array.from(subjectMap.values());

    // 8. Calculate Overall Academic Performance
    let totalMarksObtained = 0;
    let totalMaxMarks = 0;
    const subjectPerformance = {};

    assignedSubjects.forEach((sub) => {
      subjectPerformance[sub.name] = {
        subjectName: sub.name,
        code: sub.code,
        teacher: sub.teacher,
        teacherId: sub.teacherId,
        obtained: 0,
        max: 0,
        percentage: 0,
        grade: "N/A",
        tests: [],
      };
    });

    marks.forEach((m) => {
      totalMarksObtained += m.marksObtained;
      totalMaxMarks += m.maxMarks;

      if (!subjectPerformance[m.subjectName]) {
        subjectPerformance[m.subjectName] = {
          subjectName: m.subjectName,
          code: "",
          teacher: "Not Assigned",
          teacherId: "",
          obtained: 0,
          max: 0,
          percentage: 0,
          grade: "N/A",
          tests: [],
        };
      }

      subjectPerformance[m.subjectName].obtained += m.marksObtained;
      subjectPerformance[m.subjectName].max += m.maxMarks;
      subjectPerformance[m.subjectName].tests.push(m);
    });

    // Grade calculator helper
    const calcGrade = (pct) => {
      if (pct >= 90) return { grade: "A+", label: "Outstanding" };
      if (pct >= 80) return { grade: "A", label: "Excellent" };
      if (pct >= 70) return { grade: "B+", label: "Very Good" };
      if (pct >= 60) return { grade: "B", label: "Good" };
      if (pct >= 50) return { grade: "C", label: "Average" };
      if (pct >= 35) return { grade: "D", label: "Pass" };
      return { grade: "F", label: "Needs Improvement" };
    };

    Object.values(subjectPerformance).forEach((sp) => {
      if (sp.max > 0) {
        sp.percentage = Math.round((sp.obtained / sp.max) * 100);
        sp.grade = calcGrade(sp.percentage).grade;
      }
    });

    const overallPercentage =
      totalMaxMarks > 0 ? parseFloat(((totalMarksObtained / totalMaxMarks) * 100).toFixed(1)) : 0;
    const { grade: overallGrade, label: performanceLabel } = calcGrade(overallPercentage);

    // 9. Build Monthly Test Performance History
    const monthlyGroups = {};
    marks.forEach((m) => {
      const dateStr = m.examDate || m.createdAt;
      const dateObj = new Date(dateStr);
      const year = dateObj.getFullYear();
      const monthNum = String(dateObj.getMonth() + 1).padStart(2, "0");
      const monthKey = `${year}-${monthNum}`;
      const monthLabel = isNaN(dateObj.getTime())
        ? "General"
        : dateObj.toLocaleString("en-US", { month: "short", year: "numeric" });

      if (!monthlyGroups[monthKey]) {
        monthlyGroups[monthKey] = {
          monthKey,
          monthLabel,
          year,
          monthNum,
          totalObtained: 0,
          totalMax: 0,
          tests: [],
        };
      }

      monthlyGroups[monthKey].totalObtained += m.marksObtained;
      monthlyGroups[monthKey].totalMax += m.maxMarks;
      monthlyGroups[monthKey].tests.push({
        ...m,
        percentage: m.maxMarks > 0 ? Math.round((m.marksObtained / m.maxMarks) * 100) : 0,
        grade: calcGrade(m.maxMarks > 0 ? Math.round((m.marksObtained / m.maxMarks) * 100) : 0).grade,
      });
    });

    const monthlyHistory = Object.values(monthlyGroups)
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
      .map((g) => ({
        ...g,
        percentage: g.totalMax > 0 ? Math.round((g.totalObtained / g.totalMax) * 100) : 0,
      }));

    return res.status(200).json({
      success: true,
      hasMarks: marks.length > 0,
      student: {
        _id: student._id,
        studentId: student.studentId,
        studentName: student.studentName,
        username: student.username,
        rollno: student.rollno,
        classStandard: student.classStandard,
        section: student.section,
        dob: student.dob,
        age: student.age,
        gender: student.gender,
        address: student.address,
        guardianNo: student.guardianNo,
      },
      classDetails: classDoc
        ? {
            _id: classDoc._id,
            name: classDoc.name,
            grade: classDoc.grade,
            section: student.section,
            classIncharge: classInchargeInfo?.name || "Not Assigned",
            classInchargeEmail: classInchargeInfo?.email || "",
          }
        : null,
      school: {
        name: school.name,
        code: school.code,
        affiliationNumber: school.affiliationNumber,
        board: school.board,
        currentSession: school.currentSession,
        principalName: school.principalName,
        contactEmail: school.contactEmail,
        contactNumber: school.contactNumber,
        address: school.address,
        city: school.city,
        state: school.state,
      },
      assignedSubjects,
      marks,
      subjectPerformance: Object.values(subjectPerformance),
      monthlyHistory,
      summary: {
        totalMarksObtained,
        totalMaxMarks,
        overallPercentage,
        overallGrade,
        performanceLabel,
        totalTestsTaken: marks.length,
        totalSubjectsCount: assignedSubjects.length,
        status: overallPercentage >= 35 ? "Pass" : marks.length > 0 ? "Needs Improvement" : "Pending Evaluation",
      },
    });
  } catch (error) {
    console.error("getMyAcademics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch student academic details.",
      error: error.message,
    });
  }
};

const getMarksByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    // If the requester is a student, only allow their own data
    if (req.user.role === "STUDENT" && req.user.studentId !== studentId) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }
    const marks = await Marks.find({ studentId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, marks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch marks", error: error.message });
  }
};

const getMyMarks = async (req, res) => {
  try {
    if (!req.user.studentId) {
      return res.status(403).json({ success: false, message: "Not a student account." });
    }
    const marks = await Marks.find({ studentId: req.user.studentId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, marks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch marks", error: error.message });
  }
};

const createMarks = async (req, res) => {
  try {
    if (req.user.role === "STUDENT") {
      return res.status(403).json({ success: false, message: "Access denied. Students cannot enter marks." });
    }

    // Support single record or array of records for batch entry
    const entries = Array.isArray(req.body)
      ? req.body
      : req.body.records && Array.isArray(req.body.records)
      ? req.body.records
      : [req.body];

    const saved = [];

    for (const item of entries) {
      if (!item.studentId || !item.subjectName || item.marksObtained === undefined) {
        continue;
      }

      // Upsert: update existing mark for same student + subject + examType
      const query = {
        studentId: item.studentId,
        subjectName: item.subjectName,
        examType: item.examType || "Unit Test",
      };
      if (item.examDate) query.examDate = item.examDate;

      let record = await Marks.findOne(query);
      if (record) {
        record.marksObtained = Number(item.marksObtained);
        if (item.maxMarks !== undefined) record.maxMarks = Number(item.maxMarks);
        if (item.remarks !== undefined) record.remarks = item.remarks;
        if (item.examDate) record.examDate = item.examDate;
        await record.save();
        saved.push(record);
      } else {
        if (!item.studentRef) {
          const st = await Student.findOne({ studentId: item.studentId }).select("_id classStandard section").lean();
          if (st) {
            item.studentRef = st._id;
            item.classStandard = item.classStandard || st.classStandard;
            item.section = item.section || st.section;
          }
        }
        const newRecord = new Marks(item);
        await newRecord.save();
        saved.push(newRecord);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Marks saved successfully.",
      count: saved.length,
      marks: saved.length === 1 ? saved[0] : saved,
    });
  } catch (error) {
    console.error("createMarks error:", error);
    return res.status(500).json({ success: false, message: "Failed to save marks", error: error.message });
  }
};

const updateMarks = async (req, res) => {
  try {
    if (req.user.role === "STUDENT") {
      return res.status(403).json({ success: false, message: "Access denied. Students cannot modify marks." });
    }
    const marks = await Marks.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!marks) return res.status(404).json({ success: false, message: "Marks entry not found" });
    res.status(200).json({ success: true, marks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update marks", error: error.message });
  }
};

const deleteMarks = async (req, res) => {
  try {
    if (req.user.role === "STUDENT") {
      return res.status(403).json({ success: false, message: "Access denied. Students cannot delete marks." });
    }
    const marks = await Marks.findByIdAndDelete(req.params.id);
    if (!marks) return res.status(404).json({ success: false, message: "Marks entry not found" });
    res.status(200).json({ success: true, message: "Marks entry deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete marks", error: error.message });
  }
};

// ─── ATTENDANCE HELPERS & CONTROLLERS ────────────────────────────────────────

const normalizeGrade = (val) => String(val || "").replace(/^Class\s+/i, "").trim();

// Role-based authorization & class scoping helper
const checkUserClassAuthorization = async (user, classStandard, section) => {
  if (!user) return { authorized: false, reason: "Authentication required." };

  // 1. Principal has school-wide authority
  if (user.role === "PRINCIPAL") {
    return { authorized: true };
  }

  // 2. Students can never record or access class-wide attendance
  if (user.role === "STUDENT") {
    return { authorized: false, reason: "Students are not permitted to manage attendance." };
  }

  const normGrade = normalizeGrade(classStandard).toLowerCase();
  const normSec = String(section || "A").trim().toLowerCase();

  // 3. Class Incharge authorization
  if (user.role === "CLASS_INCHARGE") {
    // Check user.assignedClass
    if (user.assignedClass) {
      const cls = await Class.findById(user.assignedClass);
      if (cls) {
        const clsGrade = normalizeGrade(cls.grade || cls.name).toLowerCase();
        if (clsGrade === normGrade) {
          return { authorized: true };
        }
      }
    }

    // Check Class where classIncharge = user._id
    const clsDirect = await Class.findOne({ classIncharge: user._id });
    if (clsDirect) {
      const clsGrade = normalizeGrade(clsDirect.grade || clsDirect.name).toLowerCase();
      if (clsGrade === normGrade) {
        return { authorized: true };
      }
    }

    // Check Class where sections.classIncharge = user._id
    const clsSec = await Class.findOne({ "sections.classIncharge": user._id });
    if (clsSec) {
      const clsGrade = normalizeGrade(clsSec.grade || clsSec.name).toLowerCase();
      if (clsGrade === normGrade) {
        const secObj = clsSec.sections.find(
          (s) => s.classIncharge && s.classIncharge.toString() === user._id.toString()
        );
        if (!secObj || !normSec || secObj.name.trim().toLowerCase() === normSec) {
          return { authorized: true };
        }
      }
    }

    // Check Teacher doc for role === CLASS_INCHARGE
    const teacherDoc = await Teacher.findOne({
      $or: [{ userRef: user._id }, { email: user.email }],
    });
    if (teacherDoc && teacherDoc.assignedClass) {
      const tGrade = normalizeGrade(teacherDoc.assignedClass).toLowerCase();
      if (tGrade === normGrade) {
        return { authorized: true };
      }
    }

    return {
      authorized: false,
      reason: `You are not authorized as Class Incharge for Class ${classStandard} Section ${section || "A"}.`,
    };
  }

  // 4. Subject Teacher authorization
  if (user.role === "SUBJECT_TEACHER") {
    const teacherDoc = await Teacher.findOne({
      $or: [{ userRef: user._id }, { email: user.email }],
    });

    if (!teacherDoc) {
      return { authorized: false, reason: "Teacher profile not found." };
    }

    const assignments = await TeacherAssignment.find({
      teacher: teacherDoc._id,
      isActive: { $ne: false },
    }).populate("class");

    const matched = assignments.some((a) => {
      if (!a.class) return false;
      const aGrade = normalizeGrade(a.class.grade || a.class.name).toLowerCase();
      const aSec = String(a.section || "A").trim().toLowerCase();
      const gradeMatches = aGrade === normGrade;
      const secMatches = !normSec || aSec === normSec;
      return gradeMatches && secMatches;
    });

    if (matched) {
      return { authorized: true, teacherId: teacherDoc.teacherId, teacherName: teacherDoc.fullName };
    }

    if (teacherDoc.assignedClass) {
      const tGrade = normalizeGrade(teacherDoc.assignedClass).toLowerCase();
      if (tGrade === normGrade) {
        return { authorized: true, teacherId: teacherDoc.teacherId, teacherName: teacherDoc.fullName };
      }
    }

    return {
      authorized: false,
      reason: `You are not assigned as a teacher for Class ${classStandard} Section ${section || "A"}.`,
    };
  }

  return { authorized: false, reason: "Unauthorized role for attendance operations." };
};

// Summary metrics calculation helper
const calculateAttendanceSummary = (records) => {
  const presentDays = records.filter((r) => r.status === "Present").length;
  const absentDays = records.filter((r) => r.status === "Absent").length;
  const lateDays = records.filter((r) => r.status === "Late").length;
  const halfDays = records.filter((r) => r.status === "Half Day").length;
  const totalDays = records.length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  return {
    presentDays,
    absentDays,
    lateDays,
    halfDays,
    totalDays,
    attendancePercentage,
  };
};

// Monthly records grouper helper
const groupRecordsByMonth = (records) => {
  const groups = {};
  records.forEach((r) => {
    const dateStr = r.date;
    if (!dateStr) return;
    const parts = dateStr.split("-");
    if (parts.length < 2) return;
    const monthKey = `${parts[0]}-${parts[1]}`;
    const d = new Date(dateStr);
    const monthLabel = !isNaN(d.getTime())
      ? d.toLocaleString("en-US", { month: "short", year: "numeric" })
      : monthKey;

    if (!groups[monthKey]) {
      groups[monthKey] = {
        monthKey,
        monthLabel,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        halfDays: 0,
        totalDays: 0,
        records: [],
      };
    }

    if (r.status === "Present") groups[monthKey].presentDays++;
    else if (r.status === "Absent") groups[monthKey].absentDays++;
    else if (r.status === "Late") groups[monthKey].lateDays++;
    else if (r.status === "Half Day") groups[monthKey].halfDays++;

    groups[monthKey].totalDays++;
    groups[monthKey].records.push(r);
  });

  return Object.values(groups)
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
    .map((g) => ({
      ...g,
      attendancePercentage: g.totalDays > 0 ? Math.round((g.presentDays / g.totalDays) * 100) : 0,
    }));
};

// ─── GET /api/academic/attendance/daily ────────────────────────────────────────
const getClassDailyAttendance = async (req, res) => {
  try {
    const { classStandard, section = "A", date } = req.query;

    if (!classStandard) {
      return res.status(400).json({ success: false, message: "Class standard is required." });
    }

    const auth = await checkUserClassAuthorization(req.user, classStandard, section);
    if (!auth.authorized) {
      return res.status(403).json({ success: false, message: auth.reason });
    }

    const targetDate = date ? String(date).trim() : new Date().toISOString().slice(0, 10);
    const cleanGrade = normalizeGrade(classStandard);

    const studentQuery = {
      $or: [
        { classStandard: cleanGrade },
        { classStandard: `Class ${cleanGrade}` },
        { classStandard: classStandard },
      ],
    };
    if (section) studentQuery.section = section;

    const students = await Student.find(studentQuery).sort({ rollno: 1, studentId: 1 }).lean();
    const studentIds = students.map((s) => s.studentId);

    const records = await Attendance.find({
      studentId: { $in: studentIds },
      date: targetDate,
    }).lean();

    const recordMap = new Map();
    records.forEach((r) => recordMap.set(r.studentId, r));

    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let halfDayCount = 0;
    let unmarkedCount = 0;

    const roster = students.map((st) => {
      const rec = recordMap.get(st.studentId);
      const status = rec ? rec.status : "Unmarked";

      if (status === "Present") presentCount++;
      else if (status === "Absent") absentCount++;
      else if (status === "Late") lateCount++;
      else if (status === "Half Day") halfDayCount++;
      else unmarkedCount++;

      return {
        _id: st._id,
        studentId: st.studentId,
        studentName: st.studentName,
        rollno: st.rollno,
        classStandard: st.classStandard,
        section: st.section || section || "A",
        status,
        remarks: rec?.remarks || "",
        subject: rec?.subject || "",
        attendanceId: rec?._id || null,
        recordingUserId: rec?.recordingUserId || (rec?.recordedBy ? rec.recordedBy.toString() : ""),
        markedBy: rec?.markedBy || "",
        updatedAt: rec?.updatedAt || null,
      };
    });

    const totalStudents = students.length;
    const markedTotal = totalStudents - unmarkedCount;
    const attendancePercentage =
      totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

    return res.status(200).json({
      success: true,
      date: targetDate,
      classStandard,
      section,
      summary: {
        totalStudents,
        markedTotal,
        presentCount,
        absentCount,
        lateCount,
        halfDayCount,
        unmarkedCount,
        attendancePercentage,
      },
      students: roster,
    });
  } catch (error) {
    console.error("getClassDailyAttendance error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch daily attendance.",
      error: error.message,
    });
  }
};

// ─── GET /api/academic/attendance/monthly ──────────────────────────────────────
const getClassMonthlyAttendance = async (req, res) => {
  try {
    const { classStandard, section = "A", month, studentId } = req.query;

    // Student scope restriction
    if (req.user.role === "STUDENT") {
      const myStudentId = req.user.studentId;
      if (studentId && studentId !== myStudentId) {
        return res.status(403).json({ success: false, message: "Access denied. You can only view your own attendance." });
      }

      const targetMonth = month && month !== "ALL" ? month : new Date().toISOString().slice(0, 7);
      const query = { studentId: myStudentId };
      if (month && month !== "ALL") {
        query.date = { $regex: new RegExp(`^${targetMonth}-\\d{2}`) };
      }

      const records = await Attendance.find(query).sort({ date: -1 }).lean();
      const summary = calculateAttendanceSummary(records);
      const monthlyGroups = groupRecordsByMonth(records);

      return res.status(200).json({
        success: true,
        month: targetMonth,
        studentId: myStudentId,
        summary,
        monthlyGroups,
        records,
      });
    }

    // Faculty scope validation
    if (!classStandard && !studentId) {
      return res.status(400).json({ success: false, message: "Class standard or student ID is required." });
    }

    if (classStandard) {
      const auth = await checkUserClassAuthorization(req.user, classStandard, section);
      if (!auth.authorized) {
        return res.status(403).json({ success: false, message: auth.reason });
      }
    }

    const targetMonth = month && month !== "ALL" ? month : new Date().toISOString().slice(0, 7);
    const cleanGrade = classStandard ? normalizeGrade(classStandard) : null;

    let students = [];
    if (studentId) {
      const st = await Student.findOne({ studentId }).lean();
      if (!st) return res.status(404).json({ success: false, message: "Student not found." });
      // Validate access to student's class
      const auth = await checkUserClassAuthorization(req.user, st.classStandard, st.section);
      if (!auth.authorized) return res.status(403).json({ success: false, message: auth.reason });
      students = [st];
    } else {
      const studentQuery = {
        $or: [
          { classStandard: cleanGrade },
          { classStandard: `Class ${cleanGrade}` },
          { classStandard: classStandard },
        ],
      };
      if (section) studentQuery.section = section;
      students = await Student.find(studentQuery).sort({ rollno: 1, studentId: 1 }).lean();
    }

    const studentIds = students.map((s) => s.studentId);
    const dateRegex = new RegExp(`^${targetMonth}-\\d{2}`);

    const attendanceRecords = await Attendance.find({
      studentId: { $in: studentIds },
      date: { $regex: dateRegex },
    }).sort({ date: 1 }).lean();

    // Map records by studentId
    const studentRecordsMap = new Map();
    attendanceRecords.forEach((r) => {
      if (!studentRecordsMap.has(r.studentId)) {
        studentRecordsMap.set(r.studentId, []);
      }
      studentRecordsMap.get(r.studentId).push(r);
    });

    let classTotalPresent = 0;
    let classTotalAbsent = 0;
    let classTotalLate = 0;
    let classTotalHalfDay = 0;
    let classTotalRecords = 0;
    const uniqueDates = new Set();

    const studentSummaries = students.map((st) => {
      const recs = studentRecordsMap.get(st.studentId) || [];
      const stats = calculateAttendanceSummary(recs);

      recs.forEach((r) => {
        uniqueDates.add(r.date);
        if (r.status === "Present") classTotalPresent++;
        else if (r.status === "Absent") classTotalAbsent++;
        else if (r.status === "Late") classTotalLate++;
        else if (r.status === "Half Day") classTotalHalfDay++;
        classTotalRecords++;
      });

      return {
        _id: st._id,
        studentId: st.studentId,
        studentName: st.studentName,
        rollno: st.rollno,
        classStandard: st.classStandard,
        section: st.section || section || "A",
        presentDays: stats.presentDays,
        absentDays: stats.absentDays,
        lateDays: stats.lateDays,
        halfDays: stats.halfDays,
        totalDays: stats.totalDays,
        attendancePercentage: stats.attendancePercentage,
        records: recs,
      };
    });

    const averagePercentage =
      classTotalRecords > 0 ? Math.round((classTotalPresent / classTotalRecords) * 100) : 0;

    return res.status(200).json({
      success: true,
      month: targetMonth,
      classStandard: classStandard || (students[0]?.classStandard || "N/A"),
      section: section || (students[0]?.section || "A"),
      classSummary: {
        totalStudents: students.length,
        totalSessions: uniqueDates.size,
        totalPresent: classTotalPresent,
        totalAbsent: classTotalAbsent,
        totalLate: classTotalLate,
        totalHalfDay: classTotalHalfDay,
        averagePercentage,
      },
      students: studentSummaries,
    });
  } catch (error) {
    console.error("getClassMonthlyAttendance error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch monthly attendance summary.",
      error: error.message,
    });
  }
};

// ─── GET /api/academic/attendance/student/:studentId ──────────────────────────
const getAttendanceByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Student restricted to own records
    if (req.user.role === "STUDENT") {
      if (req.user.studentId !== studentId) {
        return res.status(403).json({ success: false, message: "Access denied. Students can only view their own attendance." });
      }
    } else {
      // Faculty scope check
      const studentDoc = await Student.findOne({ studentId }).lean();
      if (!studentDoc) {
        return res.status(404).json({ success: false, message: "Student record not found." });
      }
      const auth = await checkUserClassAuthorization(req.user, studentDoc.classStandard, studentDoc.section);
      if (!auth.authorized) {
        return res.status(403).json({ success: false, message: auth.reason });
      }
    }

    const attendance = await Attendance.find({ studentId }).sort({ date: -1 }).lean();
    const stats = calculateAttendanceSummary(attendance);
    const monthlySummary = groupRecordsByMonth(attendance);

    res.status(200).json({
      success: true,
      studentId,
      stats,
      monthlySummary,
      attendance,
    });
  } catch (error) {
    console.error("getAttendanceByStudent error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch student attendance", error: error.message });
  }
};

// ─── GET /api/academic/attendance/me (Student Portal) ──────────────────────────
const getMyAttendance = async (req, res) => {
  try {
    if (!req.user.studentId) {
      return res.status(403).json({ success: false, message: "Not a student account." });
    }

    const attendance = await Attendance.find({ studentId: req.user.studentId }).sort({ date: -1 }).lean();
    const stats = calculateAttendanceSummary(attendance);
    const monthlySummary = groupRecordsByMonth(attendance);

    res.status(200).json({
      success: true,
      studentId: req.user.studentId,
      stats,
      monthlySummary,
      attendance,
    });
  } catch (error) {
    console.error("getMyAttendance error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch student attendance", error: error.message });
  }
};

// ─── POST /api/academic/attendance (Single Record / Correction) ─────────────────
const markAttendance = async (req, res) => {
  try {
    if (req.user.role === "STUDENT") {
      return res.status(403).json({ success: false, message: "Access denied. Students cannot record attendance." });
    }

    const { studentId, date, status, subject, remarks, classStandard, section } = req.body;

    if (!studentId || !date || !status) {
      return res.status(400).json({ success: false, message: "Student ID, date, and status are required." });
    }

    const studentDoc = await Student.findOne({ studentId }).lean();
    const targetClass = classStandard || studentDoc?.classStandard;
    const targetSection = section || studentDoc?.section || "A";

    // Validate authority for this class & section
    if (targetClass) {
      const auth = await checkUserClassAuthorization(req.user, targetClass, targetSection);
      if (!auth.authorized) {
        return res.status(403).json({ success: false, message: auth.reason });
      }
    }

    const recordingUserId = req.user._id.toString();
    const recordedBy = req.user._id;
    const markedBy = req.user.name || "Faculty";

    // Check for existing record to perform authorized correction and avoid duplicates
    let record = await Attendance.findOne({ studentId, date });
    const isCorrection = Boolean(record);

    if (record) {
      record.status = status;
      if (subject !== undefined) record.subject = subject;
      if (remarks !== undefined) record.remarks = remarks;
      if (targetClass) record.classStandard = targetClass;
      if (targetSection) record.section = targetSection;
      record.recordingUserId = recordingUserId;
      record.recordedBy = recordedBy;
      record.markedBy = markedBy;
      await record.save();
    } else {
      record = new Attendance({
        studentId,
        studentRef: studentDoc?._id || null,
        classStandard: targetClass,
        section: targetSection,
        date,
        status,
        subject: subject || "",
        remarks: remarks || "",
        recordingUserId,
        recordedBy,
        markedBy,
      });
      await record.save();
    }

    return res.status(200).json({
      success: true,
      isCorrection,
      message: isCorrection ? "Attendance record updated successfully." : "Attendance marked successfully.",
      attendance: record,
    });
  } catch (error) {
    console.error("markAttendance error:", error);
    return res.status(500).json({ success: false, message: "Failed to mark attendance", error: error.message });
  }
};

// ─── POST /api/academic/attendance/bulk (Class Daily Roster Entry / Bulk) ──────
const bulkMarkAttendance = async (req, res) => {
  try {
    if (req.user.role === "STUDENT") {
      return res.status(403).json({ success: false, message: "Access denied. Students cannot record attendance." });
    }

    const { classStandard, section = "A", date, records } = req.body;

    const entries = Array.isArray(records)
      ? records
      : Array.isArray(req.body)
      ? req.body
      : [];

    if (entries.length === 0) {
      return res.status(400).json({ success: false, message: "No attendance records provided." });
    }

    // Determine target class & section for authorization check
    const sampleClass = classStandard || entries[0]?.classStandard;
    const sampleSection = section || entries[0]?.section || "A";

    if (sampleClass) {
      const auth = await checkUserClassAuthorization(req.user, sampleClass, sampleSection);
      if (!auth.authorized) {
        return res.status(403).json({ success: false, message: auth.reason });
      }
    }

    const recordingUserId = req.user._id.toString();
    const recordedBy = req.user._id;
    const markedBy = req.user.name || "Faculty";

    // Pre-fetch student docs to populate references
    const studentIds = entries.map((e) => e.studentId).filter(Boolean);
    const studentDocs = await Student.find({ studentId: { $in: studentIds } }).lean();
    const studentMap = new Map();
    studentDocs.forEach((s) => studentMap.set(s.studentId, s));

    const savedRecords = [];

    for (const r of entries) {
      if (!r.studentId) continue;
      const recDate = r.date || date || new Date().toISOString().slice(0, 10);
      const studentDoc = studentMap.get(r.studentId);
      const rowClass = r.classStandard || classStandard || studentDoc?.classStandard;
      const rowSec = r.section || section || studentDoc?.section || "A";

      let record = await Attendance.findOne({ studentId: r.studentId, date: recDate });

      if (record) {
        // Authorized correction / update existing
        record.status = r.status || record.status;
        if (r.subject !== undefined) record.subject = r.subject;
        if (r.remarks !== undefined) record.remarks = r.remarks;
        if (rowClass) record.classStandard = rowClass;
        if (rowSec) record.section = rowSec;
        record.recordingUserId = recordingUserId;
        record.recordedBy = recordedBy;
        record.markedBy = markedBy;
        await record.save();
        savedRecords.push(record);
      } else {
        record = new Attendance({
          studentId: r.studentId,
          studentRef: studentDoc?._id || null,
          classStandard: rowClass,
          section: rowSec,
          date: recDate,
          status: r.status || "Present",
          subject: r.subject || "",
          remarks: r.remarks || "",
          recordingUserId,
          recordedBy,
          markedBy,
        });
        await record.save();
        savedRecords.push(record);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully saved attendance for ${savedRecords.length} student(s).`,
      count: savedRecords.length,
      attendance: savedRecords,
    });
  } catch (error) {
    console.error("bulkMarkAttendance error:", error);
    return res.status(500).json({ success: false, message: "Failed to save bulk attendance", error: error.message });
  }
};

// ─── DELETE /api/academic/attendance/:id ──────────────────────────────────────
const deleteAttendance = async (req, res) => {
  try {
    if (req.user.role === "STUDENT") {
      return res.status(403).json({ success: false, message: "Access denied. Students cannot delete attendance." });
    }

    const record = await Attendance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Attendance record not found." });
    }

    // Check scope authorization
    if (record.classStandard) {
      const auth = await checkUserClassAuthorization(req.user, record.classStandard, record.section);
      if (!auth.authorized) {
        return res.status(403).json({ success: false, message: auth.reason });
      }
    }

    await Attendance.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: "Attendance record deleted successfully." });
  } catch (error) {
    console.error("deleteAttendance error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete attendance", error: error.message });
  }
};

module.exports = {
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getMyAcademics,
  getMarksByStudent,
  getMyMarks,
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
};
