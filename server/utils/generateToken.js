const jwt = require("jsonwebtoken");

const generateToken = (userId, role) => {
  const secret = process.env.JWT_SECRET || "default_jwt_secret";
  return jwt.sign(
    { id: userId, role: role },
    secret,
    { expiresIn: "30d" }
  );
};

module.exports = generateToken;
