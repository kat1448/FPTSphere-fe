import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import eventService from "../services/EventService";
import "../assets/css/event-detail.css";
import { toast } from "react-toastify";
import { QRCodeCanvas } from "qrcode.react";

const EventDetailV2 = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  // QR Code state
  const [showQRModal, setShowQRModal] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);
  // Registration state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedSubEvent, setSelectedSubEvent] = useState(null);
  const [registeredSubEvents, setRegisteredSubEvents] = useState(new Set());
  const [registeringSubEventId, setRegisteringSubEventId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelingSubEvent, setCancelingSubEvent] = useState(null);
  // Filter state
  const [selectedDay, setSelectedDay] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadEventDetails();
    loadUserRegistrations();
  }, [id]);

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await eventService.getPublicEventById(id);
      setEvent(response);
    } catch (err) {
      console.error("❌ Error loading event:", err);
      setError(err.message || "Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  const loadUserRegistrations = async () => {
    try {
      const response = await eventService.getEventByMySelf(); // API lấy events đã đăng ký
      const registeredIds = new Set(response.map((item) => item.eventId));
      setRegisteredSubEvents(registeredIds);
    } catch (err) {
      console.error("Failed to load registrations:", err);
      setRegisteredSubEvents(new Set());
    }
  };

  const handleSubEventRegister = (subEvent) => {
    setSelectedSubEvent(subEvent);
    setShowRegisterModal(true);
  };

  const downloadQRCode = () => {
    const canvas = document.querySelector(".qr-code-container canvas");
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `QR-${registrationData.eventName.replace(/\s+/g, "-")}-${
        registrationData.attendanceId
      }.png`;
      link.href = url;
      link.click();
    }
  };

  // Track if registration was just successful, to show toast after closing QR modal
  const [pendingRegistrationToast, setPendingRegistrationToast] =
    useState(false);

  const confirmRegistration = async () => {
    if (!selectedSubEvent) return;

    try {
      setRegisteringSubEventId(selectedSubEvent.eventId);

      // GỌI API ĐĂNG KÝ
      const response = await eventService.registerEvent(
        selectedSubEvent.eventId
      );

      console.log("✅ Registration response:", response);

      const newRegistered = new Set(registeredSubEvents);
      newRegistered.add(selectedSubEvent.eventId);
      setRegisteredSubEvents(newRegistered);

      setRegistrationData({
        attendanceId: response.attendanceId,
        eventId: response.eventId,
        eventName: selectedSubEvent.eventName,
        startTime: selectedSubEvent.startTime,
        endTime: selectedSubEvent.endTime,
        locationName: selectedSubEvent.locationName,
      });

      setShowRegisterModal(false);
      setShowQRModal(true);
      setSelectedSubEvent(null);
      setPendingRegistrationToast(true); // Mark to show toast after closing QR modal
    } catch (err) {
      console.error("❌ Registration failed:", err);
      toast.error(
        `❌ Registration failed: ${err.message || "Please try again."}`
      );
    } finally {
      setRegisteringSubEventId(null);
    }
  };

  const handleCancelClick = (subEventId, subEventName) => {
    setCancelingSubEvent({ id: subEventId, name: subEventName });
    setShowCancelModal(true);
  };

  const confirmCancelRegistration = async () => {
    if (!cancelingSubEvent) return;

    try {
      setRegisteringSubEventId(cancelingSubEvent.id);
      const response = await eventService.cancelEventRegistration(
        cancelingSubEvent.id
      );
      console.log("✅ Cancellation response:", response);

      const newRegistered = new Set(registeredSubEvents);
      newRegistered.delete(cancelingSubEvent.id);
      setRegisteredSubEvents(newRegistered);

      toast.success(
        `Successfully cancelled registration for "${cancelingSubEvent.name}"`
      );
      setShowCancelModal(false);
      setCancelingSubEvent(null);
    } catch (err) {
      console.error("❌ Cancellation failed:", err);
      toast.error(
        "Cancellation failed: You have already checked in and cannot cancel your registration"
      );
    } finally {
      setRegisteringSubEventId(null);
    }
  };

  const isSubEventFull = (subEvent) => {
    if (!subEvent.expectedAttendees) return false;
    const currentCount = subEvent.currentAttendees || 0; // Lấy từ API
    return currentCount >= subEvent.expectedAttendees;
  };

  const getAvailableSlots = (subEvent) => {
    if (!subEvent.expectedAttendees) return null;
    const currentCount = subEvent.currentAttendees || 0; // Lấy từ API
    const available = subEvent.expectedAttendees - currentCount;
    return Math.max(0, available);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Get unique days from sub-events
  const getEventDays = () => {
    if (!event?.subEvents) return [];

    const days = [
      ...new Set(
        event.subEvents.map((se) => new Date(se.startTime).toDateString())
      ),
    ];

    return days.sort((a, b) => new Date(a) - new Date(b));
  };

  // Filter sub-events
  const getFilteredSubEvents = () => {
    if (!event?.subEvents) return [];

    let filtered = event.subEvents;

    // Filter by day
    if (selectedDay !== "all") {
      filtered = filtered.filter(
        (se) => new Date(se.startTime).toDateString() === selectedDay
      );
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (se) =>
          se.eventName.toLowerCase().includes(term) ||
          se.description?.toLowerCase().includes(term) ||
          se.locationName?.toLowerCase().includes(term)
      );
    }

    // Sort by start time
    return filtered.sort(
      (a, b) => new Date(a.startTime) - new Date(b.startTime)
    );
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied! 📋");
  };

  // Get sub-event image (could be from backend or use placeholder)
  const getSubEventImage = (subEvent) => {
    // TODO: Get from subEvent.bannerUrl when available
    const images = [
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678",
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2",
      "https://images.unsplash.com/photo-1591115765373-5207764f72e7",
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1",
    ];

    const index = subEvent.eventId % images.length;
    return `${images[index]}?auto=format&fit=crop&w=800&q=80`;
  };

  if (loading) {
    return (
      <div className="event-detail-v2">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading event... ✨</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="event-detail-v2">
        <div className="error-container">
          <h2>😢 Event Not Found</h2>
          <p>{error || "This event may have been removed."}</p>
          <button onClick={() => navigate("/events")} className="btn-back">
            ← Back to Events
          </button>
        </div>
      </div>
    );
  }

  const filteredSubEvents = getFilteredSubEvents();
  const eventDays = getEventDays();
  const totalSessions = event.subEvents?.length || 0;
  const registeredCount = registeredSubEvents.size;

  return (
    <div className="event-detail-v2">
      {/* Back Button */}
      <button onClick={() => navigate("/events")} className="back-link-v2">
        ← Back to Events
      </button>

      {/* Hero Section - Main Event */}
      <div className="hero-section-v2">
        <div
          className="hero-banner-v2"
          style={{
            backgroundImage: `url(${
              event.bannerUrl ||
              "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1920&q=80"
            })`,
          }}
        >
          <div className="hero-overlay-v2">
            <div className="hero-content-v2">
              <span className="hero-label">Main Event</span>
              <h1>{event.eventName}</h1>
              <div className="hero-meta">
                <span>📅 {formatDate(event.startTime)}</span>
                <span>•</span>
                <span>📍 {event.locationName}</span>
                {totalSessions > 0 && (
                  <>
                    <span>•</span>
                    <span>🎯 {totalSessions} Sessions Available</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Event Description */}
        {event.description && (
          <div className="hero-description">
            <p>{event.description}</p>
            <button
              onClick={() => setShowShareModal(true)}
              className="btn-share-inline"
            >
              📤 Share Event
            </button>
          </div>
        )}
      </div>

      {/* Registration Summary Banner */}
      {totalSessions > 0 && (
        <div className="registration-banner-v2">
          <div className="registration-info">
            <h3>📝 Your Registration Status</h3>
            <p>
              You've registered for <strong>{registeredCount}</strong> out of{" "}
              <strong>{totalSessions}</strong> sessions
            </p>
            <div className="progress-bar-v2">
              <div
                className="progress-fill-v2"
                style={{ width: `${(registeredCount / totalSessions) * 100}%` }}
              ></div>
            </div>
          </div>
          {registeredCount === 0 && (
            <div className="registration-prompt">
              <p>
                👇 Browse sessions below and register for what interests you!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sessions Section */}
      {event.subEvents && event.subEvents.length > 0 && (
        <div className="sessions-section-v2">
          <div className="sessions-header-v2">
            <div className="header-title">
              <h2>🎯 Conference Sessions</h2>
              <p>
                All sessions are independent - pick what you want to attend!
              </p>
            </div>

            {/* Filters & Search */}
            <div className="sessions-filters-v2">
              <div className="search-box-v2">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input-v2"
                />
              </div>

              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="filter-select-v2"
              >
                <option value="all">All Days ({totalSessions})</option>
                {eventDays.map((day, idx) => {
                  const count = event.subEvents.filter(
                    (se) => new Date(se.startTime).toDateString() === day
                  ).length;
                  return (
                    <option key={day} value={day}>
                      Day {idx + 1} - {formatDateShort(day)} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Session Cards Grid */}
          <div className="sessions-grid-v2">
            {filteredSubEvents.length === 0 ? (
              <div className="no-results-v2">
                <h3>😔 No sessions found</h3>
                <p>Try adjusting your filters or search term</p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedDay("all");
                  }}
                  className="btn-reset-filters"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredSubEvents.map((subEvent) => {
                const isRegistered = registeredSubEvents.has(subEvent.eventId);
                const isFull = isSubEventFull(subEvent);
                const availableSlots = getAvailableSlots(subEvent);
                const isRegistering =
                  registeringSubEventId === subEvent.eventId;

                return (
                  <div
                    key={subEvent.eventId}
                    className={`session-card-v2 ${
                      isRegistered ? "registered" : ""
                    } ${isFull ? "full" : ""}`}
                  >
                    {/* Card Image */}
                    <div
                      className="session-card-image-v2"
                      style={{
                        backgroundImage: `url(${getSubEventImage(subEvent)})`,
                      }}
                    >
                      <div className="session-card-overlay-v2">
                        {isRegistered && (
                          <div className="registered-badge-v2">
                            ✅ Registered
                          </div>
                        )}
                        {isFull && !isRegistered && (
                          <div className="full-badge-v2">🚫 Full</div>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="session-card-content-v2">
                      <div className="session-card-header-v2">
                        <span className="session-day-badge-v2">
                          📅 {formatDateShort(subEvent.startTime)}
                        </span>
                        <span className="session-time-badge-v2">
                          🕐 {formatTime(subEvent.startTime)} -{" "}
                          {formatTime(subEvent.endTime)}
                        </span>
                      </div>

                      <h3 className="session-card-title-v2">
                        {subEvent.eventName}
                      </h3>

                      {subEvent.description && (
                        <p className="session-card-description-v2">
                          {subEvent.description.length > 120
                            ? `${subEvent.description.substring(0, 120)}...`
                            : subEvent.description}
                        </p>
                      )}

                      <div className="session-card-meta-v2">
                        {subEvent.locationName && (
                          <div className="meta-item-v2">
                            <span className="meta-icon">📍</span>
                            <span>{subEvent.locationName}</span>
                            {subEvent.building &&
                              ` - Campus ${subEvent.building}`}
                            {subEvent.roomNumber &&
                              ` - Room ${subEvent.roomNumber}`}
                          </div>
                        )}

                        {subEvent.expectedAttendees && (
                          <div className="meta-item-v2">
                            <span className="meta-icon">👥</span>
                            <span>{subEvent.expectedAttendees} capacity</span>
                          </div>
                        )}

                        {availableSlots !== null && (
                          <div
                            className={`meta-item-v2 ${
                              availableSlots < 10 ? "warning" : ""
                            }`}
                          >
                            <span className="meta-icon">
                              {availableSlots > 0 ? "✅" : "⚠️"}
                            </span>
                            <span>
                              {availableSlots > 0
                                ? `${availableSlots} slots left`
                                : "Full"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* CTA Button */}
                      <div className="session-card-actions-v2">
                        {isRegistered ? (
                          <button
                            onClick={() =>
                              handleCancelClick(
                                subEvent.eventId,
                                subEvent.eventName
                              )
                            }
                            className="btn-cancel-v2"
                            disabled={isRegistering}
                          >
                            {isRegistering
                              ? "⏳ Processing..."
                              : "❌ Cancel Registration"}
                          </button>
                        ) : isFull ? (
                          <button className="btn-full-v2" disabled>
                            🚫 Session Full
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSubEventRegister(subEvent)}
                            className="btn-register-v2"
                            disabled={isRegistering}
                          >
                            {isRegistering
                              ? "⏳ Processing..."
                              : "🎟️ Register for This Session"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* No Sessions Message */}
      {(!event.subEvents || event.subEvents.length === 0) && (
        <div className="no-sessions-v2">
          <h3>📅 No Sessions Yet</h3>
          <p>Session schedule will be announced soon!</p>
        </div>
      )}

      {/* Registration Confirmation Modal */}
      {showRegisterModal && selectedSubEvent && (
        <div
          className="modal-overlay-v2"
          onClick={() => setShowRegisterModal(false)}
        >
          <div
            className="modal-content-v2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-v2">
              <h3>🎟️ Confirm Registration</h3>
              <button
                className="modal-close-v2"
                onClick={() => setShowRegisterModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body-v2">
              <p className="modal-subtitle-v2">You're about to register for:</p>

              <div className="registration-details-v2">
                <h4>{selectedSubEvent.eventName}</h4>
                <div className="detail-item-v2">
                  <span className="detail-icon-v2">📅</span>
                  <span>{formatDate(selectedSubEvent.startTime)}</span>
                </div>
                <div className="detail-item-v2">
                  <span className="detail-icon-v2">🕐</span>
                  <span>
                    {formatTime(selectedSubEvent.startTime)} -{" "}
                    {formatTime(selectedSubEvent.endTime)}
                  </span>
                </div>
                {selectedSubEvent.locationName && (
                  <div className="detail-item-v2">
                    <span className="detail-icon-v2">📍</span>
                    <span>{selectedSubEvent.locationName}</span>
                  </div>
                )}
              </div>

              <div className="modal-actions-v2">
                <button
                  onClick={confirmRegistration}
                  className="btn-confirm-v2"
                >
                  ✅ Confirm Registration
                </button>
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="btn-cancel-modal-v2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && cancelingSubEvent && (
        <div
          className="modal-overlay-v2"
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="modal-content-v2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-v2">
              <h3>⚠️ Cancel Registration</h3>
              <button
                className="modal-close-v2"
                onClick={() => setShowCancelModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body-v2">
              <p className="modal-subtitle-v2">
                Are you sure you want to cancel your registration for:
              </p>

              <div className="registration-details-v2">
                <h4>{cancelingSubEvent.name}</h4>
              </div>

              <p
                style={{
                  color: "#ef4444",
                  fontSize: "14px",
                  marginTop: "16px",
                }}
              >
                ⚠️ Note: If you've already checked in, you cannot cancel your
                registration.
              </p>

              <div className="modal-actions-v2">
                <button
                  onClick={confirmCancelRegistration}
                  className="btn-confirm-v2"
                  style={{ backgroundColor: "#ef4444" }}
                >
                  ✅ Yes, Cancel Registration
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="btn-cancel-modal-v2"
                >
                  No, Keep Registration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div
          className="modal-overlay-v2"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="modal-content-v2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-v2">
              <h3>📤 Share Event</h3>
              <button
                className="modal-close-v2"
                onClick={() => setShowShareModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body-v2">
              <p>Share "{event.eventName}" with others!</p>

              <div className="copy-link-section-v2">
                <input
                  type="text"
                  value={window.location.href}
                  readOnly
                  className="link-input-v2"
                />
                <button onClick={copyLink} className="btn-copy-v2">
                  📋 Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && registrationData && (
        <div className="modal-overlay-v2" onClick={() => setShowQRModal(false)}>
          <div
            className="modal-content-v2 qr-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-v2">
              <h3>🎉 Registration Successful!</h3>
              <button
                className="modal-close-v2"
                onClick={() => setShowQRModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body-v2 qr-modal-body">
              <div className="qr-success-message">
                <div className="success-icon">✅</div>
                <h4>You're registered for:</h4>
                <p className="event-name-large">{registrationData.eventName}</p>
              </div>

              {/* QR CODE */}
              <div className="qr-code-container">
                <QRCodeCanvas
                  value={JSON.stringify({
                    attendanceId: registrationData.attendanceId,
                    eventId: registrationData.eventId,
                    action: "checkin",
                    timestamp: new Date().toISOString(),
                  })}
                  size={280}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
              <div className="qr-actions">
                <button
                  onClick={() => downloadQRCode()}
                  className="btn-download-qr"
                >
                  💾 Download QR Code
                </button>
                <button
                  onClick={() => {
                    setShowQRModal(false);
                    if (pendingRegistrationToast) {
                      toast.success("Success! You are now registered");
                      setPendingRegistrationToast(false);
                    }
                  }}
                  className="btn-done-qr"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailV2;
