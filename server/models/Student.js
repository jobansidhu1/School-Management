const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
    },
    rollno: {
      type: String,
      required: true,
      trim: true,
    },
    dob: {
      type: String,
      trim: true,
    },
    age: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    guardianNo: {
      type: String,
      trim: true,
    },
    classStandard: {
      type: String,
      trim: true,
    },
    section: {
      type: String,
      trim: true,
      default: "A",
    },
    classRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },
    password: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

studentSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

studentSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Student", studentSchema);
