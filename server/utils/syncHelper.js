const User = require("../models/User");
const Teacher = require("../models/Teacher");
const Class = require("../models/Class");
const TeacherAssignment = require("../models/TeacherAssignment");

/**
 * Resolves a teacher ID or user ID to both a User document and a Teacher document.
 */
const resolveUserAndTeacher = async (teacherOrUserId) => {
  if (!teacherOrUserId || teacherOrUserId === "" || teacherOrUserId === "null") {
    return { user: null, teacher: null };
  }

  let user = null;
  let teacher = null;

  // 1. Check User by ID
  if (String(teacherOrUserId).match(/^[0-9a-fA-F]{24}$/)) {
    user = await User.findById(teacherOrUserId);
    teacher = await Teacher.findById(teacherOrUserId);
  }

  // 2. Link user to teacher
  if (user && !teacher) {
    teacher = await Teacher.findOne({ $or: [{ userRef: user._id }, { email: user.email.toLowerCase().trim() }] });
  }

  // 3. Link teacher to user
  if (teacher && !user) {
    if (teacher.userRef) {
      user = await User.findById(teacher.userRef);
    }
    if (!user) {
      user = await User.findOne({ email: teacher.email.toLowerCase().trim() });
    }
  }

  // 4. If teacher exists but no User, auto-create User account
  if (teacher && !user) {
    user = new User({
      name: teacher.fullName.trim(),
      email: teacher.email.toLowerCase().trim(),
      password: "Teacher@123",
      role: teacher.role === "CLASS_INCHARGE" ? "CLASS_INCHARGE" : "SUBJECT_TEACHER",
      isActive: teacher.accountStatus !== "Inactive" && teacher.accountStatus !== "Suspended",
    });
    await user.save();
    teacher.userRef = user._id;
    await teacher.save();
  }

  // 5. If user exists but no Teacher, auto-create Teacher account
  if (user && !teacher) {
    const count = await Teacher.countDocuments();
    const teacherId = `TCH${String(count + 101).padStart(3, "0")}`;
    teacher = new Teacher({
      teacherId,
      fullName: user.name,
      email: user.email.toLowerCase().trim(),
      role: user.role === "CLASS_INCHARGE" ? "CLASS_INCHARGE" : "SUBJECT_TEACHER",
      userRef: user._id,
      accountStatus: user.isActive ? "Active" : "Inactive",
    });
    await teacher.save();
  }

  return { user, teacher };
};

/**
 * Ensures a User account exists for a Teacher record and syncs roles & assignedClass across User, Teacher, and Class.
 */
const syncTeacherToUserAndClass = async (teacherObj, targetClassIdOrName = null, targetSection = null) => {
  if (!teacherObj) return;

  const email = teacherObj.email?.toLowerCase().trim();
  if (!email) return;

  const { user, teacher } = await resolveUserAndTeacher(teacherObj._id || teacherObj.userRef || email);
  if (!teacher) return;

  const isClassIncharge = teacherObj.role === "CLASS_INCHARGE";

  if (isClassIncharge) {
    if (user) {
      user.role = "CLASS_INCHARGE";
      if (teacher.fullName) user.name = teacher.fullName.trim();
      if (teacher.accountStatus) {
        user.isActive = teacher.accountStatus !== "Inactive" && teacher.accountStatus !== "Suspended";
      }
    }

    // Resolve target class
    let assignedClassDoc = null;
    let secName = targetSection;
    const classLookup = targetClassIdOrName || teacherObj.assignedClass;

    if (classLookup) {
      // Check for compound classId__SectionName format
      if (typeof classLookup === "string" && classLookup.includes("__")) {
        const [cId, sName] = classLookup.split("__");
        assignedClassDoc = await Class.findById(cId);
        secName = sName;
      } else if (String(classLookup).match(/^[0-9a-fA-F]{24}$/)) {
        assignedClassDoc = await Class.findById(classLookup);
      } else if (typeof classLookup === "string") {
        // e.g. "Class 6 (Section A)" or "Class 6"
        const secMatch = classLookup.match(/^(.*?)\s*\((.*?)\)$/);
        if (secMatch) {
          const className = secMatch[1].trim();
          secName = secMatch[2].trim();
          assignedClassDoc = await Class.findOne({ name: new RegExp(`^${className}$`, "i") });
        } else {
          assignedClassDoc = await Class.findOne({ name: new RegExp(`^${classLookup.trim()}$`, "i") });
        }
      }
    }

    if (assignedClassDoc) {
      if (user) user.assignedClass = assignedClassDoc._id;

      if (secName && assignedClassDoc.hasSections && assignedClassDoc.sections && assignedClassDoc.sections.length > 0) {
        // Section assignment
        let matchedSec = assignedClassDoc.sections.find(
          (s) => s.name.toLowerCase() === secName.toLowerCase() || s.name.endsWith(` ${secName}`)
        );
        if (!matchedSec) {
          matchedSec = assignedClassDoc.sections[0];
        }

        // Unassign old incharge of that section if different
        if (matchedSec.classIncharge && user && matchedSec.classIncharge.toString() !== user._id.toString()) {
          const prevUserId = matchedSec.classIncharge;
          await unassignInchargeIfNoOtherClasses(prevUserId, assignedClassDoc._id);
        }

        if (user) matchedSec.classIncharge = user._id;
        await assignedClassDoc.save();

        teacher.assignedClass = `${assignedClassDoc.name} (${matchedSec.name})`;
      } else {
        // Whole class assignment
        if (assignedClassDoc.classIncharge && user && assignedClassDoc.classIncharge.toString() !== user._id.toString()) {
          const prevUserId = assignedClassDoc.classIncharge;
          await unassignInchargeIfNoOtherClasses(prevUserId, assignedClassDoc._id);
        }

        if (user) assignedClassDoc.classIncharge = user._id;
        await assignedClassDoc.save();

        teacher.assignedClass = assignedClassDoc.name;
      }
    } else {
      if (user) user.assignedClass = null;
      teacher.assignedClass = "";
    }

    teacher.role = "CLASS_INCHARGE";
    if (user) await user.save();
    await teacher.save();
  } else {
    // Role is SUBJECT_TEACHER
    if (user) {
      user.role = "SUBJECT_TEACHER";
      user.assignedClass = null;
      await user.save();

      // Clear from any classes where this user was incharge
      await Class.updateMany({ classIncharge: user._id }, { classIncharge: null });
      await Class.updateMany(
        { "sections.classIncharge": user._id },
        { $set: { "sections.$[elem].classIncharge": null } },
        { arrayFilters: [{ "elem.classIncharge": user._id }] }
      );
    }

    teacher.role = "SUBJECT_TEACHER";
    teacher.assignedClass = "";
    await teacher.save();
    await syncTeacherAssignmentsToTeacherDoc(teacher._id);
  }
};

/**
 * Helper to unassign an incharge from user and teacher models if they have no other assigned classes.
 */
const unassignInchargeIfNoOtherClasses = async (userId, excludeClassId = null) => {
  if (!userId) return;

  const query = { _id: { $ne: excludeClassId }, $or: [{ classIncharge: userId }, { "sections.classIncharge": userId }] };
  const otherClass = await Class.findOne(query);

  if (!otherClass) {
    await User.findByIdAndUpdate(userId, { assignedClass: null, role: "SUBJECT_TEACHER" });
    const t = await Teacher.findOne({ userRef: userId });
    if (t) {
      t.role = "SUBJECT_TEACHER";
      t.assignedClass = "";
      await t.save();
      await syncTeacherAssignmentsToTeacherDoc(t._id);
    }
  }
};

/**
 * Ensures a Teacher record exists for a User account and syncs across User, Teacher, and Class.
 */
const syncUserToTeacherAndClass = async (userObj, targetClassId = null, targetSection = null) => {
  if (!userObj) return;

  const { user, teacher } = await resolveUserAndTeacher(userObj._id);
  if (!user || !teacher) return;

  let assignedClassName = "";
  let classDoc = null;
  let secName = targetSection;

  const classIdToAssign = targetClassId !== undefined ? targetClassId : user.assignedClass;

  if (classIdToAssign) {
    let actualClassId = classIdToAssign;
    if (typeof classIdToAssign === "string" && classIdToAssign.includes("__")) {
      const [cId, sName] = classIdToAssign.split("__");
      actualClassId = cId;
      secName = sName;
    }

    if (String(actualClassId).match(/^[0-9a-fA-F]{24}$/)) {
      classDoc = await Class.findById(actualClassId);
    }

    if (classDoc) {
      user.role = "CLASS_INCHARGE";
      teacher.role = "CLASS_INCHARGE";
      user.assignedClass = classDoc._id;

      if (secName && classDoc.hasSections && classDoc.sections && classDoc.sections.length > 0) {
        let matchedSec = classDoc.sections.find(
          (s) => s.name.toLowerCase() === secName.toLowerCase() || s.name.endsWith(` ${secName}`)
        );
        if (!matchedSec) matchedSec = classDoc.sections[0];

        // Unassign previous incharge if different
        if (matchedSec.classIncharge && matchedSec.classIncharge.toString() !== user._id.toString()) {
          await unassignInchargeIfNoOtherClasses(matchedSec.classIncharge, classDoc._id);
        }

        matchedSec.classIncharge = user._id;
        assignedClassName = `${classDoc.name} (${matchedSec.name})`;
        await classDoc.save();
      } else {
        // Unassign previous whole class incharge
        if (classDoc.classIncharge && classDoc.classIncharge.toString() !== user._id.toString()) {
          await unassignInchargeIfNoOtherClasses(classDoc.classIncharge, classDoc._id);
        }

        classDoc.classIncharge = user._id;
        assignedClassName = classDoc.name;
        await classDoc.save();
      }

      teacher.assignedClass = assignedClassName;
    }
  } else {
    // Unassign from any classes
    await Class.updateMany({ classIncharge: user._id }, { classIncharge: null });
    await Class.updateMany(
      { "sections.classIncharge": user._id },
      { $set: { "sections.$[elem].classIncharge": null } },
      { arrayFilters: [{ "elem.classIncharge": user._id }] }
    );
    user.assignedClass = null;
    teacher.assignedClass = "";
  }

  teacher.fullName = user.name;
  teacher.email = user.email.toLowerCase().trim();
  teacher.role = user.role;
  teacher.accountStatus = user.isActive ? "Active" : "Inactive";
  teacher.userRef = user._id;

  await user.save();
  await teacher.save();

  return { user, teacher, classDoc };
};

/**
 * Directly assigns or unassigns a Class Incharge to a Class or Section from the Classes section.
 */
const assignClassInchargeToClass = async (classId, teacherOrUserId, sectionName = null) => {
  const targetClass = await Class.findById(classId);
  if (!targetClass) {
    throw new Error("Class not found.");
  }

  // Case 1: Unassign incharge
  if (!teacherOrUserId || teacherOrUserId === "" || teacherOrUserId === "null") {
    if (sectionName && targetClass.hasSections && targetClass.sections) {
      const sec = targetClass.sections.find((s) => s.name === sectionName || s.name.endsWith(` ${sectionName}`));
      if (sec && sec.classIncharge) {
        const oldId = sec.classIncharge;
        sec.classIncharge = null;
        await targetClass.save();
        await unassignInchargeIfNoOtherClasses(oldId);
      }
    } else {
      const oldId = targetClass.classIncharge;
      targetClass.classIncharge = null;
      await targetClass.save();
      if (oldId) await unassignInchargeIfNoOtherClasses(oldId);
    }
    return targetClass;
  }

  // Case 2: Assign incharge
  const { user, teacher } = await resolveUserAndTeacher(teacherOrUserId);
  if (!user || !teacher) {
    throw new Error("Target teacher or user account not found.");
  }

  // Promote User & Teacher
  user.role = "CLASS_INCHARGE";
  user.assignedClass = targetClass._id;
  await user.save();

  teacher.role = "CLASS_INCHARGE";
  teacher.userRef = user._id;

  if (sectionName && targetClass.hasSections && targetClass.sections && targetClass.sections.length > 0) {
    let sec = targetClass.sections.find((s) => s.name === sectionName || s.name.endsWith(` ${sectionName}`));
    if (!sec) sec = targetClass.sections[0];

    if (sec.classIncharge && sec.classIncharge.toString() !== user._id.toString()) {
      await unassignInchargeIfNoOtherClasses(sec.classIncharge, targetClass._id);
    }

    sec.classIncharge = user._id;
    teacher.assignedClass = `${targetClass.name} (${sec.name})`;
    await targetClass.save();
  } else {
    if (targetClass.classIncharge && targetClass.classIncharge.toString() !== user._id.toString()) {
      await unassignInchargeIfNoOtherClasses(targetClass.classIncharge, targetClass._id);
    }

    targetClass.classIncharge = user._id;
    teacher.assignedClass = targetClass.name;
    await targetClass.save();
  }

  await teacher.save();
  return targetClass;
};

/**
 * Synchronizes sections array and updates incharge records for each section.
 */
const syncSectionIncharges = async (classDoc, sectionsInput) => {
  if (!classDoc || !Array.isArray(sectionsInput)) return classDoc;

  const resolvedSections = [];
  const activeInchargeUserIds = new Set();

  for (const sec of sectionsInput) {
    let resolvedUserId = null;
    if (sec.classIncharge) {
      const { user, teacher } = await resolveUserAndTeacher(sec.classIncharge);
      if (user) {
        resolvedUserId = user._id;
        activeInchargeUserIds.add(user._id.toString());

        user.role = "CLASS_INCHARGE";
        user.assignedClass = classDoc._id;
        await user.save();

        if (teacher) {
          teacher.role = "CLASS_INCHARGE";
          teacher.assignedClass = `${classDoc.name} (${sec.name.trim()})`;
          teacher.userRef = user._id;
          await teacher.save();
        }
      }
    }
    resolvedSections.push({
      name: sec.name.trim(),
      classIncharge: resolvedUserId || null,
    });
  }

  // Check previous section incharges who might now be unassigned
  if (classDoc.sections && classDoc.sections.length > 0) {
    for (const oldSec of classDoc.sections) {
      if (oldSec.classIncharge && !activeInchargeUserIds.has(oldSec.classIncharge.toString())) {
        await unassignInchargeIfNoOtherClasses(oldSec.classIncharge, classDoc._id);
      }
    }
  }

  classDoc.sections = resolvedSections;
  await classDoc.save();
  return classDoc;
};

/**
 * Syncs active subject assignments from TeacherAssignment collection to Teacher document.
 */
const syncTeacherAssignmentsToTeacherDoc = async (teacherId) => {
  if (!teacherId) return;

  const assignments = await TeacherAssignment.find({ teacher: teacherId, isActive: true })
    .populate("class", "name");

  const subjects = [...new Set(assignments.map((a) => a.subject).filter(Boolean))];
  const teacher = await Teacher.findById(teacherId);

  if (teacher) {
    teacher.assignedSubjects = subjects;
    // If not a class incharge, set assignedClass to teaching classes
    if (teacher.role !== "CLASS_INCHARGE") {
      const classes = [...new Set(assignments.map((a) => (a.class ? a.class.name : "")).filter(Boolean))];
      if (classes.length > 0) {
        teacher.assignedClass = classes.join(", ");
      }
    }
    await teacher.save();
  }
};

module.exports = {
  resolveUserAndTeacher,
  syncTeacherToUserAndClass,
  syncUserToTeacherAndClass,
  assignClassInchargeToClass,
  syncSectionIncharges,
  syncTeacherAssignmentsToTeacherDoc,
  unassignInchargeIfNoOtherClasses,
};
