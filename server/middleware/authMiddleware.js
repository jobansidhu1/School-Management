const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_jwt_secret");

      let user = await User.findById(decoded.id).select("-password");
      
      if (!user) {
        const Student = require("../models/Student");
        user = await Student.findById(decoded.id).select("-password");
        if (user) {
          user.role = "STUDENT"; // Attach role for role-based access control
        }
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found or token invalid.",
        });
      }

      if (user.isActive !== undefined && !user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Account is deactivated. Please contact administration.",
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("JWT Verification error:", error.message);
      return res.status(401).json({
        success: false,
        message: "Not authorized, token invalid or expired.",
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided.",
    });
  }
};

module.exports = { protect };
