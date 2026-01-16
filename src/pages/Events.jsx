import React, { useState, useEffect } from "react";
import eventService from "../services/EventService";
import "../assets/css/events.css";

const Events = () => {
  // State
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Newest");
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  /**
   * Load events from backend on component mount
   */
  useEffect(() => {
    loadPublicEvents();
  }, []);

  /**
   * Fetch public events from API
   */
  const loadPublicEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await eventService.getPublicEvents();
      console.log('📦 Loaded events:', response);
      
      setEvents(response);
      setFilteredEvents(response);
      
    } catch (err) {
      console.error('❌ Error loading events:', err);
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Find the next upcoming event
   */
  const getUpcomingEvent = () => {
    const now = new Date();
    const upcoming = events
      .filter(e => new Date(e.startTime) > now)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    
    return upcoming.length > 0 ? upcoming[0] : events[0];
  };

  const upcomingEvent = getUpcomingEvent();

  /**
   * Countdown timer for upcoming event
   */
  useEffect(() => {
    if (!upcomingEvent) return;

    const timer = setInterval(() => {
      const diff = new Date(upcomingEvent.startTime) - new Date();
      if (diff <= 0) {
        clearInterval(timer);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [upcomingEvent]);

  /**
   * Filter and sort events when filters change
   */
  useEffect(() => {
    let result = events;

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(e =>
        e.eventName?.toLowerCase().includes(searchLower) ||
        e.locationName?.toLowerCase().includes(searchLower) ||
        e.description?.toLowerCase().includes(searchLower)
      );
    }

    // Sort events
    result = [...result].sort((a, b) => {
      if (sort === "Newest") {
        return new Date(b.startTime) - new Date(a.startTime);
      } else {
        return new Date(a.startTime) - new Date(b.startTime);
      }
    });

    setFilteredEvents(result);
  }, [events, search, sort]);

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  /**
   * Format time for display
   */
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  /**
   * Handle view event details
   */
  const handleViewDetails = (eventId) => {
    // Navigate to event detail page
    window.location.href = `/events/${eventId}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="events-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading exciting events... ✨</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="events-page">
        <div className="error-container">
          <h2>😢 Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={loadPublicEvents} className="retry-btn">
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  // No events state
  if (events.length === 0) {
    return (
      <div className="events-page">
        <div className="empty-container">
          <h2>📅 No Events Yet</h2>
          <p>Check back soon for exciting events!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="events-page">
      {/* Banner */}
      <div className="events-banner">
        <h1>Discover Exciting Events ✨</h1>
        <p>Explore what's happening across FPTSphere – learn, connect, and grow.</p>
      </div>

      {/* Countdown Section */}
      {upcomingEvent && (
        <div className="countdown-section">
          <h2>⏳ Upcoming Event: <span>{upcomingEvent.eventName}</span></h2>
          <p className="countdown-location">📍 {upcomingEvent.locationName || 'TBA'}</p>
          <p className="countdown-date">📅 {formatDate(upcomingEvent.startTime)} at {formatTime(upcomingEvent.startTime)}</p>

          <div className="countdown-timer">
            <div className="time-box">
              <h3>{timeLeft.days}</h3>
              <span>Days</span>
            </div>
            <div className="time-box">
              <h3>{timeLeft.hours}</h3>
              <span>Hours</span>
            </div>
            <div className="time-box">
              <h3>{timeLeft.minutes}</h3>
              <span>Minutes</span>
            </div>
            <div className="time-box">
              <h3>{timeLeft.seconds}</h3>
              <span>Seconds</span>
            </div>
          </div>
        </div>
      )}

      {/* Search & Sort (NO CATEGORY FILTER) */}
      <div className="events-controls">
        <input
          type="text"
          className="search-bar"
          placeholder="🔍 Search by name or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filters">
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option>Newest</option>
            <option>Oldest</option>
          </select>
        </div>
      </div>

      {/* Event Grid */}
      <div className="events-grid">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <div key={event.eventId} className="event-card">
              <div className="event-image-container">
                <img 
                  src={event.imageUrl || `https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=900&q=60`} 
                  alt={event.eventName} 
                  className="event-image" 
                />
                <div className="event-overlay">
                  <button 
                    className="view-btn"
                    onClick={() => handleViewDetails(event.eventId)}
                  >
                    View Details
                  </button>
                </div>
              </div>
              <div className="event-content">
                <h3>{event.eventName}</h3>
                <p className="event-date">📅 {formatDate(event.startTime)}</p>
                <p className="event-time">🕐 {formatTime(event.startTime)}</p>
                <p className="event-location">📍 {event.locationName || 'TBA'}</p>
                {event.expectedAttendees && (
                  <p className="event-attendees">👥 {event.expectedAttendees} attendees</p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="no-results">No events found matching your criteria 😢</p>
        )}
      </div>
    </div>
  );
};

export default Events;