// ========================================
// REGION: IMPORTS
// ========================================
import apiClient from "./api.js";

// ========================================
// REGION: CONFIGURATION
// ========================================
/**
 * Resources API Endpoints
 * Base URL được config trong api.js từ environment variable VITE_API_BASE_URL
 * Mặc định: https://localhost:7273/api
 */
const RESOURCES_ENDPOINT = "/Resources";

// ========================================
// REGION: API CALL FUNCTIONS
// ========================================
/**
 * Get list of resources with pagination
 * 
 * API Endpoint: GET /Resources?page=1&pageSize=10&sortBy=Name&sortDescending=false
 * 
 * @param {Object} params - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.pageSize=10] - Items per page
 * @param {string} [params.sortBy=Name] - Sort field
 * @param {boolean} [params.sortDescending=false] - Sort direction
 * @returns {Promise<Object>} Resources data
 */
export const getResources = async (params = {}) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      sortBy = "Name",
      sortDescending = false,
    } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      sortBy,
      sortDescending: sortDescending.toString(),
    });

    const response = await apiClient.get(
      `${RESOURCES_ENDPOINT}?${queryParams.toString()}`
    );

    if (response.status === 200) {
      // Handle API response format: {success, message, data}
      if (response.data?.success !== undefined) {
        return response.data.data || response.data;
      }
      return response.data;
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error("❌ Get resources error:", error);
    throw error;
  }
};

/**
 * Get resource by ID
 * 
 * API Endpoint: GET /Resources/{id}
 * 
 * @param {number} resourceId - Resource ID
 * @returns {Promise<Object>} Resource data
 */
export const getResourceById = async (resourceId) => {
  try {
    if (!resourceId) {
      throw new Error("Resource ID is required");
    }

    const response = await apiClient.get(`${RESOURCES_ENDPOINT}/${resourceId}`, {
      headers: {
        Accept: "*/*",
      },
    });

    if (response.status === 200) {
      // Handle API response format: {success, message, data}
      if (response.data?.success !== undefined) {
        return response.data.data || response.data;
      }
      return response.data;
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error(`❌ Get resource by ID error (ID: ${resourceId}):`, error);
    throw error;
  }
};

/**
 * Create new resource
 * 
 * API Endpoint: POST /Resources
 * 
 * Request body:
 * {
 *   "name": "string",
 *   "type": "string",
 *   "quantity": 10000,
 *   "imageUrl": "string"
 * }
 * 
 * @param {Object} resourceData - Resource data
 * @param {string} resourceData.name - Resource name
 * @param {string} resourceData.type - Resource type
 * @param {number} resourceData.quantity - Quantity
 * @param {string} [resourceData.imageUrl] - Image URL
 * @returns {Promise<Object>} Created resource data
 */
export const createResource = async (resourceData) => {
  try {
    // Validate required fields
    if (!resourceData.name || resourceData.name.trim() === "") {
      throw new Error("Resource name is required");
    }

    if (!resourceData.type || resourceData.type.trim() === "") {
      throw new Error("Resource type is required");
    }

    if (!resourceData.quantity || resourceData.quantity < 0) {
      throw new Error("Quantity must be at least 0");
    }

    const requestBody = {
      name: resourceData.name.trim(),
      type: resourceData.type.trim(),
      quantity: Number(resourceData.quantity),
      imageUrl: resourceData.imageUrl || "null",
    };

    console.log("📤 Creating resource with payload:", requestBody);

    const response = await apiClient.post(RESOURCES_ENDPOINT, requestBody, {
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
      },
    });

    // Status 200 (OK) or 201 (Created): Success
    if (response.status === 200 || response.status === 201) {
      console.log("✅ Resource created successfully:", response.data);

      // Handle API response format: {success, message, data}
      if (response.data?.success !== undefined) {
        return response.data.data || response.data;
      }
      return response.data;
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error("❌ Create resource error:", error);

    // Handle validation errors
    if (error.response?.status === 400) {
      const errorData = error.response.data;
      const errorMessage =
        errorData.message || errorData.title || "Validation failed";
      throw new Error(errorMessage);
    }

    // Handle network errors
    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message || error.message || "Failed to create resource";
    throw new Error(errorMessage);
  }
};

/**
 * Update resource
 * 
 * API Endpoint: PUT /Resources/{id}
 * 
 * Request body:
 * {
 *   "name": "string",
 *   "type": "string",
 *   "quantity": 10000,
 *   "imageUrl": "string"
 * }
 * 
 * @param {number} resourceId - Resource ID
 * @param {Object} resourceData - Updated resource data
 * @returns {Promise<Object>} Updated resource data
 */
export const updateResource = async (resourceId, resourceData) => {
  try {
    if (!resourceId) {
      throw new Error("Resource ID is required");
    }

    if (!resourceData.name || resourceData.name.trim() === "") {
      throw new Error("Resource name is required");
    }

    if (!resourceData.type || resourceData.type.trim() === "") {
      throw new Error("Resource type is required");
    }

    if (resourceData.quantity === undefined || resourceData.quantity < 0) {
      throw new Error("Quantity must be at least 0");
    }

    const requestBody = {
      name: resourceData.name.trim(),
      type: resourceData.type.trim(),
      quantity: Number(resourceData.quantity),
      imageUrl: resourceData.imageUrl || "null",
    };

    console.log(`📤 Updating resource ${resourceId} with payload:`, requestBody);

    const response = await apiClient.put(`${RESOURCES_ENDPOINT}/${resourceId}`, requestBody, {
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
      },
    });

    if (response.status === 200) {
      console.log("✅ Resource updated successfully:", response.data);

      // Handle API response format: {success, message, data}
      if (response.data?.success !== undefined) {
        return response.data.data || response.data;
      }
      return response.data;
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error(`❌ Update resource error (ID: ${resourceId}):`, error);

    // Handle validation errors
    if (error.response?.status === 400) {
      const errorData = error.response.data;
      const errorMessage =
        errorData.message || errorData.title || "Validation failed";
      throw new Error(errorMessage);
    }

    // Handle network errors
    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message || error.message || "Failed to update resource";
    throw new Error(errorMessage);
  }
};

/**
 * Delete (deactivate) resource
 * 
 * API Endpoint: DELETE /Resources/{id}
 * 
 * @param {number} resourceId - Resource ID
 * @returns {Promise<Object>} Deactivated resource data
 */
export const deleteResource = async (resourceId) => {
  try {
    if (!resourceId) {
      throw new Error("Resource ID is required");
    }

    console.log(`📤 Deleting resource ${resourceId}`);

    const response = await apiClient.delete(`${RESOURCES_ENDPOINT}/${resourceId}`, {
      headers: {
        Accept: "*/*",
      },
    });

    if (response.status === 200) {
      console.log("✅ Resource deleted successfully:", response.data);

      // Handle API response format: {success, message, data}
      if (response.data?.success !== undefined) {
        return response.data.data || response.data;
      }
      return response.data;
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error(`❌ Delete resource error (ID: ${resourceId}):`, error);

    // Handle validation errors
    if (error.response?.status === 400 || error.response?.status === 404) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || "Resource not found";
      throw new Error(errorMessage);
    }

    // Handle network errors
    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message || error.message || "Failed to delete resource";
    throw new Error(errorMessage);
  }
};

/**
 * Get available quantity for a resource
 * 
 * API Endpoint: GET /Resources/{id}/available-quantity
 * 
 * @param {number} resourceId - Resource ID
 * @returns {Promise<number>} Available quantity
 */
export const getAvailableQuantity = async (resourceId) => {
  try {
    if (!resourceId) {
      throw new Error("Resource ID is required");
    }

    const response = await apiClient.get(
      `${RESOURCES_ENDPOINT}/${resourceId}/available-quantity`,
      {
        headers: {
          Accept: "*/*",
        },
      }
    );

    if (response.status === 200) {
      // Handle API response format: {success, message, data}
      if (response.data?.success !== undefined) {
        return response.data.data || 0;
      }
      return response.data || 0;
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error(`❌ Get available quantity error (ID: ${resourceId}):`, error);
    throw error;
  }
};

/**
 * Search resources by term
 * 
 * API Endpoint: GET /Resources/search?term={term}
 * 
 * @param {string} term - Search term
 * @returns {Promise<Array>} Array of matching resources
 */
export const searchResources = async (term) => {
  try {
    if (!term || term.trim() === "") {
      return [];
    }

    const queryParams = new URLSearchParams({
      term: term.trim(),
    });

    const response = await apiClient.get(
      `${RESOURCES_ENDPOINT}/search?${queryParams.toString()}`
    );

    if (response.status === 200) {
      // Handle API response format: {success, message, data}
      if (response.data?.success !== undefined) {
        const data = response.data.data;
        return Array.isArray(data) ? data : [];
      }
      return Array.isArray(response.data) ? response.data : [];
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error("❌ Search resources error:", error);
    throw error;
  }
};

// ========================================
// REGION: EXPORTS
// ========================================
export default {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  getAvailableQuantity,
  searchResources,
};
