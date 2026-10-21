const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ["PRINCIPAL", "CLASS_INCHARGE", "SUBJECT_TEACHER", "STUDENT"],
        message: "Role must be PRINCIPAL, CLASS_INCHARGE, SUBJECT_TEACHER, or STUDENT",
      },
      required: [true, "Role is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    assignedClass: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },
    education: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
