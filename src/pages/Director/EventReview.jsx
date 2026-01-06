import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import directorService from "../../services/directorService";
import "../../assets/css/event-review.css";


const EventReview = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();

  const [event, setEvent] = useState(null);
  const [subEvents, setSubEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [approveComment, setApproveComment] = useState("");
  const [processing, setProcessing] = useState(false);

  // Fetch event data on mount
  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch main event
      const eventData = await directorService.getEventById(eventId);
      if (!eventData) {
        setError("Event not found");
        return;
      }
      setEvent(eventData);

      // Fetch sub-events
      const subEventsData = await directorService.getSubEvents(eventId);
      setSubEvents(subEventsData || []);
    } catch (err) {
      console.error("❌ Error loading event:", err);
      setError("Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  // Handle approve
  const handleApprove = async () => {
    try {
      setProcessing(true);
      await directorService.approveEvent(eventId, approveComment);
      toast.success("Event approved successfully!");
      setShowApproveModal(false);
      navigate("/director/events/approvals");
    } catch (err) {
      console.error("❌ Error approving event:", err);
      toast.error("Failed to approve event. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!rejectComment.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      setProcessing(true);
      await directorService.rejectEvent(eventId, rejectComment);
      toast.success("Event rejected successfully!");
      setShowRejectModal(false);
      navigate("/director/events/approvals");
    } catch (err) {
      console.error("❌ Error rejecting event:", err);
      toast.error("Failed to reject event. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format date and time
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "Not specified";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Calculate event duration
  const calculateDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ${diffHours} hour${diffHours !== 1 ? "s" : ""}`;
    }
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""}`;
  };

  if (loading) {
    return (
      <div className="event-review">
        <div className="er-loading">
          <span>⏳</span>
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-review">
        <div className="er-error">
          <span>⚠️</span>
          <h3>{error}</h3>
          <button onClick={() => navigate("/director/events/approvals")}>
            ← Back to Pending Approvals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="event-review">
      {/* Page Header */}
      <div className="er-header">
        <button
          className="er-back-btn"
          onClick={() => navigate("/director/events/approvals")}
        >
          ← Back to Pending Approvals
        </button>
        <h1>Review Event</h1>
      </div>

      {/* Main Content */}
      <div className="er-content">
        {/* Event Details Card */}
        <div className="er-card er-main-card">
          <div className="er-card-header">
            <div className="er-event-title">
              <h2>{event.eventName}</h2>
              <span className="er-status-badge pending">Pending Approval</span>
            </div>
          </div>

          <div className="er-card-body">
            {/* Event Description */}
            {event.description && (
              <div className="er-section">
                <h3>📝 Description</h3>
                <p className="er-description">{event.description}</p>
              </div>
            )}

            {/* Event Details Grid */}
            <div className="er-details-grid">
              <div className="er-detail-item">
                <span className="er-detail-label">📅 Start Date</span>
                <span className="er-detail-value">{formatDateTime(event.startTime)}</span>
              </div>

              <div className="er-detail-item">
                <span className="er-detail-label">📅 End Date</span>
                <span className="er-detail-value">{formatDateTime(event.endTime)}</span>
              </div>

              <div className="er-detail-item">
                <span className="er-detail-label">⏱️ Duration</span>
                <span className="er-detail-value">
                  {calculateDuration(event.startTime, event.endTime)}
                </span>
              </div>

              <div className="er-detail-item">
                <span className="er-detail-label">📍 Location</span>
                <span className="er-detail-value">
                  {event.locationName || event.externalLocationName || "Not specified"}
                </span>
              </div>

              <div className="er-detail-item">
                <span className="er-detail-label">👥 Expected Attendees</span>
                <span className="er-detail-value">
                  {event.expectedAttendees || "Not specified"}
                </span>
              </div>

              <div className="er-detail-item">
                <span className="er-detail-label">💰 Estimated Budget</span>
                <span className="er-detail-value">
                  {formatCurrency(event.estimatedCost)}
                </span>
              </div>

              <div className="er-detail-item">
                <span className="er-detail-label">👤 Created By</span>
                <span className="er-detail-value">
                  {event.createdByName || "Unknown"}
                </span>
              </div>

              <div className="er-detail-item">
                <span className="er-detail-label">📆 Submitted Date</span>
                <span className="er-detail-value">
                  {formatDate(event.updatedAt || event.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Events Card */}
        <div className="er-card">
          <div className="er-card-header">
            <h3>📁 Sub-Events ({subEvents.length})</h3>
          </div>

          <div className="er-card-body">
            {subEvents.length === 0 ? (
              <div className="er-empty-subs">
                <p>No sub-events for this event</p>
              </div>
            ) : (
              <div className="er-subevents-list">
                {subEvents.map((subEvent, index) => (
                  <div key={subEvent.eventId || index} className="er-subevent-card">
                    <div className="er-subevent-header">
                      <span className="er-subevent-number">#{index + 1}</span>
                      <h4>{subEvent.eventName}</h4>
                    </div>

                    <div className="er-subevent-details">
                      <div className="er-subevent-row">
                        <span>📅</span>
                        <span>{formatDateTime(subEvent.startTime)}</span>
                        <span>→</span>
                        <span>{formatDateTime(subEvent.endTime)}</span>
                      </div>

                      <div className="er-subevent-row">
                        <span>📍</span>
                        <span>
                          {subEvent.locationName || subEvent.externalLocationName || "TBA"}
                        </span>
                      </div>

                      {subEvent.description && (
                        <div className="er-subevent-desc">
                          {subEvent.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="er-actions">
          <button
            className="er-btn er-btn-reject"
            onClick={() => setShowRejectModal(true)}
          >
            ✕ Reject Event
          </button>
          <button
            className="er-btn er-btn-approve"
            onClick={() => setShowApproveModal(true)}
          >
            ✓ Approve Event
          </button>
        </div>

        {/* Info Note */}
        <div className="er-info-note">
          <span>ℹ️</span>
          <p>
            Approving or rejecting this event will also update all {subEvents.length} sub-events
            to the same status.
          </p>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="er-modal-overlay" onClick={() => setShowApproveModal(false)}>
          <div className="er-modal" onClick={(e) => e.stopPropagation()}>
            <div className="er-modal-header">
              <h3>✓ Approve Event</h3>
              <button
                className="er-modal-close"
                onClick={() => setShowApproveModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="er-modal-body">
              <p className="er-modal-message">
                Are you sure you want to approve <strong>{event.eventName}</strong>?
              </p>
              <p className="er-modal-submessage">
                This will approve the main event and all {subEvents.length} sub-events.
              </p>

              <div className="er-modal-field">
                <label>Comment (optional):</label>
                <textarea
                  value={approveComment}
                  onChange={(e) => setApproveComment(e.target.value)}
                  placeholder="Add an optional comment..."
                  rows={3}
                />
              </div>
            </div>

            <div className="er-modal-footer">
              <button
                className="er-btn er-btn-secondary"
                onClick={() => setShowApproveModal(false)}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                className="er-btn er-btn-approve"
                onClick={handleApprove}
                disabled={processing}
              >
                {processing ? "Approving..." : "Confirm Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="er-modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="er-modal" onClick={(e) => e.stopPropagation()}>
            <div className="er-modal-header er-modal-header-reject">
              <h3>✕ Reject Event</h3>
              <button
                className="er-modal-close"
                onClick={() => setShowRejectModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="er-modal-body">
              <p className="er-modal-message">
                Are you sure you want to reject <strong>{event.eventName}</strong>?
              </p>
              <p className="er-modal-submessage">
                This will reject the main event and all {subEvents.length} sub-events.
              </p>

              <div className="er-modal-field">
                <label>Reason for rejection <span className="required">*</span>:</label>
                <textarea
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows={4}
                  required
                />
                {!rejectComment.trim() && (
                  <span className="er-field-error">A reason is required for rejection</span>
                )}
              </div>
            </div>

            <div className="er-modal-footer">
              <button
                className="er-btn er-btn-secondary"
                onClick={() => setShowRejectModal(false)}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                className="er-btn er-btn-reject"
                onClick={handleReject}
                disabled={processing || !rejectComment.trim()}
              >
                {processing ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventReview;