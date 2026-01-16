import React, { useState, useEffect } from "react";
import eventService from "../services/EventService";
import "../assets/css/my-events.css";

const EventHistory = () => {
  // State
  const [myEvents, setMyEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Newest");

  /**
   * Load my registered events on component mount
   */
  useEffect(() => {
    loadMyEvents();
  }, []);

  /**
   * Fetch my registered events from API
   */
  const loadMyEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await eventService.getEventByMySelf();
      console.log("📦 Loaded my events:", response);

      setMyEvents(response);
      setFilteredEvents(response);
    } catch (err) {
      console.error("❌ Error loading my events:", err);
      setError(err.message || "Failed to load your events");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filter and sort events when filters change
   */
  useEffect(() => {
    let result = myEvents;

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.event.eventName?.toLowerCase().includes(searchLower) ||
          item.event.location?.name?.toLowerCase().includes(searchLower) ||
          item.event.externalLocation?.name
            ?.toLowerCase()
            .includes(searchLower) ||
          item.event.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filter === "Checked In") {
      result = result.filter((item) => item.checkinAt && !item.checkoutAt);
    } else if (filter === "Completed") {
      result = result.filter((item) => item.checkinAt && item.checkoutAt);
    } else if (filter === "Not Attended") {
      result = result.filter((item) => !item.checkinAt);
    }

    // Sort events
    result = [...result].sort((a, b) => {
      if (sort === "Newest") {
        return new Date(b.event.startTime) - new Date(a.event.startTime);
      } else {
        return new Date(a.event.startTime) - new Date(b.event.startTime);
      }
    });

    setFilteredEvents(result);
  }, [myEvents, search, filter, sort]);

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /**
   * Get event status badge (based on event status)
   */
  const getEventStatusBadge = (statusName) => {
    switch (statusName) {
      case "Draft":
        return <span className="event-status-badge draft">📝 Draft</span>;
      case "Pending Approval":
        return <span className="event-status-badge pending">⏳ Pending</span>;
      case "Approved":
        return <span className="event-status-badge approved">✅ Approved</span>;
      case "In Progress":
        return (
          <span className="event-status-badge in-progress">🔴 In Progress</span>
        );
      case "Completed":
        return (
          <span className="event-status-badge event-completed">
            🎉 Completed
          </span>
        );
      case "Cancelled":
        return (
          <span className="event-status-badge cancelled">❌ Cancelled</span>
        );
      case "Rejected":
        return <span className="event-status-badge rejected">🚫 Rejected</span>;
      default:
        return (
          <span className="event-status-badge unknown">❓ {statusName}</span>
        );
    }
  };
  /**
   * Format time for display
   */
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Format datetime for display
   */
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Get event status badge
   */
  const getStatusBadge = (item) => {
    const now = new Date();
    const startTime = new Date(item.event.startTime);
    const endTime = new Date(item.event.endTime);

    if (item.checkinAt && item.checkoutAt) {
      return <span className="status-badge completed">✅ Completed</span>;
    } else if (item.checkinAt && !item.checkoutAt) {
      return <span className="status-badge checked-in">🎫 Checked In</span>;
    } else if (endTime < now) {
      return <span className="status-badge missed">❌ Missed</span>;
    } else if (startTime > now) {
      return <span className="status-badge upcoming">⏰ Upcoming</span>;
    } else {
      return <span className="status-badge ongoing">🔴 Ongoing</span>;
    }
  };

  /**
   * Get location name
   */
  const getLocationName = (event) => {
    if (event.location) {
      return `${event.location.name} - Building ${event.location.building}`;
    } else if (event.externalLocation) {
      return event.externalLocation.name;
    }
    return "TBA";
  };

  /**
   * Get statistics
   */
  const getStats = () => {
    const now = new Date();
    const upcoming = myEvents.filter(
      (item) => new Date(item.event.startTime) > now
    ).length;
    const completed = myEvents.filter(
      (item) => item.checkinAt && item.checkoutAt
    ).length;
    const checkedIn = myEvents.filter(
      (item) => item.checkinAt && !item.checkoutAt
    ).length;

    return { upcoming, completed, checkedIn, total: myEvents.length };
  };

  const stats = getStats();

  /**
   * Handle view event details
   */
  const handleViewDetails = (eventId) => {
    window.location.href = `/events/${eventId}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="my-events-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your events... ✨</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="my-events-page">
        <div className="error-container">
          <h2>😢 Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={loadMyEvents} className="retry-btn">
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  // No events state
  if (myEvents.length === 0) {
    return (
      <div className="my-events-page">
        <div className="empty-container">
          <h2>📅 No Events Registered</h2>
          <p>You haven't registered for any events yet.</p>
          <button
            onClick={() => (window.location.href = "/events")}
            className="browse-btn"
          >
            🔍 Browse Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-events-page">
      {/* Banner */}
      <div className="my-events-banner">
        <h1>My Registered Events</h1>
        <p>Track and manage all the events you've registered for</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-container">
        <div className="stat-card total">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Events</p>
          </div>
        </div>
        <div className="stat-card upcoming">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h3>{stats.upcoming}</h3>
            <p>Upcoming</p>
          </div>
        </div>
        <div className="stat-card checked-in">
          <div className="stat-icon">🎫</div>
          <div className="stat-content">
            <h3>{stats.checkedIn}</h3>
            <p>Checked In</p>
          </div>
        </div>
        <div className="stat-card completed">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.completed}</h3>
            <p>Completed</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="my-events-controls">
        <input
          type="text"
          className="search-bar"
          placeholder="🔍 Search your events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filters">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option>All</option>
            <option>Upcoming</option>
            <option>Past</option>
            <option>Checked In</option>
            <option>Completed</option>
            <option>Not Attended</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option>Newest</option>
            <option>Oldest</option>
          </select>
        </div>
      </div>

      {/* Events List */}
      <div className="my-events-grid">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((item) => (
            <div key={item.attendanceId} className="my-event-card">
              <div className="my-event-image-container">
                <img
                  src={
                    item.event.bannerUrl ||
                    `https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=60`
                  }
                  alt={item.event.eventName}
                  className="my-event-image"
                />
                <div className="my-event-overlay">
                  <button
                    className="view-btn"
                    onClick={() => handleViewDetails(item.event.eventId)}
                  >
                    View Details
                  </button>
                </div>
                {getStatusBadge(item)}
              </div>

              <div className="my-event-content">
                <h3>{item.event.eventName}</h3>
                <p className="event-description">{item.event.description}</p>

                <div className="event-details">
                  <div className="detail-row">
                    <span className="detail-label">📅 Date:</span>
                    <span className="detail-value">
                      {formatDate(item.event.startTime)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">🕐 Time:</span>
                    <span className="detail-value">
                      {formatTime(item.event.startTime)} -{" "}
                      {formatTime(item.event.endTime)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">📍 Location:</span>
                    <span className="detail-value">
                      {getLocationName(item.event)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">👥 Expected:</span>
                    <span className="detail-value">
                      {item.event.expectedAttendees} attendees
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">✅ Status:</span>
                    <span className="detail-value">
                      {getEventStatusBadge(item.event.status.statusName)}
                    </span>
                  </div>
                </div>

                {/* Attendance Info */}
                <div className="attendance-info">
                  {" "}
                  {/* ✅ LUÔN hiển thị */}
                  <div className="attendance-row">
                    {" "}
                    {/* ✅ LUÔN hiển thị row check-in */}
                    <span>✅ Check-in:</span>
                    <span className={item.checkinAt ? "" : "not-checked"}>
                      {item.checkinAt
                        ? formatDateTime(item.checkinAt)
                        : "Not checked in yet"}
                      {/* ✅ Hiển thị thời gian HOẶC "Not checked in yet" */}
                    </span>
                  </div>
                  <div className="attendance-row">
                    {" "}
                    {/* ✅ LUÔN hiển thị row check-out */}
                    <span>🚪 Check-out:</span>
                    <span className={item.checkoutAt ? "" : "not-checked"}>
                      {item.checkoutAt
                        ? formatDateTime(item.checkoutAt)
                        : "Not checked out yet"}
                      {/* ✅ Hiển thị thời gian HOẶC "Not checked out yet" */}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-results">
            No events found matching your criteria 😢
          </p>
        )}
      </div>
    </div>
  );
};

export default EventHistory;
