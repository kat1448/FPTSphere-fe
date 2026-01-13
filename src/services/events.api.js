// ========================================
// REGION: IMPORTS
// ========================================
import apiClient from "./api.js";

// ========================================
// REGION: CONFIGURATION
// ========================================
/**
 * Events API Endpoint
 * Endpoint: POST /Events (chú ý E hoa)
 * Base URL được config trong api.js từ environment variable VITE_API_BASE_URL
 * Mặc định: https://localhost:7273/api
 * Full URL: https://localhost:7273/api/Events
 */
const EVENTS_ENDPOINT = "/Events";

// ========================================
// REGION: EVENT TYPE & CATEGORY MAPPING
// ========================================
/**
 * Mapping Event Type sang typeId
 * TODO: Cần sync với backend để có đúng ID
 */
const EVENT_TYPE_MAP = {
  Conference: 1,
  Workshop: 2,
  Seminar: 3,
  Webinar: 4,
  Meetup: 5,
  Other: 6,
};

/**
 * Mapping Category sang categoryId
 * TODO: Cần sync với backend để có đúng ID
 */
const CATEGORY_MAP = {
  Technology: 1,
  Business: 2,
  Education: 3,
  Entertainment: 4,
  Sports: 5,
  Other: 6,
};

// ========================================
// REGION: HELPER FUNCTIONS
// ========================================
/**
 * Validate URL format
 * @param {string} url - URL string to validate
 * @returns {boolean} True if valid URL
 */
const isValidUrl = (url) => {
  if (!url || url.trim() === "") return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Convert dayjs object to ISO string format (YYYY-MM-DDTHH:mm:ss)
 * @param {dayjs.Dayjs} dayjsObj - Dayjs object
 * @returns {string|null} ISO string without milliseconds and timezone (e.g., "2026-03-15T09:00:00") or null
 */
const toISOString = (dayjsObj) => {
  if (!dayjsObj) return null;
  // Format: YYYY-MM-DDTHH:mm:ss (no milliseconds, no timezone)
  return dayjsObj.format("YYYY-MM-DDTHH:mm:ss");
};

/**
 * Get typeId from event type string
 * @param {string} eventType - Event type (e.g., "Conference")
 * @returns {number} typeId (default: 0)
 */
const getTypeId = (eventType) => {
  return EVENT_TYPE_MAP[eventType] || 0;
};

/**
 * Get categoryId from category string
 * @param {string} category - Category (e.g., "Technology")
 * @returns {number} categoryId (default: 0)
 */
const getCategoryId = (category) => {
  return CATEGORY_MAP[category] || 0;
};

// ========================================
// REGION: API CALL FUNCTIONS
// ========================================
/**
 * Create new event
 *
 * API Endpoint: POST https://localhost:7273/api/Events
 *
 * Database Schema Mapping:
 * - eventName -> event_name (DB: VARCHAR/NVARCHAR)
 * - description -> description (DB: VARCHAR/NVARCHAR, nullable)
 * - bannerUrl -> banner_url (DB: VARCHAR/NVARCHAR, nullable)
 * - startTime -> start_time (DB: DATETIME/DATETIME2)
 * - endTime -> end_time (DB: DATETIME/DATETIME2)
 * - locationId -> location_id (DB: INT, nullable, 0 if not used)
 * - externalLocationId -> external_location_id (DB: INT, nullable, 0 if not used)
 * - expectedAttendees -> expected_attendees (DB: INT, default 0)
 * - estimatedCost -> estimated_cost (DB: DECIMAL/MONEY, default 0)
 * - categoryId -> category_id (DB: INT, foreign key)
 * - typeId -> type_id (DB: INT, foreign key)
 * - templateId -> template_id (DB: INT, nullable, default 0)
 *
 * Backend Auto-Set Fields (not sent in request):
 * - event_id (auto increment PRIMARY KEY)
 * - created_by (from JWT token)
 * - status_id (default status, may be set by backend)
 * - parent_event_id (NULL for main events)
 * - created_at (auto timestamp)
 * - updated_at (auto timestamp)
 * - is_deleted (default false)
 *
 * Request Body Format:
 * {
 *   "eventName": "string",
 *   "description": "string",
 *   "bannerUrl": "string",
 *   "startTime": "2026-01-10T09:11:37.270Z",
 *   "endTime": "2026-01-10T09:11:37.270Z",
 *   "expectedAttendees": 100000,
 *   "estimatedCost": 9999999999999.99,
 *   "locationId": 0,
 *   "externalLocationId": 0,
 *   "templateId": 0,
 *   "categoryId": 0,
 *   "typeId": 0
 * }
 *
 * Response:
 * - Status 200: Success (returns created event with event_id)
 * - Status 400: Validation errors
 *
 * @param {Object} eventData - Event data object
 * @param {string} eventData.eventName - Event name (maps to event_name in DB)
 * @param {string} [eventData.description] - Event description (maps to description in DB)
 * @param {string} [eventData.bannerUrl] - Banner URL (maps to banner_url in DB, must be valid URL if provided)
 * @param {dayjs.Dayjs} eventData.startTime - Start time (maps to start_time in DB, ISO format)
 * @param {dayjs.Dayjs} eventData.endTime - End time (maps to end_time in DB, ISO format)
 * @param {number} [eventData.expectedAttendees] - Expected attendees count (maps to expected_attendees in DB)
 * @param {number} [eventData.estimatedCost] - Estimated cost (maps to estimated_cost in DB)
 * @param {number} [eventData.locationId] - Internal location ID (maps to location_id in DB, 0 if not used)
 * @param {number} [eventData.externalLocationId] - External location ID (maps to external_location_id in DB, 0 if not used)
 * @param {number} [eventData.templateId] - Template ID (maps to template_id in DB, default: 0)
 * @param {string} [eventData.eventType] - Event type string (e.g., "Conference") - mapped to typeId
 * @param {string} [eventData.category] - Category string (e.g., "Technology") - mapped to categoryId
 *
 * @returns {Promise<Object>} Created event data (includes event_id from DB)
 * @throws {Error} If API call fails or validation errors occur
 */
export const createEvent = async (eventData) => {
  try {
    // ========================================
    // REGION: VALIDATION
    // ========================================
    // Validate required fields
    if (!eventData.eventName || eventData.eventName.trim() === "") {
      throw new Error("Event name is required");
    }

    if (!eventData.startTime || !eventData.endTime) {
      throw new Error("Start time and end time are required");
    }

    // Validate banner URL format if provided
    // Only validate if bannerUrl is not null/empty
    // Allow null (backend will handle default banner)
    if (eventData.bannerUrl && eventData.bannerUrl.trim() !== "") {
      if (!isValidUrl(eventData.bannerUrl)) {
        throw new Error("Banner URL must be a valid URL");
      }
      // Additional check: must be HTTP or HTTPS URL
      try {
        const urlObj = new URL(eventData.bannerUrl);
        if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
          throw new Error("Banner URL must be a valid HTTP or HTTPS URL");
        }
      } catch (urlError) {
        if (urlError.message.includes("HTTP")) {
          throw urlError;
        }
        throw new Error("Banner URL must be a valid URL");
      }
    }

    // ========================================
    // REGION: BUILD REQUEST BODY
    // ========================================
    // Map frontend data to API request body format
    // All field names use camelCase for API, backend maps to snake_case DB columns

    // Normalize bannerUrl: empty string or falsy values become null
    // DB column: banner_url (nullable VARCHAR)
    const normalizedBannerUrl =
      eventData.bannerUrl && eventData.bannerUrl.trim() !== ""
        ? eventData.bannerUrl.trim()
        : null;

    const requestBody = {
      // eventName -> event_name (DB: VARCHAR, NOT NULL)
      eventName: eventData.eventName.trim(),

      // description -> description (DB: VARCHAR, nullable)
      description: eventData.description || null,

      // bannerUrl -> banner_url (DB: VARCHAR, nullable)
      bannerUrl: normalizedBannerUrl, // null if empty or not provided

      // startTime -> start_time (DB: DATETIME, NOT NULL)
      // Format: ISO 8601 string (e.g., "2026-01-10T09:11:37.270Z")
      startTime: toISOString(eventData.startTime),

      // endTime -> end_time (DB: DATETIME, NOT NULL)
      // Format: ISO 8601 string (e.g., "2026-01-10T09:11:37.270Z")
      endTime: toISOString(eventData.endTime),

      // expectedAttendees -> expected_attendees (DB: INT, nullable)
      // Backend validation: must be between 1 and 100,000 if provided
      expectedAttendees:
        eventData.expectedAttendees && eventData.expectedAttendees > 0
          ? Number(eventData.expectedAttendees)
          : null,

      // estimatedCost -> estimated_cost (DB: DECIMAL/MONEY, default 0)
      estimatedCost: eventData.estimatedCost
        ? Number(eventData.estimatedCost)
        : 0,

      // locationId -> location_id (DB: INT, nullable, foreign key to Locations table)
      // null means no internal location selected (backend validation: cannot specify both internal and external)
      locationId: eventData.locationId ? Number(eventData.locationId) : null,

      // externalLocationId -> external_location_id (DB: INT, nullable, foreign key to ExternalLocations table)
      // null means no external location selected (backend validation: cannot specify both internal and external)
      externalLocationId: eventData.externalLocationId
        ? Number(eventData.externalLocationId)
        : null,

      // templateId -> template_id (DB: INT, nullable, foreign key to Templates table)
      // Default: null (no template)
      templateId: eventData.templateId ? Number(eventData.templateId) : null,

      // categoryId -> category_id (DB: INT, foreign key to Categories table)
      // Accept categoryId directly (number) or map from category string
      categoryId: eventData.categoryId
        ? Number(eventData.categoryId)
        : getCategoryId(eventData.category),

      // typeId -> type_id (DB: INT, foreign key to EventTypes table)
      // Accept typeId directly (number) or map from eventType string
      typeId: eventData.typeId
        ? Number(eventData.typeId)
        : getTypeId(eventData.eventType),
    };

    // Note: Backend will automatically set:
    // - event_id (auto increment PRIMARY KEY)
    // - created_by (from JWT token in Authorization header)
    // - status_id (default status, may be set by backend logic)
    // - parent_event_id (NULL for main events)
    // - created_at (current timestamp)
    // - updated_at (current timestamp)
    // - is_deleted (default false)

    // ========================================
    // REGION: API CALL
    // ========================================
    console.log("📤 Creating event with payload:", requestBody);

    // Backend expects multipart/form-data, not application/json
    // Create FormData object
    const formData = new FormData();
    
    // Append all fields to FormData
    formData.append("EventName", requestBody.eventName);
    
    if (requestBody.description) {
      formData.append("Description", requestBody.description);
    }
    
    if (requestBody.bannerUrl) {
      formData.append("BannerUrl", requestBody.bannerUrl);
    }
    
    formData.append("StartTime", requestBody.startTime);
    formData.append("EndTime", requestBody.endTime);
    
    if (requestBody.expectedAttendees) {
      formData.append("ExpectedAttendees", requestBody.expectedAttendees.toString());
    }
    
    if (requestBody.estimatedCost !== undefined && requestBody.estimatedCost !== null) {
      formData.append("EstimatedCost", requestBody.estimatedCost.toString());
    }
    
    if (requestBody.locationId) {
      formData.append("LocationId", requestBody.locationId.toString());
    }
    
    if (requestBody.externalLocationId) {
      formData.append("ExternalLocationId", requestBody.externalLocationId.toString());
    }
    
    if (requestBody.templateId) {
      formData.append("TemplateId", requestBody.templateId.toString());
    }
    
    if (requestBody.categoryId) {
      formData.append("CategoryId", requestBody.categoryId.toString());
    }
    
    if (requestBody.typeId) {
      formData.append("TypeId", requestBody.typeId.toString());
    }

    // Send FormData - force multipart/form-data to match backend expectation
    const response = await apiClient.post(EVENTS_ENDPOINT, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      // Avoid default axios JSON transform to keep raw FormData
      transformRequest: [(data) => data],
    });

    // ========================================
    // REGION: RESPONSE HANDLING
    // ========================================
    // Status 200 (OK) or 201 (Created): Success
    if (response.status === 200 || response.status === 201) {
      console.log("✅ Event created successfully:", response.data);

      // Handle new API response format: {success: true, message: "...", data: {...}}
      // Return the full response.data object so caller can access success, message, and data
      if (response.data && typeof response.data === "object") {
        // If response has success field, it's the new format
        if (response.data.success !== undefined) {
          // Return the full response object: {success, message, data}
          return response.data;
        }
        // Otherwise, return response.data as is (backward compatibility)
        return response.data;
      }

      return response.data;
    }

    // Unexpected status
    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    // ========================================
    // REGION: ERROR HANDLING
    // ========================================
    console.error("❌ Create event error:", error);

    // Handle 400 Bad Request (Validation errors)
    if (error.response?.status === 400) {
      const errorData = error.response.data;

      // Format validation errors
      if (errorData.errors) {
        const errorMessages = [];
        Object.keys(errorData.errors).forEach((field) => {
          const fieldErrors = errorData.errors[field];
          if (Array.isArray(fieldErrors)) {
            fieldErrors.forEach((msg) =>
              errorMessages.push(`${field}: ${msg}`)
            );
          } else {
            errorMessages.push(`${field}: ${fieldErrors}`);
          }
        });

        const formattedError = new Error(errorMessages.join("\n"));
        formattedError.status = 400;
        formattedError.errors = errorData.errors;
        throw formattedError;
      }

      // Generic 400 error
      const formattedError = new Error(
        errorData.title || errorData.message || "Validation failed"
      );
      formattedError.status = 400;
      formattedError.data = errorData;
      throw formattedError;
    }

    // Handle network errors
    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to create event";
    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status;
    formattedError.data = error.response?.data;
    throw formattedError;
  }
};

/**
 * Get events with pagination and filters
 * 
 * API Endpoint: GET /Events
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - pageSize: Number of items per page (default: 10)
 * - includeDeleted: Include deleted events (default: false)
 * - sortBy: Sort field (e.g., "CreatedAt")
 * - sortDescending: Sort direction (default: true)
 * 
 * Response format:
 * {
 *   "success": true,
 *   "message": "Retrieved 11 events",
 *   "data": {
 *     "data": [...],
 *     "totalRecords": 11,
 *     "page": 1,
 *     "pageSize": 10,
 *     "totalPages": 2,
 *     "hasPreviousPage": false,
 *     "hasNextPage": true
 *   }
 * }
 * 
 * @param {Object} params - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.pageSize=10] - Items per page
 * @param {boolean} [params.includeDeleted=false] - Include deleted events
 * @param {string} [params.sortBy="CreatedAt"] - Sort field
 * @param {boolean} [params.sortDescending=true] - Sort direction
 * @returns {Promise<Object>} Paginated events data
 */
export const getEvents = async (params = {}) => {
  try {
    const queryParams = {
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      includeDeleted: params.includeDeleted !== undefined ? params.includeDeleted : false,
      sortBy: params.sortBy || "CreatedAt",
      sortDescending: params.sortDescending !== undefined ? params.sortDescending : true,
    };

    console.log("📤 Fetching events with params:", queryParams);

    const response = await apiClient.get(EVENTS_ENDPOINT, {
      params: queryParams,
      headers: {
        Accept: "*/*",
      },
    });

    // Status 200 (OK): Success
    if (response.status === 200) {
      console.log("✅ Events retrieved successfully:", response.data);

      // Handle API response format: {success, message, data: {data: [...], totalRecords, ...}}
      if (response.data?.success !== undefined) {
        // response.data.data contains the paginated data object
        // Return the entire data object: {data: [...], totalRecords, page, ...}
        const dataObj = response.data.data;
        console.log("📦 Extracted data object:", dataObj);
        return dataObj || response.data;
      }
      return response.data;
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error("❌ Get events error:", error);

    // Handle validation errors
    if (error.response?.status === 400) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || "Invalid parameters";
      throw new Error(errorMessage);
    }

    // Handle network errors
    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message || error.message || "Failed to fetch events";
    throw new Error(errorMessage);
  }
};

/**
 * Get event by ID
 * 
 * API Endpoint: GET /Events/{id}
 * 
 * Response format:
 * {
 *   "success": true,
 *   "message": "Event retrieved",
 *   "data": {
 *     "eventId": 2,
 *     "eventName": "FPT Tech Com 2026",
 *     ...
 *   }
 * }
 * 
 * @param {number} eventId - Event ID
 * @returns {Promise<Object>} Event data
 */
export const getEventById = async (eventId) => {
  try {
    if (!eventId) {
      throw new Error("Event ID is required");
    }

    console.log(`📤 Fetching event by ID: ${eventId}`);

    const response = await apiClient.get(`${EVENTS_ENDPOINT}/${eventId}`, {
      headers: {
        Accept: "*/*",
      },
    });

    // Status 200 (OK): Success
    if (response.status === 200) {
      console.log("✅ Event retrieved successfully:", response.data);

      // Handle API response format: {success, message, data}
      if (response.data?.success !== undefined) {
        return response.data.data || response.data;
      }
      return response.data;
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error(`❌ Get event by ID error (ID: ${eventId}):`, error);

    // Handle validation errors
    if (error.response?.status === 400 || error.response?.status === 404) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || "Event not found";
      throw new Error(errorMessage);
    }

    // Handle network errors
    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message || error.message || "Failed to fetch event";
    throw new Error(errorMessage);
  }
};

/**
 * Get sub-events for an event
 * 
 * API Endpoint: GET /Events/{id}/subevents
 * 
 * @param {number} eventId - Event ID
 * @returns {Promise<Array>} Array of sub-events
 */
export const getSubEvents = async (eventId) => {
  try {
    if (!eventId) {
      throw new Error("Event ID is required");
    }

    console.log(`📤 Fetching sub-events for event ID: ${eventId}`);

    const response = await apiClient.get(`${EVENTS_ENDPOINT}/${eventId}/subevents`, {
      headers: {
        Accept: "*/*",
      },
    });

    // Status 200 (OK): Success
    if (response.status === 200) {
      console.log("✅ Sub-events retrieved successfully:", response.data);

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
    console.error(`❌ Get sub-events error (Event ID: ${eventId}):`, error);

    // Handle validation errors
    if (error.response?.status === 400 || error.response?.status === 404) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || "Sub-events not found";
      throw new Error(errorMessage);
    }

    // Handle network errors
    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message || error.message || "Failed to fetch sub-events";
    throw new Error(errorMessage);
  }
};

/**
 * Generate QR code for sub-event with Google Form URL
 * 
 * API Endpoint: POST /Events/subevents/{subEventId}/generate-qr
 * 
 * Request body:
 * {
 *   "googleFormUrl": "https://docs.google.com/forms/d/e/..."
 * }
 * 
 * Response format:
 * {
 *   "success": true,
 *   "message": "QR code generated successfully",
 *   "data": {
 *     "subEventId": 4,
 *     "qrCodeUrl": "...",
 *     "qrCodeBase64": "data:image/png;base64,...",
 *     "googleFormUrl": "..."
 *   }
 * }
 * 
 * @param {number} subEventId - Sub-event ID
 * @param {string} googleFormUrl - Google Form URL
 * @returns {Promise<Object>} QR code data
 */
export const generateQRCode = async (subEventId, googleFormUrl) => {
  try {
    if (!subEventId) {
      throw new Error("Sub-event ID is required");
    }

    if (!googleFormUrl || googleFormUrl.trim() === "") {
      throw new Error("Google Form URL is required");
    }

    console.log(`📤 Generating QR code for sub-event ${subEventId}`);

    const response = await apiClient.post(
      `${EVENTS_ENDPOINT}/subevents/${subEventId}/generate-qr`,
      {
        googleFormUrl: googleFormUrl.trim(),
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
        },
      }
    );

    if (response.status === 200 || response.status === 201) {
      console.log("✅ QR code generated successfully:", response.data);

      if (response.data?.success !== undefined) {
        return response.data.data || response.data;
      }
      return response.data;
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error(`❌ Generate QR code error (Sub-event ID: ${subEventId}):`, error);

    if (error.response?.status === 400) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || "Invalid request";
      throw new Error(errorMessage);
    }

    if (error.response?.status === 404) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || "Sub-event not found";
      throw new Error(errorMessage);
    }

    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    const errorMessage =
      error.response?.data?.message || error.message || "Failed to generate QR code";
    throw new Error(errorMessage);
  }
};

/**
 * Approve event (Director only)
 * 
 * API Endpoint: POST /Events/{id}/approve
 * 
 * Request body:
 * {
 *   "comment": "duyet"
 * }
 * 
 * Response format:
 * {
 *   "success": true,
 *   "message": "Event approved successfully",
 *   "data": { ... }
 * }
 * 
 * Error response (example):
 * {
 *   "success": false,
 *   "message": "Cannot approve events in Draft status. Only Pending events can be approved.",
 *   "data": null,
 *   "errors": null,
 *   "timestamp": "..."
 * }
 * 
 * @param {number} eventId - Event ID
 * @param {string} comment - Approval comment
 * @returns {Promise<Object>} Approved event data
 */
export const approveEvent = async (eventId, comment = "") => {
  try {
    if (!eventId) {
      throw new Error("Event ID is required");
    }

    console.log(`📤 Approving event ID: ${eventId} with comment: "${comment}"`);

    const response = await apiClient.post(
      `${EVENTS_ENDPOINT}/${eventId}/approve`,
      {
        comment: comment || "",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
        },
      }
    );

    // Status 200 (OK) or 201 (Created): Success
    if (response.status === 200 || response.status === 201) {
      console.log("✅ Event approved successfully:", response.data);

      // Handle API response format: {success, message, data}
      if (response.data?.success !== undefined) {
        return response.data.data || response.data;
      }
      return response.data;
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error(`❌ Approve event error (Event ID: ${eventId}):`, error);

    // Handle validation errors
    if (error.response?.status === 400) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || "Cannot approve this event";
      const formattedError = new Error(errorMessage);
      formattedError.status = 400;
      formattedError.data = errorData;
      throw formattedError;
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || "Event not found";
      throw new Error(errorMessage);
    }

    // Handle network errors
    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    // Handle other errors
    const errorMessage =
      error.response?.data?.message || error.message || "Failed to approve event";
    throw new Error(errorMessage);
  }
};

// ========================================
// REGION: EXPORTS
// ========================================
export default {
  createEvent,
  getEvents,
  getEventById,
  getSubEvents,
  generateQRCode,
  approveEvent,
};
