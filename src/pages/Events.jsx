import React, { useState, useEffect } from "react";
import "../assets/css/events.css";

const Events = () => {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Newest");
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const events = [
    {
      id: 1,
      title: "FPT Hackathon 2025",
      date: "2025-12-10T09:00:00",
      location: "FPT University, Da Nang",
      category: "Technology",
      image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=900&q=60",
    },
    {
      id: 2,
      title: "F-Camp: Welcome Freshers 2025",
      date: "2025-10-25T08:00:00",
      location: "FPT University, Ho Chi Minh",
      category: "Community",
      image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=900&q=60",
    },
    {
      id: 3,
      title: "AI for Future Seminar",
      date: "2025-11-15T14:00:00",
      location: "FPT University, Hanoi",
      category: "Education",
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=900&q=60",
    },
  ];

  const categories = ["All", "Technology", "Community", "Education"];

  // Find upcoming event
  const upcomingEvent = events.reduce((soonest, e) => {
    const diff = new Date(e.date) - new Date();
    return diff > 0 && diff < (new Date(soonest.date) - new Date()) ? e : soonest;
  }, events[0]);

  // Countdown logic
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = new Date(upcomingEvent.date) - new Date();
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
  }, [upcomingEvent.date]);

  // Filtering + Sorting
  const filteredEvents = events
    .filter(
      (e) =>
        (filter === "All" || e.category === filter) &&
        (e.title.toLowerCase().includes(search.toLowerCase()) ||
          e.location.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sort === "Newest") return new Date(b.date) - new Date(a.date);
      else return new Date(a.date) - new Date(b.date);
    });

  return (
    <div className="events-page">
      {/* Banner */}
      <div className="events-banner">
        <h1>Discover Exciting Events</h1>
        <p>Explore what’s happening across FPTSphere — learn, connect, and grow.</p>
      </div>

      {/* Countdown Section */}
      <div className="countdown-section">
        <h2>⏳ Upcoming Event: <span>{upcomingEvent.title}</span></h2>
        <p className="countdown-location">📍 {upcomingEvent.location}</p>

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

      {/* Search & Filter */}
      <div className="events-controls">
        <input
          type="text"
          className="search-bar"
          placeholder="🔍 Search by name or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filters">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            {categories.map((cat) => (
              <option key={cat}>{cat}</option>
            ))}
          </select>
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
            <div key={event.id} className="event-card">
              <div className="event-image-container">
                <img src={event.image} alt={event.title} className="event-image" />
                <div className="event-overlay">
                  <button className="view-btn">View Details</button>
                </div>
              </div>
              <div className="event-content">
                <h3>{event.title}</h3>
                <p className="event-date">📅 {new Date(event.date).toDateString()}</p>
                <p className="event-location">📍 {event.location}</p>
                <p className="event-category">🏷️ {event.category}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="no-results">No events found 😢</p>
        )}
      </div>
    </div>
  );
};

export default Events;
