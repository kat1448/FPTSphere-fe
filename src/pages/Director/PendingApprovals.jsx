import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import directorService from "../../services/directorService";
import "../../assets/css/pending-approvals.css";

/**
 * Pending Approvals Page
 * Director can view, search, filter, and review pending events
 * Features:
 * - Expandable event cards with sub-events preview
 * - Search by event name
 * - Filter by date range
 * - Sort by oldest first (closest to deadline)
 * - Click to review full details
 */
const PendingApprovals = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedEvents, setExpandedEvents] = useState(new Set());

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Sub-events cache (loaded when expanded)
  const [subEventsCache, setSubEventsCache] = useState({});
  const [loadingSubEvents, setLoadingSubEvents] = useState({});

  // Fetch pending events on mount
  useEffect(() => {
    fetchPendingEvents();
  }, []);

  const fetchPendingEvents = async () => {
    try {
      setLoading(true);
      const events = await directorService.getPendingApprovals();
      setPendingEvents(events || []);
    } catch (error) {
      console.error("❌ Error loading pending events:", error);
      toast.error("Failed to load pending events");
      setPendingEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Toggle expand/collapse for an event
  const toggleExpand = async (eventId) => {
    const newExpanded = new Set(expandedEvents);

    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);

      // Load sub-events if not cached
      if (!subEventsCache[eventId]) {
        await loadSubEvents(eventId);
      }
    }

    setExpandedEvents(newExpanded);
  };

  // Load sub-events for an event
  const loadSubEvents = async (eventId) => {
    try {
      setLoadingSubEvents((prev) => ({ ...prev, [eventId]: true }));

      // Get sub-events from the API
      const subEvents = await directorService.getSubEvents(eventId);

      setSubEventsCache((prev) => ({ ...prev, [eventId]: subEvents || [] }));
    } catch (error) {
      console.error("❌ Error loading sub-events:", error);
      setSubEventsCache((prev) => ({ ...prev, [eventId]: [] }));
    } finally {
      setLoadingSubEvents((prev) => ({ ...prev, [eventId]: false }));
    }
  };

  // Filter and search events
  const filteredEvents = useMemo(() => {
    let result = [...pendingEvents];

    // Search by event name
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((event) =>
        event.eventName.toLowerCase().includes(term)
      );
    }

    // Filter by date range (event start date)
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      result = result.filter((event) => new Date(event.startTime) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      result = result.filter((event) => new Date(event.startTime) <= toDate);
    }

    // Already sorted by oldest first from backend, but ensure it
    result.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    return result;
  }, [pendingEvents, searchTerm, dateFrom, dateTo]);

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format date and time
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate days until event starts
  const getDaysUntilStart = (startTime) => {
    const now = new Date();
    const start = new Date(startTime);
    const diffTime = start - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get urgency class based on days until start
  const getUrgencyClass = (startTime) => {
    const days = getDaysUntilStart(startTime);
    if (days <= 1) return "urgent";
    if (days <= 3) return "warning";
    return "normal";
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
  };

  // Navigate to review page
  const handleReview = (eventId) => {
    navigate(`/director/events/review/${eventId}`);
  };

  if (loading) {
    return (
      <div className="pending-approvals">
        <div className="pa-loading">
          <span>⏳</span>
          <p>Loading pending events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pending-approvals">
      {/* Page Header */}
      <div className="pa-header">
        <div className="pa-header-text">
          <h1>📋 Pending Approvals</h1>
          <p>Review and approve or reject event submissions</p>
        </div>
        <div className="pa-header-stats">
          <span className="pa-count">{filteredEvents.length}</span>
          <span className="pa-count-label">
            {filteredEvents.length === 1 ? "event" : "events"} pending
          </span>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="pa-filters">
        <div className="pa-search">
          <span className="pa-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by event name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="pa-search-clear"
              onClick={() => setSearchTerm("")}
            >
              ✕
            </button>
          )}
        </div>

        <div className="pa-date-filters">
          <div className="pa-date-field">
            <label>From:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="pa-date-field">
            <label>To:</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          {(searchTerm || dateFrom || dateTo) && (
            <button className="pa-clear-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Events List */}
      <div className="pa-events-list">
        {filteredEvents.length === 0 ? (
          <div className="pa-empty">
            {pendingEvents.length === 0 ? (
              <>
                <span>✅</span>
                <h3>No Pending Events</h3>
                <p>All events have been reviewed. Great job!</p>
              </>
            ) : (
              <>
                <span>🔍</span>
                <h3>No Matching Events</h3>
                <p>Try adjusting your search or filters</p>
                <button className="pa-btn-secondary" onClick={clearFilters}>
                  Clear Filters
                </button>
              </>
            )}
          </div>
        ) : (
          filteredEvents.map((event) => {
            const isExpanded = expandedEvents.has(event.eventId);
            const urgencyClass = getUrgencyClass(event.startTime);
            const daysUntil = getDaysUntilStart(event.startTime);
            const subEvents = subEventsCache[event.eventId] || [];
            const isLoadingSubs = loadingSubEvents[event.eventId];

            return (
              <div
                key={event.eventId}
                className={`pa-event-card ${urgencyClass} ${isExpanded ? "expanded" : ""}`}
              >
                {/* Event Card Header */}
                <div className="pa-event-header">
                  <div className="pa-event-main">
                    <div className="pa-event-title-row">
                      <h3 className="pa-event-name">{event.eventName}</h3>
                      <span className={`pa-urgency-badge ${urgencyClass}`}>
                        {daysUntil <= 0
                          ? "⚠️ Today!"
                          : daysUntil === 1
                          ? "⚠️ Tomorrow"
                          : `${daysUntil} days left`}
                      </span>
                    </div>

                    <div className="pa-event-meta">
                      <span className="pa-meta-item">
                        📅 {formatDate(event.startTime)}
                      </span>
                      <span className="pa-meta-item">
                        👤 {event.createdByName}
                      </span>
                      {event.expectedAttendees > 0 && (
                        <span className="pa-meta-item">
                          👥 {event.expectedAttendees} attendees
                        </span>
                      )}
                      {event.subEventsCount > 0 && (
                        <span className="pa-meta-item">
                          📁 {event.subEventsCount} sub-events
                        </span>
                      )}
                    </div>

                    {event.submitterNote && (
                      <p className="pa-event-note">
                        💬 "{event.submitterNote}"
                      </p>
                    )}
                  </div>

                  <div className="pa-event-actions">
                    <button
                      className="pa-btn-expand"
                      onClick={() => toggleExpand(event.eventId)}
                    >
                      {isExpanded ? "▲ Collapse" : "▼ Expand"}
                    </button>
                    <button
                      className="pa-btn-primary"
                      onClick={() => handleReview(event.eventId)}
                    >
                      Review →
                    </button>
                  </div>
                </div>

                {/* Expanded Content - Sub-events */}
                {isExpanded && (
                  <div className="pa-event-expanded">
                    <div className="pa-expanded-header">
                      <h4>📁 Sub-Events ({event.subEventsCount})</h4>
                    </div>

                    {isLoadingSubs ? (
                      <div className="pa-loading-subs">
                        <span>Loading sub-events...</span>
                      </div>
                    ) : subEvents.length === 0 ? (
                      <div className="pa-no-subs">
                        <span>No sub-events for this event</span>
                      </div>
                    ) : (
                      <div className="pa-subevents-list">
                        {subEvents.map((subEvent, index) => (
                          <div key={subEvent.eventId || index} className="pa-subevent-item">
                            <div className="pa-subevent-info">
                              <span className="pa-subevent-name">
                                {subEvent.eventName}
                              </span>
                              <span className="pa-subevent-time">
                                {formatDateTime(subEvent.startTime)}
                              </span>
                            </div>
                            <div className="pa-subevent-location">
                              📍 {subEvent.locationName || subEvent.externalLocationName || "TBA"}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pa-expanded-actions">
                      <button
                        className="pa-btn-primary pa-btn-large"
                        onClick={() => handleReview(event.eventId)}
                      >
                        Review Full Details →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PendingApprovals;