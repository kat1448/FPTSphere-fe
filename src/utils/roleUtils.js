/**
 * Utility functions for role-based navigation and permissions
 */

/**
 * Get dashboard path based on roleId or roleName
 * 
 * @param {number|null} roleId - User's role ID (1=Admin, 2=Director, 3=Event Manager, 4=Staff, 5=Student)
 * @param {string|null} roleName - User's role name (fallback if roleId is not available)
 * @returns {string} Dashboard path
 */
export const getDashboardPath = (roleId, roleName) => {
  // Priority: Check roleId first
  if (roleId === 1 || roleName === "Admin") {
    return "/admin/dashboard";
  } else if (roleId === 2 || roleName === "Director") {
    return "/admin/dashboard"; // Director uses admin dashboard (full permissions)
  } else if (roleId === 3 || roleName === "Event Manager") {
    return "/manager/dashboard";
  } else if (roleId === 4 || roleName === "Staff") {
    return "/staff/dashboard";
  }
  // Default: Students and other roles go to home page
  return "/";
};

/**
 * Check if user has access to a route based on roleId
 * 
 * @param {number|string|null} userRoleId - User's role ID (can be number or string)
 * @param {Array<number>} allowedRoleIds - Array of allowed role IDs
 * @returns {boolean} True if user has access
 */
export const hasRoleAccess = (userRoleId, allowedRoleIds) => {
  if (!userRoleId || !allowedRoleIds || allowedRoleIds.length === 0) {
    return false;
  }
  
  // Normalize userRoleId to number for comparison
  const normalizedUserRoleId = Number(userRoleId);
  const normalizedAllowedRoleIds = allowedRoleIds.map(id => Number(id));
  
  return normalizedAllowedRoleIds.includes(normalizedUserRoleId);
};

/**
 * Map roleName to roleId
 * 
 * @param {string} roleName - Role name
 * @returns {number|null} Role ID or null if not found
 */
export const getRoleIdByName = (roleName) => {
  const roleMap = {
    "Admin": 1,
    "Director": 2,
    "Event Manager": 3,
    "Staff": 4,
    "Student": 5
  };
  return roleMap[roleName] || null;
};

/**
 * Map roleId to roleName
 * 
 * @param {number} roleId - Role ID
 * @returns {string|null} Role name or null if not found
 */
export const getRoleNameById = (roleId) => {
  const roleMap = {
    1: "Admin",
    2: "Director",
    3: "Event Manager",
    4: "Staff",
    5: "Student"
  };
  return roleMap[roleId] || null;
};
