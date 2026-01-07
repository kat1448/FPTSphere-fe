import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import directorService from "../../services/directorService";
import "../../assets/css/director-dashboard.css";

const DirectorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName = user?.fullName || "Director";

  // State
  const [pendingEvents, setPendingEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch pending approvals (requires Director role)
      try {
        const pending = await directorService.getPendingApprovals();
        setPendingEvents(pending || []);
      } catch (err) {
        console.error("❌ Error loading pending approvals:", err);
        // Don't set global error - just log it
        // The pending list will be empty but calendar can still work
        setPendingEvents([]);
      }

      // Fetch approved events for calendar (no auth required)
      try {
        const events = await directorService.getAllEvents({
          statusId: 3, // Approved events
        });
        
        // Also get ongoing events
        const ongoing = await directorService.getOngoingEvents();
        
        setAllEvents([...(events || []), ...(ongoing || [])]);
      } catch (err) {
        console.error("❌ Error loading events for calendar:", err);
        setAllEvents([]);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  // Calendar helpers
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of month (0 = Sunday, 1 = Monday, etc.)
    const firstDay = new Date(year, month, 1).getDay();
    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    const startDay = firstDay === 0 ? 6 : firstDay - 1;

    // Days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Get event dates for this month
    const eventDates = new Set();
    allEvents.forEach((event) => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);

      // Add all days between start and end
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getMonth() === month && d.getFullYear() === year) {
          eventDates.add(d.getDate());
        }
      }
    });

    return {
      year,
      month,
      startDay,
      daysInMonth,
      eventDates,
      monthName: currentMonth.toLocaleString("en-US", { month: "long" }),
    };
  }, [currentMonth, allEvents]);

  // Check if a day has events
  const hasEvent = (day) => calendarData.eventDates.has(day);

  // Check if today
  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      calendarData.month === today.getMonth() &&
      calendarData.year === today.getFullYear()
    );
  };

  // Navigate calendar
  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Render calendar grid
  const renderCalendar = () => {
    const days = [];
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    // Day headers
    dayNames.forEach((name) => {
      days.push(
        <div key={`header-${name}`} className="director-calendar-day-name">
          {name}
        </div>
      );
    });

    // Empty cells before first day
    for (let i = 0; i < calendarData.startDay; i++) {
      days.push(<div key={`empty-${i}`} className="director-calendar-day empty"></div>);
    }

    // Day cells
    for (let day = 1; day <= calendarData.daysInMonth; day++) {
      const hasEventClass = hasEvent(day) ? "has-event" : "";
      const todayClass = isToday(day) ? "today" : "";

      days.push(
        <div
          key={`day-${day}`}
          className={`director-calendar-day ${hasEventClass} ${todayClass}`}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <div className="director-dashboard">
        <div className="director-loading">
          <span>⏳</span>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="director-dashboard">
      {/* Welcome Header */}
      <div className="director-welcome">
        <div className="director-welcome-text">
          <h1>Welcome back, {displayName}</h1>
          <p>Here's an overview of events awaiting your attention.</p>
        </div>
        <div className="director-welcome-date">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="director-content-grid">
        {/* Left Column - Pending Events */}
        <div className="director-main-column">
          {/* Pending Approvals Card */}
          <div className="director-card">
            <div className="director-card-header">
              <div className="director-card-title">
                <span className="icon">📋</span>
                <h2>Pending Approvals</h2>
                <span className="count">{pendingEvents.length}</span>
              </div>
              <button
                className="director-btn-link"
                onClick={() => navigate("/director/events/approvals")}
              >
                View all →
              </button>
            </div>

            <div className="director-card-content">
              {pendingEvents.length === 0 ? (
                <div className="director-empty-state">
                  <span>✅</span>
                  <p>No events pending approval</p>
                  <small>All caught up! Check back later.</small>
                </div>
              ) : (
                <div className="director-event-list">
                  {pendingEvents.slice(0, 5).map((event) => (
                    <div key={event.eventId} className="director-event-item">
                      <div className="director-event-info">
                        <h3>{event.eventName}</h3>
                        <div className="director-event-meta">
                          <span>📅 {formatDate(event.startTime)}</span>
                          <span>👤 {event.createdByName || "Unknown"}</span>
                          {event.expectedAttendees && (
                            <span>👥 {event.expectedAttendees} attendees</span>
                          )}
                        </div>
                        {event.submitterNote && (
                          <p className="director-event-note">
                            💬 "{event.submitterNote}"
                          </p>
                        )}
                      </div>
                      <div className="director-event-actions">
                        <button
                          className="director-btn-primary"
                          onClick={() =>
                            navigate(`/director/events/approvals?id=${event.eventId}`)
                          }
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="director-stats-row">
            <div className="director-stat-card">
              <span className="director-stat-icon">⏳</span>
              <div className="director-stat-info">
                <span className="director-stat-value">{pendingEvents.length}</span>
                <span className="director-stat-label">Pending</span>
              </div>
            </div>
            <div className="director-stat-card">
              <span className="director-stat-icon">🟢</span>
              <div className="director-stat-info">
                <span className="director-stat-value">
                  {allEvents.filter((e) => e.statusId === 4).length}
                </span>
                <span className="director-stat-label">Ongoing</span>
              </div>
            </div>
            <div className="director-stat-card">
              <span className="director-stat-icon">✅</span>
              <div className="director-stat-info">
                <span className="director-stat-value">
                  {allEvents.filter((e) => e.statusId === 3).length}
                </span>
                <span className="director-stat-label">Approved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Calendar */}
        <div className="director-side-column">
          {/* Calendar Card */}
          <div className="director-card">
            <div className="director-card-header">
              <div className="director-card-title">
                <span className="icon">📅</span>
                <h2>Event Calendar</h2>
              </div>
            </div>

            <div className="director-calendar-header">
              <button
                className="director-calendar-nav"
                onClick={prevMonth}
                type="button"
              >
                ←
              </button>
              <span className="director-calendar-month">
                {calendarData.monthName} {calendarData.year}
              </span>
              <button
                className="director-calendar-nav"
                onClick={nextMonth}
                type="button"
              >
                →
              </button>
            </div>

            <div className="director-calendar-grid">{renderCalendar()}</div>

            <div className="director-calendar-legend">
              <div className="legend-item">
                <span className="legend-dot"></span>
                <span>No events</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot has-event"></span>
                <span>Has events</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot today"></span>
                <span>Today</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="director-card">
            <div className="director-card-header">
              <div className="director-card-title">
                <span className="icon">⚡</span>
                <h2>Quick Actions</h2>
              </div>
            </div>

            <div className="director-quick-actions">
              <button
                className="director-action-btn"
                onClick={() => navigate("/director/events/approvals")}
              >
                <span>📋</span>
                <span>Review Pending Events</span>
              </button>
              <button
                className="director-action-btn"
                onClick={() => navigate("/director/events/ongoing")}
              >
                <span>🟢</span>
                <span>View Ongoing Events</span>
              </button>
              <button
                className="director-action-btn"
                onClick={() => navigate("/director/events/history")}
              >
                <span>📜</span>
                <span>Browse Event History</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectorDashboard;