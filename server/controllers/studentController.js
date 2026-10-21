const Student = require("../models/Student");

// Helper: generate username from classStandard, name and rollno
// Format: class standard + first 3 letters of student's name + roll number (e.g. Class 12, Jobanpreet, 13 -> 12job13)
const generateUsername = (classStandard, name, rollno) => {
  const nameClean = (name || "").replace(/[^a-zA-Z]/g, "");
  const namePart = nameClean.slice(0, 3).toLowerCase();
  const classClean = (classStandard || "")
    .toString()
    .toLowerCase()
    .replace(/class/g, "")
    .replace(/th|st|nd|rd/g, "")
    .replace(/[^0-9a-z]/g, "");
  const rollClean = (rollno || "")
    .toString()
    .replace(/[^0-9a-zA-Z]/g, "")
    .toLowerCase();

  return (classClean + namePart + rollClean) || namePart;
};

const generatePassword = (id, dob) => {
  if (!dob) return id ? `pass${id}` : "student123";
  const parts = dob.split("-");
  if (parts.length === 3) {
    return parseInt(parts[0], 10) + "" + parseInt(parts[1], 10) + "" + parts[2];
  }
  return dob.replace(/[^0-9]/g, "").replace(/^0/, "") || "student123";
};

const getAllStudents = async (req, res) => {
  try {
    const { classStandard, section, classRef } = req.query;
    // If logged-in user is a student, restrict to their own data only
    let query = {};
    if (req.user && req.user.role === "STUDENT") {
      query = { _id: req.user._id };
    } else {
      if (classStandard) query.classStandard = classStandard;
      if (section) query.section = section;
      if (classRef) query.classRef = classRef;
    }
    const students = await Student.find(query).sort({ rollno: 1, studentName: 1 });
    res.status(200).json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch students", error: error.message });
  }
};

const createStudent = async (req, res) => {
  try {
    const existingStudent = await Student.findOne({ studentId: req.body.studentId });
    if (existingStudent) {
      return res.status(400).json({ success: false, message: "Student ID already exists." });
    }

    // Auto-generate username if not provided
    if (!req.body.username) {
      req.body.username = generateUsername(req.body.classStandard, req.body.studentName, req.body.rollno);
    }
    if (!req.body.password) {
      req.body.password = generatePassword(req.body.studentId, req.body.dob);
    }

    const student = new Student(req.body);
    await student.save();
    res.status(201).json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create student", error: error.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // Re-generate username if name or rollno or classStandard changed
    if (!req.body.username && (req.body.studentName || req.body.rollno || req.body.classStandard)) {
      const existing = await Student.findById(id);
      const cls = req.body.classStandard !== undefined ? req.body.classStandard : existing?.classStandard;
      const name = req.body.studentName || existing?.studentName;
      const rollno = req.body.rollno || existing?.rollno;
      req.body.username = generateUsername(cls, name, rollno);
    }

    const student = await Student.findByIdAndUpdate(id, req.body, { new: true });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }
    res.status(200).json({ success: true, student });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update student", error: error.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndDelete(id);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }
    res.status(200).json({ success: true, message: "Student deleted successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete student", error: error.message });
  }
};

const bulkImportStudents = async (req, res) => {
  try {
    const { students } = req.body;
    if (!students || students.length === 0) {
      return res.status(400).json({ success: false, message: "No students data provided." });
    }

    const insertedStudents = [];
    const errors = [];

    for (let i = 0; i < students.length; i++) {
      const studentData = { ...students[i] };
      if (!studentData.studentId) continue;

      // CRITICAL: Remove frontend-generated fake _id so MongoDB generates a real ObjectId
      delete studentData._id;

      // Auto-generate username
      if (!studentData.username) {
        studentData.username = generateUsername(studentData.classStandard, studentData.studentName, studentData.rollno);
      }
      // Auto-generate password
      if (!studentData.password) {
        studentData.password = generatePassword(studentData.studentId, studentData.dob);
      }

      try {
        let student = await Student.findOne({ studentId: studentData.studentId }).select("+password");
        if (student) {
          // Update existing — use set to avoid _id conflicts
          Object.keys(studentData).forEach((key) => {
            if (key !== '_id') {
              // Only overwrite password if explicitly provided or student has none
              if (key === 'password' && student.password && !studentData.passwordExplicit) return;
              student[key] = studentData[key];
            }
          });
          if (!student.password) {
            student.password = generatePassword(student.studentId, student.dob);
          }
          await student.save();
        } else {
          student = new Student(studentData);
          await student.save();
        }
        insertedStudents.push(student);
      } catch (err) {
        errors.push(`Error processing student ${studentData.studentId}: ${err.message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: `Imported ${insertedStudents.length} students.`,
      students: insertedStudents,
      errors
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Bulk import failed", error: error.message });
  }
};

module.exports = {
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkImportStudents
};
