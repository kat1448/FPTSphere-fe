// ========================================
// REGION: IMPORTS
// ========================================
import apiClient from "./api.js";

// ========================================
// REGION: CONFIGURATION
// ========================================
/**
 * Users API Endpoints
 * Base URL được config trong api.js từ environment variable VITE_API_BASE_URL
 * Mặc định: https://localhost:7273/api
 */
const USERS_ENDPOINT = "/Users";

// ========================================
// REGION: API CALL FUNCTIONS
// ========================================
/**
 * Get users by role ID
 * 
 * API Endpoint: GET /Users/role/{roleId}
 * 
 * Example: GET /Users/role/2 (for Directors)
 * 
 * Response format:
 * {
 *   "success": true,
 *   "message": "Users retrieved successfully",
 *   "data": [
 *     {
 *       "userId": 1,
 *       "fullName": "Director Name",
 *       "email": "director@example.com",
 *       ...
 *     }
 *   ]
 * }
 * 
 * @param {number} roleId - Role ID (e.g., 2 for Directors)
 * @returns {Promise<Array>} Array of users
 */
export const getUsersByRole = async (roleId) => {
  try {
    if (!roleId) {
      throw new Error("Role ID is required");
    }

    console.log(`📤 Fetching users with role ID: ${roleId}`);

    const response = await apiClient.get(`${USERS_ENDPOINT}/role/${roleId}`, {
      headers: {
        Accept: "*/*",
      },
    });

    // Status 200 (OK): Success
    if (response.status === 200) {
      console.log(`✅ Users retrieved successfully:`, response.data);

      // Handle API response format: {success, message, data}
      if (response.data?.success !== undefined) {
        return response.data.data || response.data;
      }
      return Array.isArray(response.data) ? response.data : [];
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error("❌ Get users by role error:", error);

    // Handle validation errors
    if (error.response?.status === 400) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || "Invalid role ID";
      throw new Error(errorMessage);
    }

    // Handle not found errors
    if (error.response?.status === 404) {
      return []; // Return empty array if no users found
    }

    // Handle network errors
    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message || error.message || "Failed to fetch users";
    throw new Error(errorMessage);
  }
};

/**
 * Get all users with pagination
 * 
 * API Endpoint: GET /Users
 * 
 * Response format:
 * {
 *   "success": true,
 *   "message": "Retrieved 3 users successfully",
 *   "data": {
 *     "data": [...],
 *     "totalRecords": 3,
 *     "page": 1,
 *     "pageSize": 10,
 *     "totalPages": 1,
 *     "hasPreviousPage": false,
 *     "hasNextPage": false
 *   }
 * }
 * 
 * @returns {Promise<Object>} Paginated users data
 */
export const getAllUsers = async () => {
  try {
    console.log("📤 Fetching all users");

    const response = await apiClient.get(USERS_ENDPOINT, {
      headers: {
        Accept: "*/*",
      },
    });

    if (response.status === 200) {
      console.log("✅ Users retrieved successfully:", response.data);

      if (response.data?.success !== undefined) {
        return response.data.data || response.data;
      }
      return response.data;
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error("❌ Get all users error:", error);

    if (error.response?.status === 400) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || "Invalid request";
      throw new Error(errorMessage);
    }

    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    const errorMessage =
      error.response?.data?.message || error.message || "Failed to fetch users";
    throw new Error(errorMessage);
  }
};

/**
 * Create new user
 * 
 * API Endpoint: POST /Users
 * 
 * Request body:
 * {
 *   "fullName": "string",
 *   "email": "user@example.com",
 *   "roleId": 3,
 *   "classCode": "string",
 *   "isAuthorized": true
 * }
 * 
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user data
 */
export const createUser = async (userData) => {
  try {
    if (!userData.fullName || !userData.email) {
      throw new Error("Full name and email are required");
    }

    console.log("📤 Creating user with payload:", userData);

    const response = await apiClient.post(USERS_ENDPOINT, userData, {
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
      },
    });

    if (response.status === 200 || response.status === 201) {
      console.log("✅ User created successfully:", response.data);

      if (response.data?.success !== undefined) {
        return response.data.data || response.data;
      }
      return response.data;
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error("❌ Create user error:", error);

    if (error.response?.status === 400) {
      const errorData = error.response.data;
      if (errorData.errors) {
        const errorMessages = [];
        Object.keys(errorData.errors).forEach((field) => {
          const fieldErrors = errorData.errors[field];
          if (Array.isArray(fieldErrors)) {
            fieldErrors.forEach((msg) => errorMessages.push(`${field}: ${msg}`));
          } else {
            errorMessages.push(`${field}: ${fieldErrors}`);
          }
        });
        throw new Error(errorMessages.join("\n"));
      }
      const errorMessage = errorData?.message || "Validation failed";
      throw new Error(errorMessage);
    }

    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    const errorMessage =
      error.response?.data?.message || error.message || "Failed to create user";
    throw new Error(errorMessage);
  }
};

/**
 * Get user by ID
 * 
 * API Endpoint: GET /Users/{id}
 * 
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User data
 */
export const getUserById = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    console.log(`📤 Fetching user by ID: ${userId}`);

    const response = await apiClient.get(`${USERS_ENDPOINT}/${userId}`, {
      headers: {
        Accept: "*/*",
      },
    });

    if (response.status === 200) {
      console.log("✅ User retrieved successfully:", response.data);

      if (response.data?.success !== undefined) {
        return response.data.data || response.data;
      }
      return response.data;
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error(`❌ Get user by ID error (ID: ${userId}):`, error);

    if (error.response?.status === 400 || error.response?.status === 404) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || "User not found";
      throw new Error(errorMessage);
    }

    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    const errorMessage =
      error.response?.data?.message || error.message || "Failed to fetch user";
    throw new Error(errorMessage);
  }
};

/**
 * Update user
 * 
 * API Endpoint: PUT /Users/{id}
 * 
 * @param {number} userId - User ID
 * @param {Object} userData - Updated user data
 * @returns {Promise<Object>} Updated user data
 */
export const updateUser = async (userId, userData) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    console.log(`📤 Updating user ${userId} with payload:`, userData);

    const response = await apiClient.put(`${USERS_ENDPOINT}/${userId}`, userData, {
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
      },
    });

    if (response.status === 200) {
      console.log("✅ User updated successfully:", response.data);

      if (response.data?.success !== undefined) {
        return response.data.data || response.data;
      }
      return response.data;
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error(`❌ Update user error (ID: ${userId}):`, error);

    if (error.response?.status === 400) {
      const errorData = error.response.data;
      if (errorData.errors) {
        const errorMessages = [];
        Object.keys(errorData.errors).forEach((field) => {
          const fieldErrors = errorData.errors[field];
          if (Array.isArray(fieldErrors)) {
            fieldErrors.forEach((msg) => errorMessages.push(`${field}: ${msg}`));
          } else {
            errorMessages.push(`${field}: ${fieldErrors}`);
          }
        });
        throw new Error(errorMessages.join("\n"));
      }
      const errorMessage = errorData?.message || "Validation failed";
      throw new Error(errorMessage);
    }

    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    const errorMessage =
      error.response?.data?.message || error.message || "Failed to update user";
    throw new Error(errorMessage);
  }
};

/**
 * Delete user (soft delete)
 * 
 * API Endpoint: DELETE /Users/{id}
 * 
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteUser = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    console.log(`📤 Deleting user ${userId}`);

    const response = await apiClient.delete(`${USERS_ENDPOINT}/${userId}`, {
      headers: {
        Accept: "*/*",
      },
    });

    if (response.status === 200 || response.status === 204) {
      console.log("✅ User deleted successfully:", response.data);
      return response.data || { success: true };
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error(`❌ Delete user error (ID: ${userId}):`, error);

    if (error.response?.status === 400 || error.response?.status === 404) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || "User not found";
      throw new Error(errorMessage);
    }

    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    const errorMessage =
      error.response?.data?.message || error.message || "Failed to delete user";
    throw new Error(errorMessage);
  }
};

/**
 * Get user by email
 * 
 * API Endpoint: GET /Users/email/{email}
 * 
 * @param {string} email - User email
 * @returns {Promise<Object>} User data
 */
export const getUserByEmail = async (email) => {
  try {
    if (!email) {
      throw new Error("Email is required");
    }

    const encodedEmail = encodeURIComponent(email);
    console.log(`📤 Fetching user by email: ${email}`);

    const response = await apiClient.get(`${USERS_ENDPOINT}/email/${encodedEmail}`, {
      headers: {
        Accept: "*/*",
      },
    });

    if (response.status === 200) {
      console.log("✅ User retrieved successfully:", response.data);

      if (response.data?.success !== undefined) {
        return response.data.data || response.data;
      }
      return response.data;
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error(`❌ Get user by email error (Email: ${email}):`, error);

    if (error.response?.status === 400 || error.response?.status === 404) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || "User not found";
      throw new Error(errorMessage);
    }

    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    const errorMessage =
      error.response?.data?.message || error.message || "Failed to fetch user";
    throw new Error(errorMessage);
  }
};

/**
 * Get all roles
 * 
 * API Endpoint: GET /Users/roles
 * 
 * Response format:
 * {
 *   "success": true,
 *   "message": "Retrieved 5 roles successfully",
 *   "data": [
 *     {
 *       "roleId": 1,
 *       "roleName": "Admin"
 *     },
 *     ...
 *   ]
 * }
 * 
 * @returns {Promise<Array>} Array of roles
 */
export const getRoles = async () => {
  try {
    console.log("📤 Fetching roles");

    const response = await apiClient.get(`${USERS_ENDPOINT}/roles`, {
      headers: {
        Accept: "*/*",
      },
    });

    if (response.status === 200) {
      console.log("✅ Roles retrieved successfully:", response.data);

      if (response.data?.success !== undefined) {
        return response.data.data || response.data;
      }
      return Array.isArray(response.data) ? response.data : [];
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error("❌ Get roles error:", error);

    if (error.response?.status === 400) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || "Invalid request";
      throw new Error(errorMessage);
    }

    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    const errorMessage =
      error.response?.data?.message || error.message || "Failed to fetch roles";
    throw new Error(errorMessage);
  }
};

/**
 * Search users
 * 
 * API Endpoint: GET /Users/search?searchTerm={term}
 * 
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Array of matching users
 */
export const searchUsers = async (searchTerm) => {
  try {
    if (!searchTerm || searchTerm.trim() === "") {
      return [];
    }

    console.log(`📤 Searching users with term: ${searchTerm}`);

    const response = await apiClient.get(`${USERS_ENDPOINT}/search`, {
      params: {
        searchTerm: searchTerm.trim(),
      },
      headers: {
        Accept: "*/*",
      },
    });

    if (response.status === 200) {
      console.log("✅ Users search completed:", response.data);

      if (response.data?.success !== undefined) {
        return response.data.data || response.data;
      }
      return Array.isArray(response.data) ? response.data : [];
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error(`❌ Search users error (Term: ${searchTerm}):`, error);

    if (error.response?.status === 400) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || "Invalid search term";
      throw new Error(errorMessage);
    }

    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    const errorMessage =
      error.response?.data?.message || error.message || "Failed to search users";
    throw new Error(errorMessage);
  }
};

// ========================================
// REGION: EXPORTS
// ========================================
export default {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  getUserByEmail,
  getUsersByRole,
  getRoles,
  searchUsers,
};
