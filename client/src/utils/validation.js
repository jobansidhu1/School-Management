/**
 * Validates email format using standard regex pattern.
 * @param {string} email 
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates password length.
 * @param {string} password 
 * @param {number} minLength 
 * @returns {boolean}
 */
export const validatePassword = (password, minLength = 6) => {
  if (!password || typeof password !== "string") return false;
  return password.trim().length >= minLength;
};

/**
 * Validates login credentials form data.
 * Supports email address, username, or student ID.
 * @param {object} formData - { email, password }
 * @returns {{ isValid: boolean, errors: object }}
 */
export const validateLoginForm = ({ email, password }) => {
  const errors = {};

  if (!email || !email.trim()) {
    errors.email = "Student ID, Username, or Email is required.";
  }

  if (!password) {
    errors.password = "Password is required.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
