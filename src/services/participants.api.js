// ========================================
// REGION: IMPORTS
// ========================================
import apiClient from "./api.js";

// ========================================
// REGION: CONFIGURATION
// ========================================
/**
 * Participants API Endpoints
 * Base URL được config trong api.js từ environment variable VITE_API_BASE_URL
 * Mặc định: https://localhost:7273/api
 */
const PARTICIPANTS_ENDPOINT = "/Participants";

// ========================================
// REGION: API CALL FUNCTIONS
// ========================================
/**
 * Sync participants from Excel file
 * 
 * API Endpoint: POST /Participants/sync
 * 
 * Request: FormData with:
 * - EventId: integer
 * - SubEventId: integer
 * - File: xlsx file (binary)
 * - GoogleSheetId: string (optional)
 * 
 * @param {number} eventId - Event ID
 * @param {number} subEventId - Sub-event ID
 * @param {File} file - Excel file (.xlsx)
 * @param {string} [googleSheetId] - Google Sheet ID (optional)
 * @returns {Promise<Object>} Sync result
 */
export const syncParticipants = async (eventId, subEventId, file, googleSheetId = null) => {
  try {
    if (!eventId || !subEventId) {
      throw new Error("Event ID and Sub-event ID are required");
    }

    if (!file) {
      throw new Error("File is required");
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      throw new Error("Only Excel files (.xlsx, .xls) are accepted");
    }

    console.log(`📤 Syncing participants for event ${eventId}, sub-event ${subEventId}`);

    const formData = new FormData();
    formData.append("EventId", eventId.toString());
    formData.append("SubEventId", subEventId.toString());
    formData.append("File", file);
    if (googleSheetId) {
      formData.append("GoogleSheetId", googleSheetId);
    }

    const response = await apiClient.post(`${PARTICIPANTS_ENDPOINT}/sync`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "*/*",
      },
    });

    if (response.status === 200 || response.status === 201) {
      console.log("✅ Participants synced successfully:", response.data);

      if (response.data?.success !== undefined) {
        return response.data.data || response.data;
      }
      return response.data;
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error("❌ Sync participants error:", error);

    if (error.response?.status === 400) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || "Invalid request";
      throw new Error(errorMessage);
    }

    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    const errorMessage =
      error.response?.data?.message || error.message || "Failed to sync participants";
    throw new Error(errorMessage);
  }
};

/**
 * Refresh participants from Google Sheet/Form
 * 
 * API Endpoint: POST /Participants/sync/refresh
 * 
 * Request body:
 * {
 *   "eventId": 2,
 *   "subEventId": 4,
 *   "googleSheetId": "1",
 *   "googleFormUrl": "aaaa"
 * }
 * 
 * @param {number} eventId - Event ID
 * @param {number} subEventId - Sub-event ID
 * @param {string} [googleSheetId] - Google Sheet ID (optional)
 * @param {string} [googleFormUrl] - Google Form URL (optional)
 * @returns {Promise<Object>} Refresh result
 */
export const refreshParticipants = async (eventId, subEventId, googleSheetId = null, googleFormUrl = null) => {
  try {
    if (!eventId || !subEventId) {
      throw new Error("Event ID and Sub-event ID are required");
    }

    console.log(`📤 Refreshing participants for event ${eventId}, sub-event ${subEventId}`);

    const requestBody = {
      eventId: Number(eventId),
      subEventId: Number(subEventId),
    };

    if (googleSheetId) {
      requestBody.googleSheetId = googleSheetId;
    }

    if (googleFormUrl) {
      requestBody.googleFormUrl = googleFormUrl;
    }

    const response = await apiClient.post(
      `${PARTICIPANTS_ENDPOINT}/sync/refresh`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
        },
      }
    );

    if (response.status === 200 || response.status === 201) {
      console.log("✅ Participants refreshed successfully:", response.data);

      if (response.data?.success !== undefined) {
        return response.data.data || response.data;
      }
      return response.data;
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error("❌ Refresh participants error:", error);

    if (error.response?.status === 400) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || "Invalid request";
      throw new Error(errorMessage);
    }

    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    const errorMessage =
      error.response?.data?.message || error.message || "Failed to refresh participants";
    throw new Error(errorMessage);
  }
};

/**
 * Get participants by event and sub-event
 * 
 * API Endpoint: GET /Participants/event/{eventId}?subEventId={subEventId}
 * 
 * Response format:
 * {
 *   "success": true,
 *   "message": "Retrieved 0 participants",
 *   "data": {
 *     "participants": [],
 *     "totalCount": 0,
 *     "checkedInCount": 0,
 *     "checkedOutCount": 0,
 *     "invitedCount": 0,
 *     "guestCount": 0,
 *     "userCount": 0
 *   }
 * }
 * 
 * @param {number} eventId - Event ID
 * @param {number} subEventId - Sub-event ID
 * @returns {Promise<Object>} Participants data
 */
export const getParticipants = async (eventId, subEventId) => {
  try {
    if (!eventId || !subEventId) {
      throw new Error("Event ID and Sub-event ID are required");
    }

    console.log(`📤 Fetching participants for event ${eventId}, sub-event ${subEventId}`);

    const response = await apiClient.get(
      `${PARTICIPANTS_ENDPOINT}/event/${eventId}`,
      {
        params: {
          subEventId: subEventId,
        },
        headers: {
          Accept: "*/*",
        },
      }
    );

    if (response.status === 200) {
      console.log("✅ Participants retrieved successfully:", response.data);

      if (response.data?.success !== undefined) {
        return response.data.data || response.data;
      }
      return response.data;
    }

    throw new Error(`Unexpected response status: ${response.status}`);
  } catch (error) {
    console.error("❌ Get participants error:", error);

    if (error.response?.status === 400 || error.response?.status === 404) {
      const errorData = error.response.data;
      const errorMessage = errorData?.message || "Participants not found";
      throw new Error(errorMessage);
    }

    if (error.message === "Network Error" || !error.response) {
      throw new Error("Network error: Could not connect to server");
    }

    const errorMessage =
      error.response?.data?.message || error.message || "Failed to fetch participants";
    throw new Error(errorMessage);
  }
};

// ========================================
// REGION: EXPORTS
// ========================================
export default {
  syncParticipants,
  refreshParticipants,
  getParticipants,
};
