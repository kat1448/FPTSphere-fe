import apiClient from "./api";

const directorService = {
  /**
   * Get all events pending approval
   * GET /api/events/pending-approval
   * Returns: List<PendingApprovalDto>
   */
  getPendingApprovals: async () => {
    try {
      const response = await apiClient.get("/events/pending-approval");
      console.log("📋 Pending approvals response:", response.data);
      return response.data?.data || [];
    } catch (error) {
      console.error("❌ Error fetching pending approvals:", error);
      // Log more details for debugging
      if (error.response) {
        console.error("   Status:", error.response.status);
        console.error("   Data:", error.response.data);
      }
      throw error;
    }
  },

  /**
   * Approve an event
   * POST /api/events/{id}/approve
   */
  approveEvent: async (eventId, comment = "") => {
    try {
      const response = await apiClient.post(`/events/${eventId}/approve`, {
        comment: comment,
      });
      return response.data;
    } catch (error) {
      console.error("❌ Error approving event:", error);
      throw error;
    }
  },

  /**
   * Reject an event
   * POST /api/events/{id}/reject
   */
  rejectEvent: async (eventId, comment = "") => {
    try {
      const response = await apiClient.post(`/events/${eventId}/reject`, {
        comment: comment,
      });
      return response.data;
    } catch (error) {
      console.error("❌ Error rejecting event:", error);
      throw error;
    }
  },

  /**
   * Get approval history for an event
   * GET /api/events/{id}/approval-history
   */
  getApprovalHistory: async (eventId) => {
    try {
      const response = await apiClient.get(`/events/${eventId}/approval-history`);
      return response.data?.data || [];
    } catch (error) {
      console.error("❌ Error fetching approval history:", error);
      throw error;
    }
  },

  /**
   * Get all events (for Event History page)
   * GET /api/events
   * Returns: PagedResult<EventDto> - need to access data.data.data for events array
   */
  getAllEvents: async (params = {}) => {
    try {
      const response = await apiClient.get("/events", { params });
      console.log("📅 All events response:", response.data);
      // PagedResult structure: { data: { data: [...], totalRecords, page, ... } }
      return response.data?.data?.data || [];
    } catch (error) {
      console.error("❌ Error fetching all events:", error);
      throw error;
    }
  },

  /**
   * Get ongoing events (status = 4 In Progress)
   * GET /api/events?statusId=4
   * Returns: PagedResult<EventDto>
   */
  getOngoingEvents: async () => {
    try {
      const response = await apiClient.get("/events", {
        params: { statusId: 4 },
      });
      console.log("🟢 Ongoing events response:", response.data);
      // PagedResult structure: { data: { data: [...], totalRecords, page, ... } }
      return response.data?.data?.data || [];
    } catch (error) {
      console.error("❌ Error fetching ongoing events:", error);
      throw error;
    }
  },

  /**
   * Get event by ID
   * GET /api/events/{id}
   */
  getEventById: async (eventId) => {
    try {
      const response = await apiClient.get(`/events/${eventId}`);
      return response.data?.data || null;
    } catch (error) {
      console.error("❌ Error fetching event:", error);
      throw error;
    }
  },

  /**
   * Get sub-events for a parent event
   * GET /api/events/{id}/subevents
   */
  getSubEvents: async (parentEventId) => {
    try {
      const response = await apiClient.get(`/events/${parentEventId}/subevents`);
      console.log("📁 Sub-events response:", response.data);
      return response.data?.data || [];
    } catch (error) {
      console.error("❌ Error fetching sub-events:", error);
      throw error;
    }
  },
};

export default directorService;