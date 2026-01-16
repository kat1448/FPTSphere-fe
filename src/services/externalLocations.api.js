// ========================================
// REGION: IMPORTS
// ========================================
import apiClient from "./api.js";

// ========================================
// REGION: CONFIGURATION
// ========================================
/**
 * External Locations API Endpoints
 * Base URL được config trong api.js từ environment variable VITE_API_BASE_URL
 * Mặc định: https://localhost:7273/api
 */
const EXTERNAL_LOCATIONS_ENDPOINT = "/ExternalLocations";

// ========================================
// REGION: API CALL FUNCTIONS
// ========================================
/**
 * Get list of external locations with pagination
 * 
 * API Endpoint: GET /ExternalLocations?page=1&pageSize=10&sortBy=Name&sortDescending=false
 * 
 * @param {Object} params - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.pageSize=10] - Items per page
 * @param {string} [params.sortBy=Name] - Sort field
 * @param {boolean} [params.sortDescending=false] - Sort direction
 * @returns {Promise<Object>} External locations data
 */
export const getExternalLocations = async (params = {}) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      search,
      minCost,
      maxCost,
      sortBy = "Name",
      sortDescending = false,
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("pageSize", pageSize.toString());
    if (search && search.trim() !== "") queryParams.append("search", search.trim());
    if (minCost != null) queryParams.append("minCost", minCost.toString());
    if (maxCost != null) queryParams.append("maxCost", maxCost.toString());
    queryParams.append("sortBy", sortBy);
    queryParams.append("sortDescending", sortDescending.toString());

    const response = await apiClient.get(
      `${EXTERNAL_LOCATIONS_ENDPOINT}?${queryParams.toString()}`
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
    console.error("❌ Get external locations error:", error);
    throw error;
  }
};

/**
 * Create new external location
 * 
 * API Endpoint: POST /ExternalLocations
 * 
 * Request body:
 * {
 *   "name": "string",
 *   "address": "string",
 *   "contactPerson": "string",
 *   "contactPhone": "string",
 *   "cost": 999999999,
 *   "note": "string",
 *   "imageUrl": "string"
 * }
 * 
 * @param {Object} locationData - External location data
 * @param {string} locationData.name - Location name
 * @param {string} locationData.address - Address
 * @param {string} locationData.contactPerson - Contact person
 * @param {string} locationData.contactPhone - Contact phone
 * @param {number} locationData.cost - Cost
 * @param {string} [locationData.note] - Note
 * @param {string} [locationData.imageUrl] - Image URL
 * @returns {Promise<Object>} Created external location data
 */
export const createExternalLocation = async (locationData) => {
  try {
    // Validate required fields
    if (!locationData.name || locationData.name.trim() === "") {
      throw new Error("Location name is required");
    }

    if (!locationData.address || locationData.address.trim() === "") {
      throw new Error("Address is required");
    }

    const requestBody = {
      name: locationData.name.trim(),
      address: locationData.address.trim(),
      contactPerson: locationData.contactPerson?.trim() || "",
      contactPhone: locationData.contactPhone?.trim() || "",
      cost: locationData.cost ? Number(locationData.cost) : 0,
      note: locationData.note?.trim() || "",
      imageUrl: locationData.imageUrl || "null",
    };

    console.log("📤 Creating external location with payload:", requestBody);

    const response = await apiClient.post(EXTERNAL_LOCATIONS_ENDPOINT, requestBody, {
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
      },
    });

    // Status 200 (OK) or 201 (Created): Success
    if (response.status === 200 || response.status === 201) {
      console.log("✅ External location created successfully:", response.data);

      // Handle API response format: {success, message, data}
      if (response.data?.success !== undefined) {
        return response.data.data || response.data;
      }
      return response.data;
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error("❌ Create external location error:", error);

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
      error.response?.data?.message || error.message || "Failed to create external location";
    throw new Error(errorMessage);
  }
};

/**
 * Search external locations
 *
 * API Endpoint: GET /ExternalLocations/search
 *
 * @param {Object} params
 * @param {string} [params.term]
 * @param {number} [params.minCost]
 * @param {number} [params.maxCost]
 * @param {string} [params.sortBy]
 * @param {boolean} [params.sortDescending]
 * @returns {Promise<Object>} Search result with pagination
 */
export const searchExternalLocations = async (term) => {
  try {
    if (!term || term.trim() === "") return [];

    const queryParams = new URLSearchParams({ term: term.trim() });

    const response = await apiClient.get(
      `${EXTERNAL_LOCATIONS_ENDPOINT}/search?${queryParams.toString()}`
    );

    if (response.status === 200) {
      if (response.data?.success !== undefined) {
        return response.data.data || [];
      }
      return response.data;
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error("❌ Search external locations error:", error);
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to search external locations";
    throw new Error(errorMessage);
  }
};

/**
 * Update external location
 *
 * API Endpoint: PUT /ExternalLocations/{id}
 *
 * @param {number} externalLocationId
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export const updateExternalLocation = async (externalLocationId, payload) => {
  try {
    if (!externalLocationId) {
      throw new Error("External location ID is required");
    }

    const response = await apiClient.put(
      `${EXTERNAL_LOCATIONS_ENDPOINT}/${externalLocationId}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
        },
      }
    );

    if (response.status === 200) {
      if (response.data?.success !== undefined) {
        return response.data.data || response.data;
      }
      return response.data;
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error("❌ Update external location error:", error);
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to update external location";
    throw new Error(errorMessage);
  }
};

/**
 * Delete external location (hard delete)
 *
 * API Endpoint: DELETE /ExternalLocations/{id}
 *
 * @param {number} externalLocationId
 * @returns {Promise<void>}
 */
export const deleteExternalLocation = async (externalLocationId) => {
  try {
    if (!externalLocationId) {
      throw new Error("External location ID is required");
    }

    const response = await apiClient.delete(
      `${EXTERNAL_LOCATIONS_ENDPOINT}/${externalLocationId}`,
      {
        headers: {
          Accept: "*/*",
        },
      }
    );

    if (response.status === 200 || response.status === 204) {
      return;
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error("❌ Delete external location error:", error);
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to delete external location";
    throw new Error(errorMessage);
  }
};

// ========================================
// REGION: EXPORTS
// ========================================
export default {
  getExternalLocations,
  createExternalLocation,
  searchExternalLocations,
  updateExternalLocation,
  deleteExternalLocation,
};
