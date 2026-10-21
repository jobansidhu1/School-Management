const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password.",
      });
    }

    // Find user and explicitly select password field, populate assignedClass
    let user = await User.findOne({ email: email.toLowerCase().trim() })
      .select("+password")
      .populate("assignedClass", "name grade section");

    let isStudent = false;

    if (!user) {
      // Check if it's a student (students use studentId or username or email to log in)
      const Student = require("../models/Student");
      const trimmedCredential = email.trim();
      const regexMatch = new RegExp(`^${trimmedCredential.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i');
      user = await Student.findOne({ 
        $or: [
          { username: regexMatch },
          { studentId: regexMatch }
        ]
      }).select("+password");
      if (user) {
        isStudent = true;
        user.role = "STUDENT";
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    // Check account status for staff only
    if (!isStudent && user.isActive !== undefined && !user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Please contact administrator.",
      });
    }

    // Match password
    let isMatch = false;
    if (user.password) {
      isMatch = await user.matchPassword(password);
    }
    
    // Fallback: If student record exists without a saved password hash, match against default/DOB pattern
    if (!isMatch && isStudent) {
      let expectedPassword = user.studentId ? `pass${user.studentId}` : "student123";
      if (user.dob) {
        const parts = user.dob.split("-");
        if (parts.length === 3) {
          expectedPassword = parseInt(parts[0], 10) + "" + parseInt(parts[1], 10) + "" + parts[2];
        } else {
          expectedPassword = user.dob.replace(/[^0-9]/g, "").replace(/^0/, "");
        }
      }
      if (password === expectedPassword || (user.dob && password === user.dob)) {
        isMatch = true;
        // Save the matched password hashed for future logins
        user.password = password;
        await user.save();
      }
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    // Generate JWT Token
    const token = generateToken(user._id, user.role);

    if (isStudent) {
      return res.status(200).json({
        success: true,
        message: "Login successful.",
        token,
        user: {
          _id: user._id,
          name: user.studentName,
          studentName: user.studentName,
          email: user.username,
          username: user.username,
          role: "STUDENT",
          studentId: user.studentId,
          rollno: user.rollno,
          classStandard: user.classStandard,
          section: user.section,
          dob: user.dob,
          age: user.age,
          gender: user.gender,
          address: user.address,
          guardianNo: user.guardianNo,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        education: user.education || "",
        isActive: user.isActive,
        assignedClass: user.assignedClass || null,
      },
    });
  } catch (error) {
    console.error("Login controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during authentication.",
      error: error.message,
    });
  }
};

// @desc    Get currently logged-in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    if (req.user.role === "STUDENT") {
      return res.status(200).json({
        success: true,
        user: {
          _id: req.user._id,
          name: req.user.studentName,
          studentName: req.user.studentName,
          email: req.user.username,
          username: req.user.username,
          role: "STUDENT",
          studentId: req.user.studentId,
          rollno: req.user.rollno,
          classStandard: req.user.classStandard,
          section: req.user.section,
          dob: req.user.dob,
          age: req.user.age,
          gender: req.user.gender,
          address: req.user.address,
          guardianNo: req.user.guardianNo,
        },
      });
    }

    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("assignedClass", "name grade section");

    return res.status(200).json({
      success: true,
      user: user || req.user,
    });
  } catch (error) {
    console.error("getMe controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching user profile.",
      error: error.message,
    });
  }
};

// @desc    Update logged-in user's profile (name, email, education, password)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, email, education, password } = req.body;

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Check if email is being changed and is already taken by someone else
    if (email && email.toLowerCase().trim() !== user.email) {
      const emailExists = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: user._id },
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email address is already in use by another account.",
        });
      }
      user.email = email.toLowerCase().trim();
    }

    if (name && name.trim()) {
      user.name = name.trim();
    }

    if (education !== undefined) {
      user.education = education.trim();
    }

    if (password && password.trim()) {
      if (password.trim().length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long.",
        });
      }
      user.password = password.trim();
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        education: user.education || "",
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("updateProfile controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating profile.",
      error: error.message,
    });
  }
};

module.exports = {
  login,
  getMe,
  updateProfile,
};
