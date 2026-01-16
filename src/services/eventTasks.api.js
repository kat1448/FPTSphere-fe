// ========================================
// REGION: IMPORTS
// ========================================
import apiClient from "./api.js";

// ========================================
// REGION: CONFIGURATION
// ========================================
/**
 * EventTasks API Endpoints
 * Base URL được config trong api.js từ environment variable VITE_API_BASE_URL
 * Mặc định: https://localhost:7273/api
 */
const EVENT_TASKS_ENDPOINT = "/EventTasks";

// ========================================
// REGION: API CALL FUNCTIONS
// ========================================
/**
 * Create new event task
 * 
 * API Endpoint: POST /EventTasks
 * 
 * Request body:
 * {
 *   "eventId": 3,
 *   "assignedTo": 4,
 *   "title": "Prepare event materials",
 *   "description": "Chuẩn bị tài liệu cho sự kiện",
 *   "status": "Todo",
 *   "startDate": "2026-01-11T09:00:00",
 *   "dueDate": "2026-01-11T17:00:00",
 *   "isTemplate": false,
 *   "parentTaskId": null
 * }
 * 
 * Response format:
 * {
 *   "success": true,
 *   "message": "Task created successfully",
 *   "data": {
 *     "taskId": 1,
 *     "eventId": 3,
 *     "assignedTo": 4,
 *     "assignedToName": "Test Director 2 ",
 *     "title": "Prepare event materials",
 *     "description": "Chuẩn bị tài liệu cho sự kiện",
 *     "status": "Todo",
 *     "startDate": "2026-01-11T09:00:00",
 *     "dueDate": "2026-01-11T17:00:00",
 *     "completedAt": null,
 *     "report": null,
 *     "assignBy": 2,
 *     "assignByName": "Dev_Admin",
 *     "isTemplate": false,
 *     "parentTaskId": null
 *   }
 * }
 * 
 * @param {Object} taskData - Task data object
 * @param {number} taskData.eventId - Event ID
 * @param {number} taskData.assignedTo - User ID to assign task to
 * @param {string} taskData.title - Task title
 * @param {string} [taskData.description] - Task description
 * @param {string} [taskData.status] - Task status (default: "Todo")
 * @param {string} taskData.startDate - Start date (format: YYYY-MM-DDTHH:mm:ss)
 * @param {string} taskData.dueDate - Due date (format: YYYY-MM-DDTHH:mm:ss)
 * @param {boolean} [taskData.isTemplate] - Is template task (default: false)
 * @param {number} [taskData.parentTaskId] - Parent task ID (default: null)
 * @returns {Promise<Object>} Created task data
 */
export const createEventTask = async (taskData) => {
  try {
    // Validate required fields
    if (!taskData.eventId) {
      throw new Error("Event ID is required");
    }

    if (!taskData.assignedTo) {
      throw new Error("Assigned to user ID is required");
    }

    if (!taskData.title || taskData.title.trim() === "") {
      throw new Error("Task title is required");
    }

    if (!taskData.startDate) {
      throw new Error("Start date is required");
    }

    if (!taskData.dueDate) {
      throw new Error("Due date is required");
    }

    // Format datetime: YYYY-MM-DDTHH:mm:ss
    const formatDateTime = (dayjsObj) => {
      if (!dayjsObj) return null;
      return dayjsObj.format("YYYY-MM-DDTHH:mm:ss");
    };

    const requestBody = {
      eventId: Number(taskData.eventId),
      assignedTo: Number(taskData.assignedTo),
      title: taskData.title.trim(),
      description: taskData.description || null,
      status: taskData.status || "Todo",
      startDate: typeof taskData.startDate === "string" 
        ? taskData.startDate 
        : formatDateTime(taskData.startDate),
      dueDate: typeof taskData.dueDate === "string" 
        ? taskData.dueDate 
        : formatDateTime(taskData.dueDate),
      isTemplate: taskData.isTemplate || false,
      parentTaskId: taskData.parentTaskId ? Number(taskData.parentTaskId) : null,
    };

    console.log("📤 Creating event task with payload:", requestBody);

    const response = await apiClient.post(EVENT_TASKS_ENDPOINT, requestBody, {
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
      },
    });

    // Status 200 (OK) or 201 (Created): Success
    if (response.status === 200 || response.status === 201) {
      console.log("✅ Event task created successfully:", response.data);

      // Handle API response format: {success, message, data}
      if (response.data?.success !== undefined) {
        return response.data.data || response.data;
      }
      return response.data;
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error("❌ Create event task error:", error);

    // Handle validation errors
    if (error.response?.status === 400) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || errorData?.title || "Validation failed";
      throw new Error(errorMessage);
    }

    // Handle network errors
    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message || error.message || "Failed to create event task";
    throw new Error(errorMessage);
  }
};

/**
 * Get tasks by event ID
 * 
 * API Endpoint: GET /EventTasks?eventId={eventId}
 * 
 * @param {number} eventId - Event ID
 * @returns {Promise<Array>} Array of tasks
 */
export const getTasksByEventId = async (eventId) => {
  try {
    if (!eventId) {
      throw new Error("Event ID is required");
    }

    console.log(`📤 Fetching tasks for event ID: ${eventId}`);

    const response = await apiClient.get(EVENT_TASKS_ENDPOINT, {
      params: { eventId },
      headers: {
        Accept: "*/*",
      },
    });

    // Status 200 (OK): Success
    if (response.status === 200) {
      console.log("✅ Tasks retrieved successfully:", response.data);

      // Handle API response format: {success, message, data}
      if (response.data?.success !== undefined) {
        const data = response.data.data;
        // If data is an array, return it directly
        if (Array.isArray(data)) {
          return data;
        }
        // If data has a data property that's an array
        if (data && Array.isArray(data.data)) {
          return data.data;
        }
        return data || [];
      }
      
      // If response is directly an array
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error(`❌ Get tasks by event ID error (Event ID: ${eventId}):`, error);

    // Handle validation errors
    if (error.response?.status === 400 || error.response?.status === 404) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || "Tasks not found";
      throw new Error(errorMessage);
    }

    // Handle network errors
    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message || error.message || "Failed to fetch tasks";
    throw new Error(errorMessage);
  }
};

/**
 * Get my tasks (tasks assigned to current user)
 * 
 * API Endpoint: GET /EventTasks/my-tasks
 * 
 * Response format:
 * {
 *   "success": true,
 *   "message": "Danh sách task được giao",
 *   "data": [],
 *   "errors": null,
 *   "timestamp": "..."
 * }
 * 
 * @returns {Promise<Array>} Array of tasks assigned to current user
 */
export const getMyTasks = async () => {
  try {
    console.log("📤 Fetching my tasks");

    const response = await apiClient.get(`${EVENT_TASKS_ENDPOINT}/my-tasks`, {
      headers: {
        Accept: "*/*",
      },
    });

    // Status 200 (OK): Success
    if (response.status === 200) {
      console.log("✅ My tasks retrieved successfully:", response.data);

      // Handle API response format: {success, message, data}
      if (response.data?.success !== undefined) {
        const data = response.data.data;
        // If data is an array, return it directly
        if (Array.isArray(data)) {
          return data;
        }
        // If data has a data property that's an array
        if (data && Array.isArray(data.data)) {
          return data.data;
        }
        return data || [];
      }
      
      // If response is directly an array
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error("❌ Get my tasks error:", error);

    // Handle validation errors
    if (error.response?.status === 400 || error.response?.status === 404) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || "Tasks not found";
      throw new Error(errorMessage);
    }

    // Handle network errors
    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message || error.message || "Failed to fetch my tasks";
    throw new Error(errorMessage);
  }
};

/**
 * Get users by role for task assignment
 * 
 * API Endpoint: GET /EventTasks/users-by-role?roleName={roleName}
 * 
 * Response format:
 * {
 *   "success": true,
 *   "message": "Retrieved 2 users with role 'Event Manager'",
 *   "data": [
 *     {
 *       "userId": 1019,
 *       "fullName": "Dev_Event_Manager",
 *       "email": "tungnthe172202@fpt.edu.vn",
 *       "roleName": "Event Manager"
 *     }
 *   ]
 * }
 * 
 * @param {string} roleName - Role name (e.g., "Event Manager", "Staff")
 * @returns {Promise<Array>} Array of users
 */
export const getUsersByRoleForTasks = async (roleName) => {
  try {
    if (!roleName) {
      throw new Error("Role name is required");
    }

    console.log(`📤 Fetching users with role: ${roleName}`);

    const response = await apiClient.get(`${EVENT_TASKS_ENDPOINT}/users-by-role`, {
      params: {
        roleName: roleName,
      },
      headers: {
        Accept: "*/*",
      },
    });

    // Status 200 (OK): Success
    if (response.status === 200) {
      console.log("✅ Users retrieved successfully:", response.data);

      // Handle API response format: {success, message, data}
      if (response.data?.success !== undefined) {
        const data = response.data.data;
        // If data is an array, return it directly
        if (Array.isArray(data)) {
          return data;
        }
        return data || [];
      }
      
      // If response is directly an array
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error(`❌ Get users by role error (Role: ${roleName}):`, error);

    // Handle validation errors
    if (error.response?.status === 400 || error.response?.status === 404) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || "Users not found";
      throw new Error(errorMessage);
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
 * Get my assigned tasks (tasks assigned by current user to others)
 * 
 * API Endpoint: GET /EventTasks/my-assigned-tasks
 * 
 * Response format:
 * {
 *   "success": true,
 *   "message": "Retrieved 1 tasks assigned by you",
 *   "data": [
 *     {
 *       "taskId": 18,
 *       "eventId": 1274,
 *       "assignedTo": 1020,
 *       "assignedToName": "Dev_Staff",
 *       "title": "aaaa",
 *       "description": "aaaa",
 *       "status": "Todo",
 *       "startDate": "2026-01-15T17:00:00",
 *       "dueDate": "2026-01-15T19:00:00",
 *       "completedAt": null,
 *       "report": null,
 *       "assignBy": 1019,
 *       "assignByName": "Dev_Event_Manager",
 *       "isTemplate": false,
 *       "parentTaskId": null
 *     }
 *   ],
 *   "errors": null,
 *   "timestamp": "..."
 * }
 * 
 * @returns {Promise<Array>} Array of tasks assigned by current user
 */
export const getMyAssignedTasks = async () => {
  try {
    console.log("📤 Fetching my assigned tasks");

    const response = await apiClient.get(`${EVENT_TASKS_ENDPOINT}/my-assigned-tasks`, {
      headers: {
        Accept: "*/*",
      },
    });

    // Status 200 (OK): Success
    if (response.status === 200) {
      console.log("✅ My assigned tasks retrieved successfully:", response.data);

      // Handle API response format: {success, message, data}
      if (response.data?.success !== undefined) {
        const data = response.data.data;
        // If data is an array, return it directly
        if (Array.isArray(data)) {
          return data;
        }
        // If data has a data property that's an array
        if (data && Array.isArray(data.data)) {
          return data.data;
        }
        return data || [];
      }
      
      // If response is directly an array
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error("❌ Get my assigned tasks error:", error);

    // Handle validation errors
    if (error.response?.status === 400 || error.response?.status === 404) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || "Tasks not found";
      throw new Error(errorMessage);
    }

    // Handle network errors
    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message || error.message || "Failed to fetch assigned tasks";
    throw new Error(errorMessage);
  }
};

/**
 * Update task status
 * 
 * API Endpoint: PUT /EventTasks/{taskId}/status
 * 
 * Request body:
 * {
 *   "status": "Not Started" | "In Progress" | "Completed"
 * }
 * 
 * @param {number} taskId - Task ID
 * @param {string} status - New status ("Not Started", "In Progress", or "Completed")
 * @returns {Promise<Object>} Updated task data
 */
export const updateTaskStatus = async (taskId, status) => {
  try {
    if (!taskId) {
      throw new Error("Task ID is required");
    }

    if (!status) {
      throw new Error("Status is required");
    }

    // Validate status values
    const validStatuses = ["Not Started", "In Progress", "Completed"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Status must be one of: ${validStatuses.join(", ")}`);
    }

    console.log(`📤 Updating task ${taskId} status to: ${status}`);

    const response = await apiClient.put(
      `${EVENT_TASKS_ENDPOINT}/${taskId}/status`,
      { status }
    );

    console.log(`✅ Task status updated successfully:`, response);

    // Handle response format
    if (response?.success !== undefined) {
      return response.data || response;
    }

    return response;
  } catch (error) {
    console.error(`❌ Update task status error (Task ID: ${taskId}):`, error);
    
    const errorMessage = 
      error.response?.data?.message || 
      error.response?.data?.title ||
      error.message || 
      "Failed to update task status";
    
    throw new Error(errorMessage);
  }
};

/**
 * Delete event task
 * 
 * API Endpoint: DELETE /EventTasks/{taskId}
 * 
 * @param {number} taskId - Task ID
 * @returns {Promise<Object>} Response data
 */
export const deleteEventTask = async (taskId) => {
  try {
    if (!taskId) {
      throw new Error("Task ID is required");
    }

    console.log(`📤 Deleting task ID: ${taskId}`);

    const response = await apiClient.delete(
      `${EVENT_TASKS_ENDPOINT}/${taskId}`
    );

    console.log(`✅ Task deleted successfully:`, response);

    // Handle response format
    if (response?.success !== undefined) {
      return response.data || response;
    }

    return response;
  } catch (error) {
    console.error(`❌ Delete task error (Task ID: ${taskId}):`, error);
    
    const errorMessage = 
      error.response?.data?.message || 
      error.response?.data?.title ||
      error.message || 
      "Failed to delete task";
    
    throw new Error(errorMessage);
  }
};

// ========================================
// REGION: EXPORTS
// ========================================
export default {
  createEventTask,
  getTasksByEventId,
  getMyTasks,
  getUsersByRoleForTasks,
  getMyAssignedTasks,
  updateTaskStatus,
  deleteEventTask,
};
