// src/pages/EventManager/CreateEventWizard/steps/Step1MainEvent.jsx
import React, { useEffect, useState } from "react";
import apiClient from "../../../../services/api.js";
import eventService from "../../../../services/EventService.js";
import { WizardSS } from "../wizardStorage";
import "../../../../assets/css/Step1MainEvent.css";

export default function Step1MainEvent({ onNext }) {
  const [form, setForm] = useState({
    eventName: "",
    description: "",
    expectedAttendees: "",
    startTime: "",
    endTime: "",
    estimatedCost: "",
    hasSubEvents: true,
    bannerFile: null,
    bannerPreview: null,
  });

  const [locationMode, setLocationMode] = useState("internal");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [externalLocationName, setExternalLocationName] = useState("");
  const [externalLocationAddress, setExternalLocationAddress] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [err, setErr] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // Convert datetime-local ("YYYY-MM-DDTHH:mm") -> ISO UTC string
  const toISO = (dtLocal) => {
    if (!dtLocal) return null;
    const d = new Date(dtLocal);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  };

  // Load draft
  useEffect(() => {
    const draft = WizardSS.get("mainEventDraft", null);
    if (draft) {
      setForm(draft.form || form);
      setLocationMode(draft.locationMode || "internal");
      setSelectedLocation(draft.selectedLocation || null);
      setExternalLocationName(draft.externalLocationName || "");
      setExternalLocationAddress(draft.externalLocationAddress || "");
    }
    // eslint-disable-next-line
  }, []);

  // Filter rooms
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRooms(availableRooms);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredRooms(
        availableRooms.filter(
          (r) =>
            r.name?.toLowerCase().includes(term) ||
            r.building?.toLowerCase().includes(term) ||
            r.roomNumber?.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, availableRooms]);

  // Banner
  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setErr("Vui lòng chọn file hình ảnh");
    if (file.size > 10 * 1024 * 1024) return setErr("File không được vượt quá 10MB");

    set("bannerFile", file);
    set("bannerPreview", URL.createObjectURL(file));
    setErr(null);
  };

  const removeBanner = () => {
    if (form.bannerPreview) URL.revokeObjectURL(form.bannerPreview);
    set("bannerFile", null);
    set("bannerPreview", null);
    setUploadProgress(0);
  };

  const uploadBanner = async () => {
    if (!form.bannerFile) return null;

    const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    // Fallback if no Cloudinary config
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      try {
        const formData = new FormData();
        formData.append("file", form.bannerFile);
        const res = await apiClient.post("/upload/banner", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data?.success && res.data?.data?.url) return res.data.data.url;
      } catch (e) {
        console.error("Backend upload failed:", e);
      }
      return "https://via.placeholder.com/1200x400?text=Event+Banner";
    }

    // Upload to Cloudinary
    const formData = new FormData();
    formData.append("file", form.bannerFile);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", "fptsphere/banners");

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      });

      xhr.addEventListener("load", () => {
        try {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            setUploadProgress(0);
            resolve(response.secure_url);
          } else {
            const parsed = JSON.parse(xhr.responseText);
            reject(new Error(parsed?.error?.message || "Upload failed"));
          }
        } catch {
          reject(new Error("Upload failed"));
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Network error")));

      xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);
      xhr.send(formData);
    });
  };

  // ✅ Location modal với conflict checking note
  const openLocationModal = async () => {
    setErr(null);

    if (!form.startTime || !form.endTime) return setErr("Vui lòng chọn Start/End trước");

    const startISO = toISO(form.startTime);
    const endISO = toISO(form.endTime);
    if (!startISO || !endISO) return setErr("Start/End không hợp lệ");

    setShowLocationModal(true);
    setLoadingRooms(true);

    try {
      const res = await apiClient.get("/locations/available", {
        params: { startTime: startISO, endTime: endISO },
      });

      if (res.data?.success) {
        const rooms = res.data.data || [];
        setAvailableRooms(rooms);
        setFilteredRooms(rooms);
        
        // ✅ Log để debug
        console.log(`✅ Found ${rooms.length} available rooms for ${form.startTime} - ${form.endTime}`);
      } else {
        setErr(res.data?.message || "Không tải được phòng");
      }
    } catch (e) {
      console.error("❌ Error loading available rooms:", e);
      setErr(e?.response?.data?.message || "Lỗi tải phòng");
    } finally {
      setLoadingRooms(false);
    }
  };

  const selectLocation = (loc) => {
    setSelectedLocation(loc);
    setShowLocationModal(false);
    setSearchTerm("");
  };

  // Save draft
  const saveDraft = () => {
    WizardSS.set("mainEventDraft", {
      form: { ...form, bannerFile: null, bannerPreview: null },
      locationMode,
      selectedLocation,
      externalLocationName,
      externalLocationAddress,
      savedAt: new Date().toISOString(),
    });
    alert("✅ Draft saved");
  };

  // ✅ Improved error handling cho submit
  const next = async () => {
    setErr(null);

    // Basic validate (FE)
    if (!form.eventName || !form.startTime || !form.endTime)
      return setErr("Vui lòng nhập Event Name và Start/End");

    const start = new Date(form.startTime);
    const end = new Date(form.endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()))
      return setErr("Start/End không hợp lệ");

    if (start >= end) return setErr("Start time phải trước End time");

    // Mirror BE rule: startTime cannot be in the past (tolerance 1 hour)
    if (start < new Date(Date.now() - 60 * 60 * 1000))
      return setErr("Start time không được ở quá khứ");

    if (locationMode === "internal" && !selectedLocation) return setErr("Vui lòng chọn phòng");
    if (locationMode === "external" && !externalLocationName.trim())
      return setErr("Vui lòng nhập tên địa điểm bên ngoài");

    // Mirror attendee rules + capacity
    if (form.expectedAttendees !== "" && form.expectedAttendees != null) {
      const expected = Number(form.expectedAttendees);
      if (!Number.isFinite(expected)) return setErr("Expected attendees không hợp lệ");
      if (expected <= 0) return setErr("Expected attendees phải > 0");

      if (
        locationMode === "internal" &&
        selectedLocation?.capacity != null &&
        Number.isFinite(Number(selectedLocation.capacity))
      ) {
        const cap = Number(selectedLocation.capacity);
        if (expected > cap)
          return setErr(`Expected attendees (${expected}) vượt quá capacity (${cap})`);
      }
    }

    try {
      setSaving(true);

      // 1) Create external location if needed
      let externalLocationId = null;
      if (locationMode === "external") {
        const extRes = await apiClient.post("/externallocations", {
          name: externalLocationName,
          address: externalLocationAddress || "N/A",
          contactPerson: null,
          contactPhone: null,
          cost: null,
          note: null,
        });

        const extId = extRes.data?.data?.externalLocationId ?? extRes.data?.data?.id ?? null;

        if (!extRes.data?.success || !extId) throw new Error("Không tạo được external location");

        externalLocationId = extId;
      }

      // 2) Upload banner
      let bannerUrl = null;
      if (form.bannerFile) {
        try {
          bannerUrl = await uploadBanner();
        } catch (uploadErr) {
          setErr(`Upload banner thất bại: ${uploadErr.message}`);
          setSaving(false);
          return;
        }
      }

      // 3) Create event
      const payload = {
        eventName: form.eventName,
        description: form.description || null,
        startTime: toISO(form.startTime),
        endTime: toISO(form.endTime),
        expectedAttendees: form.expectedAttendees ? Number(form.expectedAttendees) : null,
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : null,
        bannerUrl,
        locationId: locationMode === "internal" ? selectedLocation?.locationId : null,
        externalLocationId,
      };

      console.log("📤 Creating main event:", payload);

      const created = await eventService.createEvent(payload);

      console.log("✅ Main event created:", created);

      // 4) Save to sessionStorage
      const mainEventData = {
        name: form.eventName,
        description: form.description,
        expected: form.expectedAttendees ? Number(form.expectedAttendees) : 0,
        start: new Date(form.startTime).toISOString(),
        end: new Date(form.endTime).toISOString(),
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : 0,
        bannerUrl,
        locationMode,
        locationId: locationMode === "internal" ? selectedLocation?.locationId : null,
        locationName: locationMode === "internal" ? selectedLocation?.name : externalLocationName,
        externalLocationName: locationMode === "external" ? externalLocationName : "",
        externalLocationAddress: locationMode === "external" ? externalLocationAddress : "",
        eventId: created?.eventId ?? created?.data?.eventId ?? null,
        hasSubEvents: !!form.hasSubEvents,
      };

      WizardSS.set("mainEvent", mainEventData);
      WizardSS.set("subEvents", []);
      WizardSS.remove("mainEventDraft");

      onNext();
      
    } catch (e) {
      console.error("❌ Error creating main event:", e);
      
      // ✅ Enhanced error handling - extract conflict message
      let errorMessage = "Tạo sự kiện thất bại";
      
      if (e?.response?.data?.message) {
        errorMessage = e.response.data.message;
      } else if (e?.response?.data?.errors?.length > 0) {
        errorMessage = e.response.data.errors.join("\n");
      } else if (e.message) {
        errorMessage = e.message;
      }

      // ✅ Check if it's a location conflict error
      if (errorMessage.includes("đã được đặt") || errorMessage.includes("already booked")) {
        setErr(`❌ CONFLICT:\n${errorMessage}\n\nVui lòng chọn phòng khác hoặc thời gian khác.`);
      } else {
        setErr(errorMessage);
      }

      // ✅ Log chi tiết để debug
      if (e.response) {
        console.error("Response status:", e.response.status);
        console.error("Response data:", e.response.data);
      }
      
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cew-card">
      <div className="cew-grid">
        {/* Event Name */}
        <div className="cew-field" style={{ gridColumn: "1 / -1" }}>
          <label>Event Name *</label>
          <input
            className="cew-input"
            placeholder="e.g., FPT TechFest 2025"
            value={form.eventName}
            onChange={(e) => set("eventName", e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="cew-field" style={{ gridColumn: "1 / -1" }}>
          <label>Description</label>
          <textarea
            className="cew-textarea"
            placeholder="Purpose, audience, outcomes..."
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        {/* Banner */}
        <div className="cew-field" style={{ gridColumn: "1 / -1" }}>
          <label>Event Banner (Optional)</label>
          {!form.bannerPreview ? (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                style={{ display: "none" }}
                id="banner-upload"
              />
              <label htmlFor="banner-upload" className="cew-btn cew-btn-ghost banner-label">
                📸 Upload Banner Image
              </label>
              <div className="cew-note">Max 10MB • JPG, PNG, GIF, WebP</div>
            </div>
          ) : (
            <div className="banner-container">
              <img src={form.bannerPreview} alt="Banner" className="banner-img" />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="banner-progress">Uploading... {uploadProgress}%</div>
              )}
              <button
                type="button"
                onClick={removeBanner}
                disabled={uploadProgress > 0 && uploadProgress < 100}
                className="banner-remove"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Expected Attendees */}
        <div className="cew-field">
          <label>Expected Attendees</label>
          <input
            className="cew-input"
            type="number"
            placeholder="e.g., 500"
            value={form.expectedAttendees}
            onChange={(e) => set("expectedAttendees", e.target.value)}
          />
        </div>

        {/* Start/End Time */}
        <div className="cew-field">
          <label>Start Date & Time *</label>
          <input
            className="cew-input"
            type="datetime-local"
            value={form.startTime}
            onChange={(e) => set("startTime", e.target.value)}
          />
        </div>
        <div className="cew-field">
          <label>End Date & Time *</label>
          <input
            className="cew-input"
            type="datetime-local"
            value={form.endTime}
            onChange={(e) => set("endTime", e.target.value)}
          />
        </div>

        {/* Estimated Cost */}
        <div className="cew-field" style={{ gridColumn: "1 / -1" }}>
          <label>Estimated Cost (VND)</label>
          <input
            className="cew-input"
            type="number"
            placeholder="e.g., 10000000"
            value={form.estimatedCost}
            onChange={(e) => set("estimatedCost", e.target.value)}
          />
          <div className="cew-note">
            Formatted:{" "}
            {form.estimatedCost ? Number(form.estimatedCost).toLocaleString("vi-VN") + " ₫" : "—"}
          </div>
        </div>

        {/* Has Sub-Events */}
        <div className="cew-row" style={{ gridColumn: "1 / -1" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 900 }}>
            <input
              type="checkbox"
              checked={form.hasSubEvents}
              onChange={(e) => set("hasSubEvents", e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "#111827" }}
            />
            This event has Sub-Events
          </label>
        </div>

        {/* Location Mode */}
        <div className="cew-field" style={{ gridColumn: "1 / -1" }}>
          <label>Location *</label>
          <div className="cew-row">
            <button
              type="button"
              className={`cew-btn cew-btn-ghost ${locationMode === "internal" ? "mode-active" : ""}`}
              onClick={() => setLocationMode("internal")}
            >
              🏢 Internal
            </button>
            <button
              type="button"
              className={`cew-btn cew-btn-ghost ${locationMode === "external" ? "mode-active" : ""}`}
              onClick={() => setLocationMode("external")}
            >
              🌍 External
            </button>
          </div>

          {locationMode === "internal" ? (
            <div className="mt-10">
              {!selectedLocation ? (
                <button type="button" className="cew-btn cew-btn-primary" onClick={openLocationModal}>
                  + Add Location
                </button>
              ) : (
                <div className="location-card">
                  <div>
                    <div className="location-name">{selectedLocation.name}</div>
                    <div className="cew-note">
                      {selectedLocation.building} • {selectedLocation.roomNumber} • Capacity:{" "}
                      {selectedLocation.capacity ?? "N/A"}
                    </div>
                  </div>
                  <div className="location-actions">
                    <button
                      type="button"
                      className="cew-btn cew-btn-ghost"
                      onClick={openLocationModal}
                      style={{ padding: "6px 12px", fontSize: 12 }}
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      className="cew-btn cew-btn-ghost"
                      onClick={() => setSelectedLocation(null)}
                      style={{ padding: "6px 12px", fontSize: 12, color: "#dc2626" }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-10">
              <input
                className="cew-input"
                placeholder="External location name *"
                value={externalLocationName}
                onChange={(e) => setExternalLocationName(e.target.value)}
              />
              <div style={{ height: 10 }} />
              <textarea
                className="cew-textarea"
                placeholder="External address (optional)"
                value={externalLocationAddress}
                onChange={(e) => setExternalLocationAddress(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* ✅ Enhanced error display with multi-line support */}
      {err && (
        <div className="cew-error" style={{ whiteSpace: "pre-line" }}>
          <strong>⚠️ Error:</strong> {err}
        </div>
      )}

      <div className="cew-actions">
        <button type="button" className="cew-btn cew-btn-ghost" onClick={saveDraft}>
          💾 Save Draft
        </button>
        <button type="button" className="cew-btn cew-btn-primary" onClick={next} disabled={saving}>
          {saving ? (
            <>
              <span>⏳</span> {uploadProgress > 0 ? `Uploading ${uploadProgress}%...` : "Saving..."}
            </>
          ) : (
            "Next → Sub-Events"
          )}
        </button>
      </div>

      {/* ✅ Location Modal with conflict checking info */}
      {showLocationModal && (
        <div className="cew-modal-backdrop" onClick={() => setShowLocationModal(false)}>
          <div className="cew-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 900 }}>
            <div className="modal-header">
              <h3 className="modal-title">Select Location</h3>
              <button type="button" onClick={() => setShowLocationModal(false)} className="modal-close">
                ×
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div className="cew-field">
                <label>Search by name, building, or room number</label>
                <input
                  className="cew-input"
                  placeholder="e.g., Hall A, Alpha, 201..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* ✅ Conflict checking info */}
              <div style={{ 
                marginTop: 12, 
                padding: 12, 
                backgroundColor: "#f0f9ff", 
                border: "1px solid #3b82f6",
                borderRadius: 6,
                fontSize: 13,
                color: "#1e40af"
              }}>
                <strong>ℹ️ Conflict Checking:</strong> Only rooms available during your selected time are shown. 
                Rooms already booked by other events (Draft, Pending, Approved, In Progress) are excluded.
              </div>

              <div className="cew-note" style={{ marginTop: 8 }}>
                📅 Available for:{" "}
                {form.startTime && form.endTime
                  ? `${new Date(form.startTime).toLocaleString("vi-VN")} → ${new Date(form.endTime).toLocaleString("vi-VN")}`
                  : "N/A"}
              </div>
            </div>

            {loadingRooms ? (
              <div className="loading">🔍 Checking room availability...</div>
            ) : filteredRooms.length === 0 ? (
              <div className="empty">
                {searchTerm 
                  ? "❌ No rooms match your search" 
                  : "❌ No available rooms found for this time period. All rooms are booked."}
              </div>
            ) : (
              <>
                <div className="cew-note" style={{ marginBottom: 12, color: "#059669" }}>
                  ✅ Found {filteredRooms.length} available room{filteredRooms.length !== 1 ? 's' : ''}
                </div>
                <div className="rooms-grid">
                  {filteredRooms.map((room) => (
                    <button
                      key={room.locationId}
                      type="button"
                      onClick={() => selectLocation(room)}
                      className={`cew-btn cew-btn-ghost room-card ${
                        selectedLocation?.locationId === room.locationId ? "selected" : ""
                      }`}
                    >
                      {room.imageUrl ? (
                        <img
                          src={room.imageUrl}
                          alt={room.name}
                          className="room-img"
                          onError={(e) => (e.target.style.display = "none")}
                        />
                      ) : (
                        <div className="room-placeholder">🏛️</div>
                      )}
                      <div className="room-info">
                        <div className="room-name">{room.name}</div>
                        <div className="cew-note">
                          {room.building} • {room.roomNumber}
                        </div>
                        <div className="cew-note">Capacity: {room.capacity ?? "N/A"}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}