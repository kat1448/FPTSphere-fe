import apiClient, { API_ENDPOINTS } from './api';

/**
 * Events Service
 * Handle all events-related API calls
 */
class EventService {
  /**
   * ========================================
   * PUBLIC EVENTS API (No Authentication)
   * ========================================
   */

  /**
   * Get all public events (Approved events only)
   * @returns {Promise<Array>} List of public events
   */
  async getPublicEvents() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PUBLIC_EVENTS);

      console.log('🔍 Public Events Response:', response.data);

      if (response.data.success) {
        const events = response.data.data;

        if (Array.isArray(events)) {
          console.log('✅ Public events loaded:', events.length);
          return events;
        }

        console.warn('⚠️ Unexpected response structure:', events);
        return [];
      }

      return [];
    } catch (error) {
      console.error('❌ Get public events error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch public events');
    }
  }

  /**
   * Get public event by ID
   * @param {number} eventId - Event ID
   * @returns {Promise<Object>} Event details
   */
  async getPublicEventById(eventId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PUBLIC_EVENT_BY_ID(eventId));

      console.log('🔍 Public Event Detail Response:', response.data);

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error('Event not found');
    } catch (error) {
      console.error('❌ Get public event by ID error:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch event details');
    }
  }

  /**
   * ========================================
   * ADMIN EVENTS API (Requires Authentication)
   * ========================================
   */

  /**
   * Get all events (Admin view)
   * @param {Object} params - Query parameters (search, status, page, pageSize)
   * @returns {Promise<Array>} List of events
   */
  async getAllEvents(params = {}) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.EVENTS, { params });

      console.log('🔍 Full response:', response.data);

      if (response.data.success) {
        const result = response.data.data;

        // Backend trả về paginated data: { data: [...], totalRecords, page, pageSize, totalPages }
        if (result && result.data && Array.isArray(result.data)) {
          console.log('✅ Paginated response:', result);

          // Return cả object chứa pagination info
          return {
            data: result.data,
            currentPage: result.page || 1,
            pageSize: result.pageSize || 10,
            totalItems: result.totalRecords || 0,
            totalPages: result.totalPages || Math.ceil((result.totalRecords || 0) / (result.pageSize || 10))
          };
        }

        // Hoặc direct array (fallback cho API không có pagination)
        if (Array.isArray(result)) {
          console.log('✅ Direct array response:', result);
          return {
            data: result,
            currentPage: 1,
            pageSize: result.length,
            totalItems: result.length,
            totalPages: 1
          };
        }

        console.warn('⚠️ Unexpected response structure:', result);
        return {
          data: [],
          currentPage: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 0
        };
      }

      return {
        data: [],
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0
      };
    } catch (error) {
      console.error('Get all events error:', error);
      throw new Error('Failed to fetch events');
    }
  }

  /**
   * Get event by ID (Admin view)
   * @param {number} eventId - Event ID
   * @returns {Promise<Object>} Event details
   */
  async getEventById(eventId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.EVENT_BY_ID(eventId));

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error('Event not found');
    } catch (error) {
      console.error('Get event by ID error:', error);
      throw new Error('Failed to fetch event details');
    }
  }

  async getEventByMySelf() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.LIST_EVENTS_MYSELF);

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error('Event not found');
    } catch (error) {
      console.error('Get event by myself error:', error);
      throw new Error('Failed to fetch event details');
    }
  }

  async getEventTaskByStaff() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.EVENT_TASKS);

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error('Event not found');
    } catch (error) {
      console.error('Get event tasks by staff error:', error);
      throw new Error('Failed to fetch event tasks');
    }
  }

  async updateEventTaskByStaff(taskID, status) {
    try {
      const response = await apiClient.put(API_ENDPOINTS.EVENT_TASK_BY_ID(taskID), {
        status: status
      });

      if (response.data.success) {
        return response.data;
      }

      throw new Error('Event not found');
    } catch (error) {
      console.error('Get event tasks by staff error:', error);
      throw new Error('Failed to fetch event tasks');
    }
  }


  async registerEvent(eventID) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.REGISTER_EVENT_BY_STUDENT(eventID));

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error(response.data.message);
    } catch (error) {
      console.error('Register event error:', error);
      throw new Error('Failed to register for event');
    }
  }

  async cancelEventRegistration(eventID) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.CANCEL_REGISTER_EVENT_BY_STUDENT(eventID));
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message);
    } catch (error) {
      console.error('Cancel registration error:', error);
      throw error;
    }
  }

  /**
   * Create new event (Admin/Manager only)
   * @param {Object} eventData - Event data
   * @returns {Promise<Object>} Created event
   */
  async createEvent(eventData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.EVENTS, eventData);

      if (response.data.success) {
        return response.data;
      }

      throw new Error('Failed to create event');
    } catch (error) {
      console.error('Create event error:', error);
      throw new Error(error.response?.data?.message || 'Failed to create event');
    }
  }

  /**
   * Update event (Admin/Manager only)
   * @param {number} eventId - Event ID
   * @param {Object} eventData - Updated event data
   * @returns {Promise<Object>} Updated event
   */
  async updateEvent(eventId, eventData) {
    try {
      const response = await apiClient.put(
        API_ENDPOINTS.EVENT_BY_ID(eventId),
        eventData
      );

      if (response.data.success) {
        return response.data;
      }

      throw new Error('Failed to update event');
    } catch (error) {
      console.error('Update event error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update event');
    }
  }

  /**
   * Delete event (Admin only)
   * @param {number} eventId - Event ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteEvent(eventId) {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.EVENT_BY_ID(eventId));
      return response.data.success;
    } catch (error) {
      console.error('Delete event error:', error);
      throw new Error('Failed to delete event');
    }
  }

  /**
   * ========================================
   * HELPER METHODS
   * ========================================
   */

  /**
   * Get upcoming events (using public API)
   * @param {number} limit - Number of events to fetch
   * @returns {Promise<Array>} List of upcoming events
   */
  async getUpcomingEvents(limit = 10) {
    try {
      // Use public events API and filter for upcoming
      const events = await this.getPublicEvents();

      const now = new Date();
      const upcomingEvents = events
        .filter(event => new Date(event.startTime) > now)
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
        .slice(0, limit);

      return upcomingEvents;
    } catch (error) {
      console.error('Get upcoming events error:', error);
      throw new Error('Failed to fetch upcoming events');
    }
  }

  /**
   * Get ongoing events (using public API)
   * @returns {Promise<Array>} List of ongoing events
   */
  async getOngoingEvents() {
    try {
      const events = await this.getPublicEvents();

      const now = new Date();
      const ongoingEvents = events.filter(event => {
        const start = new Date(event.startTime);
        const end = new Date(event.endTime);
        return start <= now && end >= now;
      });

      return ongoingEvents;
    } catch (error) {
      console.error('Get ongoing events error:', error);
      throw new Error('Failed to fetch ongoing events');
    }
  }

  /**
   * Search public events
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} List of matching events
   */
  async searchPublicEvents(searchTerm) {
    try {
      const events = await this.getPublicEvents();

      if (!searchTerm) return events;

      const term = searchTerm.toLowerCase();
      return events.filter(event =>
        event.eventName?.toLowerCase().includes(term) ||
        event.locationName?.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Search public events error:', error);
      throw new Error('Failed to search events');
    }
  }
  /**
 * ========================================
 * EVENT MANAGER (EM) API
 * ========================================
 */

  /**
   * Get overview statistics for current EM
   * (tổng quan để hiển thị 4 cards trên dashboard)
   */
  async getMyEventsOverview() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.MY_EVENTS_OVERVIEW);

      console.log("📊 EM Overview response:", response.data);

      if (response.data.success) {
        return response.data.data;
      }

      throw new Error(
        response.data.message || "Failed to load event manager overview"
      );
    } catch (error) {
      console.error("❌ Get EM overview error:", error);
      throw new Error(
        error.response?.data?.message ||
        "Failed to load event manager overview"
      );
    }
  }

  /**
   * Get events managed by current EM
   * (dùng cho bảng 'Sự kiện đang quản lý')
   */
  async getMyEvents(params = {}) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.MY_EVENTS, { params });

      console.log("📂 EM Events response:", response.data);

      if (response.data.success) {
        const result = response.data.data;

        // Nếu backend trả dạng { data: [], totalRecords, ... }
        if (result && Array.isArray(result.data)) {
          return result.data;
        }

        // Nếu backend trả thẳng mảng []
        if (Array.isArray(result)) {
          return result;
        }

        return [];
      }

      throw new Error(response.data.message || "Failed to load my events");
    } catch (error) {
      console.error("❌ Get EM events error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to load my events"
      );
    }
  }
  async getMyManagedEvents(params = {}) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.MY_EVENTS, { params });

      if (response.data.success) {
        return response.data.data.data; // data.data = mảng sự kiện
      }

      throw new Error(response.data.message || "Failed to load events");
    } catch (err) {
      console.error("❌ Error getMyManagedEvents:", err);
      throw err;
    }
  }



  /**
   * Filter events by category/type
   * @param {Array} events - Events array
   * @param {string} category - Category to filter by
   * @returns {Array} Filtered events
   */
  filterEventsByCategory(events, category) {
    if (category === 'All' || !category) return events;

    // You can add category logic here based on your backend data
    // For now, we'll return all events
    return events;
  }

  /**
   * Sort events
   * @param {Array} events - Events array
   * @param {string} sortBy - Sort criterion ('Newest' or 'Oldest')
   * @returns {Array} Sorted events
   */
  sortEvents(events, sortBy = 'Newest') {
    const sorted = [...events];

    if (sortBy === 'Newest') {
      return sorted.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    } else {
      return sorted.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }
  }

  createSubEvent = async (parentID, subEventData) => {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.Create_SubEvent(parentID),
        subEventData
      );
      if (response.data.success) {
        return response.data;
      }
      throw new Error('Failed to create sub-event');
    } catch (error) {
      console.error('Create sub-event error:', error);
      throw new Error(error.response?.data?.message || 'Failed to create sub-event');
    }
  };

  getResources = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.RESOURCES);

      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch resources');
    } catch (error) {
      console.error('Get resources error:', error);
      throw new Error('Failed to fetch resources');
    }
  };

  getAllLocations = async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.LOCATIONS, { params });
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch locations');
    } catch (error) {
      console.error('Get locations error:', error);
      throw new Error('Failed to fetch locations');
    }
  };
  getAllExternalLocations = async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.EXTERNAL_LOCATIONS, { params });
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch external locations');
    } catch (error) {
      console.error('Get external locations error:', error);
      throw new Error('Failed to fetch external locations');
    }
  }

  getSubEventsByParentID = async (parentID, params = {}) => {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.SUB_EVENTS_BY_PARENT_ID(parentID),
        { params }
      );

      console.log("🔍 Sub-events response:", response.data);

      if (response.data.success) {
        const result = response.data.data;

        // 👉 Backend trả về dạng paginated
        // { data: [...], totalRecords, page, pageSize, totalPages }
        if (result && result.data && Array.isArray(result.data)) {
          return {
            data: result.data,
            currentPage: result.page || 1,
            pageSize: result.pageSize || 10,
            totalItems: result.totalRecords || 0,
            totalPages:
              result.totalPages ||
              Math.ceil(
                (result.totalRecords || 0) / (result.pageSize || 10)
              ),
          };
        }

        // 👉 Fallback: backend trả array trực tiếp
        if (Array.isArray(result)) {
          return {
            data: result,
            currentPage: 1,
            pageSize: result.length,
            totalItems: result.length,
            totalPages: 1,
          };
        }

        console.warn("⚠️ Unexpected sub-events response:", result);
      }

      return {
        data: [],
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
      };
    } catch (error) {
      console.error("Get sub-events error:", error);
      throw new Error("Failed to fetch sub-events");
    }
  };


  getAllResources = async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.RESOURCES, { params });
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch resources');
    } catch (error) {
      console.error('Get resources error:', error);
      throw new Error('Failed to fetch resources');
    }
  }

  assignEventResources = async (eventId, resources) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.ASSIGN_EVENT_RESOURCES(eventId), resources);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to assign event resources');
    } catch (error) {
      console.error('Assign event resources error:', error);
      throw new Error('Failed to assign event resources');
    }
  }
  createExternalService = async (eventId, externalServiceData) => {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.CREATE_EXTERNAL_SERVICE(eventId),
        externalServiceData
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to create external service');
    } catch (error) {
      console.error('Create external service error:', error);
      throw new Error(error.response?.data?.message || 'Failed to create external service');
    }
  };

  updateSubEvent = async (subEventID, subEventData) => {
    try {
      const response = await apiClient.put(
        API_ENDPOINTS.UPDATE_SUB_EVENT(subEventID),
        subEventData
      );
      if (response.data.success) {
        return response.data;
      }
      throw new Error('Failed to update sub-event');
    } catch (error) {
      console.error('Update sub-event error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update sub-event');
    }
  };
  updateAssignEventResources = async (eventId, resources) => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.ASSIGN_EVENT_RESOURCES(eventId), resources);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to update assigned event resources');
    } catch (error) {
      console.error('Update assigned event resources error:', error);
      throw new Error('Failed to update assigned event resources');
    }
  }
  updateExternalService = async (eventId, externalServiceData) => {
    try {
      const response = await apiClient.put(
        API_ENDPOINTS.UPDATE_EXTERNAL_SERVICE(eventId),
        externalServiceData
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to update external service');
    }
    catch (error) {
      console.error('Update external service error:', error);
      throw new Error(error.response?.data?.message || 'Failed to update external service');
    }
  };

}






const eventService = new EventService();
export default eventService;