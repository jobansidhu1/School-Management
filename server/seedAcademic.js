/**
 * Seed script: adds demo subjects, marks, and attendance for the first student in MongoDB.
 * Run from /server directory: node seedAcademic.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Student = require("./models/Student");
const Subject = require("./models/Subject");
const Marks = require("./models/Marks");
const Attendance = require("./models/Attendance");

const SUBJECT_LIST = [
  { name: "Mathematics", code: "MATH", maxMarks: 100 },
  { name: "English", code: "ENG", maxMarks: 100 },
  { name: "Science", code: "SCI", maxMarks: 100 },
  { name: "Social Studies", code: "SST", maxMarks: 100 },
  { name: "Computer Science", code: "CS", maxMarks: 100 },
  { name: "Physical Education", code: "PE", maxMarks: 50 },
];

async function seed() {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/school_test_db";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB:", mongoUri);

  const students = await Student.find({}).limit(5);
  if (!students.length) {
    console.log("No students found. Please add students first.");
    process.exit(0);
  }

  for (const student of students) {
    const cls = student.classStandard || "10";
    const sec = student.section || "A";
    console.log(`\nProcessing: ${student.studentName} (${student.studentId})`);

    // Create subjects for this class if they don't exist
    for (const subj of SUBJECT_LIST) {
      let existing = await Subject.findOne({ name: subj.name, classStandard: cls, section: sec });
      if (!existing) {
        existing = await Subject.create({ ...subj, classStandard: cls, section: sec });
        console.log(`  Created subject: ${subj.name}`);
      }

      // Add marks for 3 exam types
      const examTypes = ["Unit Test", "Mid Term", "Final Exam"];
      for (const examType of examTypes) {
        const exists = await Marks.findOne({ studentId: student.studentId, subjectName: subj.name, examType });
        if (!exists) {
          const maxM = subj.maxMarks;
          const marksObtained = Math.floor(Math.random() * (maxM * 0.35) + (maxM * 0.55));
          await Marks.create({
            studentId: student.studentId,
            studentRef: student._id,
            subjectName: subj.name,
            classStandard: cls,
            section: sec,
            examType,
            marksObtained,
            maxMarks: maxM,
            examDate: new Date(Date.now() - Math.random() * 90 * 24 * 3600000).toISOString().slice(0, 10),
          });
          console.log(`  Marks: ${subj.name} ${examType}: ${marksObtained}/${maxM}`);
        }
      }
    }

    // Create attendance for last 30 days
    let attCount = 0;
    for (let i = 0; i < 30; i++) {
      const date = new Date(Date.now() - i * 24 * 3600000).toISOString().slice(0, 10);
      const exists = await Attendance.findOne({ studentId: student.studentId, date });
      if (!exists) {
        const rand = Math.random();
        const status = rand < 0.82 ? "Present" : rand < 0.90 ? "Late" : rand < 0.96 ? "Half Day" : "Absent";
        await Attendance.create({
          studentId: student.studentId,
          studentRef: student._id,
          classStandard: cls,
          section: sec,
          date,
          status,
        });
        attCount++;
      }
    }
    if (attCount > 0) console.log(`  Created ${attCount} attendance records`);
  }

  console.log("\nSeeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
