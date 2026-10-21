export const ROLES = {
  PRINCIPAL: "PRINCIPAL",
  CLASS_INCHARGE: "CLASS_INCHARGE",
  SUBJECT_TEACHER: "SUBJECT_TEACHER",
  STUDENT: "STUDENT",
};

/**
 * Check if current user is a Principal.
 * @param {object} user 
 * @returns {boolean}
 */
export const isPrincipal = (user) => {
  return user?.role === ROLES.PRINCIPAL;
};

/**
 * Check if current user has any of the specified roles.
 * @param {object} user 
 * @param {string|string[]} allowedRoles 
 * @returns {boolean}
 */
export const hasRole = (user, allowedRoles) => {
  if (!user || !user.role) return false;
  if (Array.isArray(allowedRoles)) {
    return allowedRoles.includes(user.role);
  }
  return user.role === allowedRoles;
};
