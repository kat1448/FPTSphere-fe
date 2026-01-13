// ========================================
// REGION: IMPORTS
// ========================================
import apiClient from "./api.js";

// ========================================
// REGION: CONFIGURATION
// ========================================
/**
 * Locations API Endpoints
 * Base URL được config trong api.js từ environment variable VITE_API_BASE_URL
 * Mặc định: https://localhost:7273/api
 */
const LOCATIONS_ENDPOINT = "/Locations";
const LOCATIONS_SEARCH_ENDPOINT = "/Locations/search";

// ========================================
// REGION: API CALL FUNCTIONS
// ========================================
/**
 * Get list of locations with pagination
 * 
 * API Endpoint: GET /Locations?page=1&pageSize=10&sortBy=Name&sortDescending=false
 * 
 * Response format:
 * {
 *   "success": true,
 *   "message": "Retrieved 1 locations",
 *   "data": {
 *     "data": [...],
 *     "totalRecords": 1,
 *     "page": 1,
 *     "pageSize": 10,
 *     "totalPages": 1,
 *     "hasPreviousPage": false,
 *     "hasNextPage": false
 *   }
 * }
 * 
 * @param {Object} params - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.pageSize=10] - Items per page
 * @param {string} [params.sortBy=Name] - Sort field
 * @param {boolean} [params.sortDescending=false] - Sort direction
 * @returns {Promise<Object>} Locations data
 */
export const getLocations = async (params = {}) => {
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
      `${LOCATIONS_ENDPOINT}?${queryParams.toString()}`
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
    console.error("❌ Get locations error:", error);
    throw error;
  }
};

/**
 * Search locations by term
 * 
 * API Endpoint: GET /Locations/search?term=beta
 * 
 * Response format:
 * {
 *   "success": true,
 *   "message": "Found 1 locations",
 *   "data": [...]
 * }
 * 
 * @param {string} term - Search term
 * @returns {Promise<Array>} Array of matching locations
 */
export const searchLocations = async (term) => {
  try {
    if (!term || term.trim() === "") {
      return [];
    }

    const queryParams = new URLSearchParams({
      term: term.trim(),
    });

    const response = await apiClient.get(
      `${LOCATIONS_SEARCH_ENDPOINT}?${queryParams.toString()}`
    );

    if (response.status === 200) {
      // Handle API response format: {success, message, data}
      if (response.data?.success !== undefined) {
        return response.data.data || [];
      }
      return Array.isArray(response.data) ? response.data : [];
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error("❌ Search locations error:", error);
    throw error;
  }
};

/**
 * Get location by ID
 * 
 * API Endpoint: GET /Locations/{id}
 * 
 * Response format:
 * {
 *   "success": true,
 *   "message": "Location retrieved",
 *   "data": {
 *     "locationId": 2,
 *     "name": "ĐH FPT Hà Nội Beta",
 *     "capacity": 10000,
 *     "building": "Beta",
 *     "roomNumber": "BE-201",
 *     "isActive": true,
 *     "imageUrl": "null"
 *   }
 * }
 * 
 * @param {number} locationId - Location ID
 * @returns {Promise<Object>} Location data
 */
export const getLocationById = async (locationId) => {
  try {
    if (!locationId) {
      throw new Error("Location ID is required");
    }

    const response = await apiClient.get(`${LOCATIONS_ENDPOINT}/${locationId}`, {
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
    console.error(`❌ Get location by ID error (ID: ${locationId}):`, error);

    // Handle validation errors
    if (error.response?.status === 400 || error.response?.status === 404) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || "Location not found";
      throw new Error(errorMessage);
    }

    // Handle network errors
    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message || error.message || "Failed to fetch location";
    throw new Error(errorMessage);
  }
};

/**
 * Create new location
 * 
 * API Endpoint: POST /Locations
 * 
 * Request body:
 * {
 *   "name": "ĐH FPT Hà Nội Beta",
 *   "capacity": 10000,
 *   "building": "Beta",
 *   "roomNumber": "BE-201",
 *   "imageUrl": "null"
 * }
 * 
 * Response format:
 * {
 *   "success": true,
 *   "message": "Location created",
 *   "data": {
 *     "locationId": 2,
 *     "name": "ĐH FPT Hà Nội Beta",
 *     "capacity": 10000,
 *     "building": "Beta",
 *     "roomNumber": "BE-201",
 *     "isActive": true,
 *     "imageUrl": "null"
 *   }
 * }
 * 
 * @param {Object} locationData - Location data
 * @param {string} locationData.name - Location name
 * @param {number} locationData.capacity - Capacity
 * @param {string} locationData.building - Building name
 * @param {string} locationData.roomNumber - Room number
 * @param {string} [locationData.imageUrl] - Image URL (optional)
 * @returns {Promise<Object>} Created location data
 */
export const createLocation = async (locationData) => {
  try {
    // Validate required fields
    if (!locationData.name || locationData.name.trim() === "") {
      throw new Error("Location name is required");
    }

    if (!locationData.capacity || locationData.capacity < 1) {
      throw new Error("Capacity must be at least 1");
    }

    if (!locationData.building || locationData.building.trim() === "") {
      throw new Error("Building is required");
    }

    if (!locationData.roomNumber || locationData.roomNumber.trim() === "") {
      throw new Error("Room number is required");
    }

    const requestBody = {
      name: locationData.name.trim(),
      capacity: Number(locationData.capacity),
      building: locationData.building.trim(),
      roomNumber: locationData.roomNumber.trim(),
      imageUrl: locationData.imageUrl || "null",
    };

    console.log("📤 Creating location with payload:", requestBody);

    const response = await apiClient.post(LOCATIONS_ENDPOINT, requestBody, {
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
      },
    });

    // Status 200 (OK) or 201 (Created): Success
    if (response.status === 200 || response.status === 201) {
      console.log("✅ Location created successfully:", response.data);

      // Handle API response format: {success, message, data}
      if (response.data?.success !== undefined) {
        return response.data.data || response.data;
      }
      return response.data;
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error("❌ Create location error:", error);

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
      error.response?.data?.message || error.message || "Failed to create location";
    throw new Error(errorMessage);
  }
};

/**
 * Get locations by building
 * 
 * API Endpoint: GET /Locations/building/{building}
 * 
 * @param {string} building - Building name
 * @returns {Promise<Array>} Array of locations in the building
 */
export const getLocationsByBuilding = async (building) => {
  try {
    if (!building || building.trim() === "") {
      throw new Error("Building name is required");
    }

    const response = await apiClient.get(`${LOCATIONS_ENDPOINT}/building/${encodeURIComponent(building)}`, {
      headers: {
        Accept: "*/*",
      },
    });

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
    console.error(`❌ Get locations by building error (Building: ${building}):`, error);
    throw error;
  }
};

/**
 * Get available locations
 * 
 * API Endpoint: GET /Locations/available?startTime={startTime}&endTime={endTime}&minCapacity={minCapacity}&building={building}
 * 
 * @param {Object} params - Query parameters
 * @param {string} params.startTime - Start time (ISO format)
 * @param {string} params.endTime - End time (ISO format)
 * @param {number} [params.minCapacity] - Minimum capacity
 * @param {string} [params.building] - Building name
 * @returns {Promise<Array>} Array of available locations
 */
export const getAvailableLocations = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.startTime) {
      queryParams.append("startTime", params.startTime);
    }
    if (params.endTime) {
      queryParams.append("endTime", params.endTime);
    }
    if (params.minCapacity) {
      queryParams.append("minCapacity", params.minCapacity.toString());
    }
    if (params.building) {
      queryParams.append("building", params.building);
    }

    const response = await apiClient.get(
      `${LOCATIONS_ENDPOINT}/available?${queryParams.toString()}`,
      {
        headers: {
          Accept: "*/*",
        },
      }
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
    console.error("❌ Get available locations error:", error);
    throw error;
  }
};

// ========================================
// REGION: EXPORTS
// ========================================
export default {
  getLocations,
  searchLocations,
  getLocationById,
  createLocation,
  getLocationsByBuilding,
  getAvailableLocations,
};
