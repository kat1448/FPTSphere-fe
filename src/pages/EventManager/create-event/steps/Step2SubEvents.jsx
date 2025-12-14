import React, { useEffect, useState } from "react";
import apiClient from "../../../../services/api.js";
import eventService from "../../../../services/EventService.js";
import { WizardSS } from "../wizardStorage";

export default function Step2SubEvents({ onPrev, onNext }) {
  const [mainEvent, setMainEvent] = useState(null);
  const [subEvents, setSubEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  const [form, setForm] = useState({
    eventName: "",
    description: "",
    startTime: "",
    endTime: "",
    bannerUrl: "",
  });

  const [locationMode, setLocationMode] = useState("internal");
  const [locationId, setLocationId] = useState(null);
  const [externalLocationId, setExternalLocationId] = useState(null);
  const [externalLocationName, setExternalLocationName] = useState("");
  const [externalLocationAddress, setExternalLocationAddress] = useState("");

  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [err, setErr] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  // Load main event và sub-events draft
  useEffect(() => {
    const me = WizardSS.get("mainEvent", null);
    if (!me || !me.eventId) {
      setErr("Không tìm thấy Main Event. Vui lòng quay lại Step 1.");
      return;
    }
    setMainEvent(me);

    // Load draft sub-events nếu có
    const draft = WizardSS.get("subEventsDraft", null);
    if (draft?.subEvents) {
      setSubEvents(draft.subEvents);
    }
  }, []);

  const resetForm = () => {
    setForm({
      eventName: "",
      description: "",
      startTime: "",
      endTime: "",
      bannerUrl: "",
    });
    setLocationMode("internal");
    setLocationId(null);
    setExternalLocationId(null);
    setExternalLocationName("");
    setExternalLocationAddress("");
    setEditingIndex(null);
  };

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const fetchRooms = async () => {
    setErr(null);
    if (!form.startTime || !form.endTime) {
      setErr("Vui lòng chọn Start/End trước khi lọc phòng.");
      return;
    }
    try {
      setLoadingRooms(true);
      const res = await apiClient.get("/locations/available", {
        params: { startTime: form.startTime, endTime: form.endTime },
      });
      if (res.data?.success) setAvailableRooms(res.data.data || []);
      else setErr(res.data?.message || "Không tải được phòng khả dụng.");
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Không tải được phòng khả dụng.");
    } finally {
      setLoadingRooms(false);
    }
  };

  const createExternalLocation = async () => {
    if (locationMode !== "external") return null;
    
    try {
      const res = await apiClient.post("/locations/external", {
        name: externalLocationName.trim(),
        address: externalLocationAddress.trim(),
      });
      
      if (res.data?.success && res.data?.data?.externalLocationId) {
        return res.data.data.externalLocationId;
      }
      throw new Error(res.data?.message || "Không thể tạo external location");
    } catch (e) {
      throw new Error(e?.response?.data?.message || e.message || "Tạo external location thất bại");
    }
  };

  const handleAddOrUpdateSubEvent = async () => {
    setErr(null);

    // Validation
    if (!form.eventName || !form.startTime || !form.endTime) {
      setErr("Vui lòng nhập Event Name và Start/End.");
      return;
    }

    if (locationMode === "internal" && !locationId) {
      setErr("Vui lòng chọn phòng (Internal) hoặc chuyển sang External.");
      return;
    }

    if (locationMode === "external" && !externalLocationName.trim()) {
      setErr("Vui lòng nhập tên địa điểm bên ngoài.");
      return;
    }

    // Kiểm tra thời gian sub-event phải nằm trong main event
    const subStart = new Date(form.startTime);
    const subEnd = new Date(form.endTime);
    const mainStart = new Date(mainEvent.start);
    const mainEnd = new Date(mainEvent.end);

    if (subStart < mainStart || subEnd > mainEnd) {
      setErr("Sub-event phải nằm trong khoảng thời gian của Main Event.");
      return;
    }

    try {
      setSaving(true);

      let finalExternalLocationId = externalLocationId;

      // Nếu là external location và chưa có ID, tạo mới
      if (locationMode === "external" && !finalExternalLocationId) {
        finalExternalLocationId = await createExternalLocation();
      }

      // Build payload theo CreateSubEventDto
      const payload = {
        eventName: form.eventName.trim(),
        description: form.description?.trim() || null,
        bannerUrl: form.bannerUrl?.trim() || null,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        locationId: locationMode === "internal" ? locationId : null,
        externalLocationId: locationMode === "external" ? finalExternalLocationId : null,
      };

      if (editingIndex !== null) {
        // Update existing sub-event
        const subEventId = subEvents[editingIndex].subEventId;
        await eventService.updateSubEvent(mainEvent.eventId, subEventId, payload);
        
        const updated = [...subEvents];
        updated[editingIndex] = {
          ...payload,
          subEventId,
          locationMode,
          externalLocationName: locationMode === "external" ? externalLocationName : "",
          externalLocationAddress: locationMode === "external" ? externalLocationAddress : "",
        };
        setSubEvents(updated);
      } else {
        // Create new sub-event
        const created = await eventService.createSubEvent(mainEvent.eventId, payload);
        
        const newSubEvent = {
          ...payload,
          subEventId: created?.subEventId ?? created?.data?.subEventId ?? created?.id ?? null,
          locationMode,
          externalLocationName: locationMode === "external" ? externalLocationName : "",
          externalLocationAddress: locationMode === "external" ? externalLocationAddress : "",
        };
        
        setSubEvents([...subEvents, newSubEvent]);
      }

      // Reset form và ẩn
      resetForm();
      setShowForm(false);
      setErr(null);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Tạo/cập nhật sub-event thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubEvent = (index) => {
    const sub = subEvents[index];
    setForm({
      eventName: sub.eventName,
      description: sub.description || "",
      startTime: sub.startTime ? new Date(sub.startTime).toISOString().slice(0, 16) : "",
      endTime: sub.endTime ? new Date(sub.endTime).toISOString().slice(0, 16) : "",
      bannerUrl: sub.bannerUrl || "",
    });
    setLocationMode(sub.locationMode || "internal");
    setLocationId(sub.locationId || null);
    setExternalLocationId(sub.externalLocationId || null);
    setExternalLocationName(sub.externalLocationName || "");
    setExternalLocationAddress(sub.externalLocationAddress || "");
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleDeleteSubEvent = async (index) => {
    if (!window.confirm("Bạn có chắc muốn xóa sub-event này?")) return;

    try {
      const subEventId = subEvents[index].subEventId;
      if (subEventId) {
        await eventService.deleteSubEvent(mainEvent.eventId, subEventId);
      }
      
      const updated = subEvents.filter((_, i) => i !== index);
      setSubEvents(updated);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Xóa sub-event thất bại.");
    }
  };

  const saveDraft = () => {
    WizardSS.set("subEventsDraft", {
      subEvents,
      savedAt: new Date().toISOString(),
    });
    alert("Đã lưu draft (Step 2) ✔");
  };

  const handleNext = () => {
    // Lưu sub-events vào storage
    WizardSS.set("subEvents", subEvents);
    WizardSS.remove("subEventsDraft");
    onNext();
  };

  if (!mainEvent) {
    return (
      <div className="cew-card">
        <div className="cew-error">Không tìm thấy Main Event. Vui lòng quay lại Step 1.</div>
        <div className="cew-actions">
          <button type="button" className="cew-btn cew-btn-ghost" onClick={onPrev}>
            ← Back to Step 1
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cew-card">
      <h2 style={{ marginTop: 0 }}>Step 2: Sub-Events</h2>
      
      <div className="cew-note" style={{ marginBottom: 20 }}>
        Main Event: <strong>{mainEvent.name}</strong>
        <br />
        Duration: {new Date(mainEvent.start).toLocaleString("vi-VN")} → {new Date(mainEvent.end).toLocaleString("vi-VN")}
      </div>

      {/* Danh sách sub-events */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>Sub-Events ({subEvents.length})</h3>
          {!showForm && (
            <button
              type="button"
              className="cew-btn cew-btn-primary"
              onClick={() => setShowForm(true)}
            >
              + Add Sub-Event
            </button>
          )}
        </div>

        {subEvents.length > 0 ? (
          <div style={{ display: "grid", gap: 10 }}>
            {subEvents.map((sub, idx) => (
              <div
                key={idx}
                className="cew-card"
                style={{
                  padding: 15,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 5 }}>
                      {sub.eventName}
                    </div>
                    <div className="cew-note" style={{ marginBottom: 5 }}>
                      {sub.description || "No description"}
                    </div>
                    <div className="cew-note">
                      📅 {new Date(sub.startTime).toLocaleString("vi-VN")} → {new Date(sub.endTime).toLocaleString("vi-VN")}
                    </div>
                    <div className="cew-note">
                      📍 {sub.locationMode === "internal" ? `Internal (ID: ${sub.locationId})` : `External: ${sub.externalLocationName}`}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      type="button"
                      className="cew-btn cew-btn-ghost"
                      onClick={() => handleEditSubEvent(idx)}
                      style={{ padding: "5px 10px" }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      type="button"
                      className="cew-btn cew-btn-ghost"
                      onClick={() => handleDeleteSubEvent(idx)}
                      style={{ padding: "5px 10px", borderColor: "#ef4444" }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="cew-note" style={{ textAlign: "center", padding: 20 }}>
            Chưa có sub-event nào. Nhấn "Add Sub-Event" để thêm.
          </div>
        )}
      </div>

      {/* Form thêm/sửa sub-event */}
      {showForm && (
        <div className="cew-card" style={{ background: "white", padding: 20, marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>
            {editingIndex !== null ? "Edit Sub-Event" : "Add New Sub-Event"}
          </h3>

          <div className="cew-grid">
            <div className="cew-field" style={{ gridColumn: "1 / -1" }}>
              <label>Event Name *</label>
              <input
                className="cew-input"
                placeholder="e.g., Opening Ceremony"
                value={form.eventName}
                onChange={(e) => set("eventName", e.target.value)}
                maxLength={255}
              />
            </div>

            <div className="cew-field" style={{ gridColumn: "1 / -1" }}>
              <label>Description</label>
              <textarea
                className="cew-textarea"
                placeholder="Sub-event details..."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                maxLength={4000}
              />
            </div>

            <div className="cew-field" style={{ gridColumn: "1 / -1" }}>
              <label>Banner URL</label>
              <input
                className="cew-input"
                type="url"
                placeholder="https://example.com/banner.jpg"
                value={form.bannerUrl}
                onChange={(e) => set("bannerUrl", e.target.value)}
                maxLength={255}
              />
            </div>

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

            <div className="cew-field" style={{ gridColumn: "1 / -1" }}>
              <label>Location *</label>
              <div className="cew-row">
                <button
                  type="button"
                  className={`cew-btn cew-btn-ghost`}
                  onClick={() => setLocationMode("internal")}
                  style={{ borderColor: locationMode === "internal" ? "#f97316" : "rgba(255,255,255,0.14)" }}
                >
                  Internal
                </button>
                <button
                  type="button"
                  className={`cew-btn cew-btn-ghost`}
                  onClick={() => setLocationMode("external")}
                  style={{ borderColor: locationMode === "external" ? "#f97316" : "rgba(255,255,255,0.14)" }}
                >
                  External
                </button>
              </div>

              {locationMode === "internal" ? (
                <div style={{ marginTop: 10 }}>
                  <div className="cew-row">
                    <button type="button" className="cew-btn cew-btn-ghost" onClick={fetchRooms}>
                      {loadingRooms ? "Loading rooms..." : "Find available rooms"}
                    </button>
                  </div>

                  <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                    {availableRooms.map((r) => {
                      const selected = locationId === r.locationId;
                      return (
                        <button
                          key={r.locationId}
                          type="button"
                          onClick={() => setLocationId(r.locationId)}
                          className="cew-btn cew-btn-ghost"
                          style={{
                            textAlign: "left",
                            padding: 12,
                            borderColor: selected ? "#f97316" : "rgba(255,255,255,0.14)",
                            background: selected ? "rgba(249,115,22,0.14)" : "rgba(255,255,255,0.06)",
                          }}
                        >
                          <div style={{ fontWeight: 900 }}>{r.name}</div>
                          <div className="cew-note">{r.building} • {r.roomNumber} • cap {r.capacity ?? "?"}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 10 }}>
                  <input
                    className="cew-input"
                    placeholder="External location name *"
                    value={externalLocationName}
                    onChange={(e) => setExternalLocationName(e.target.value)}
                    maxLength={255}
                  />
                  <div style={{ height: 10 }} />
                  <textarea
                    className="cew-textarea"
                    placeholder="External address"
                    value={externalLocationAddress}
                    onChange={(e) => setExternalLocationAddress(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {err && <div className="cew-error">{err}</div>}

          <div className="cew-actions" style={{ marginTop: 15 }}>
            <button
              type="button"
              className="cew-btn cew-btn-ghost"
              onClick={() => {
                resetForm();
                setShowForm(false);
                setErr(null);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="cew-btn cew-btn-primary"
              onClick={handleAddOrUpdateSubEvent}
              disabled={saving}
            >
              {saving ? "Saving..." : editingIndex !== null ? "Update Sub-Event" : "Add Sub-Event"}
            </button>
          </div>
        </div>
      )}

      <div className="cew-actions">
        <button type="button" className="cew-btn cew-btn-ghost" onClick={onPrev}>
          ← Back
        </button>
        <button type="button" className="cew-btn cew-btn-ghost" onClick={saveDraft}>
          Save Draft
        </button>
        <button type="button" className="cew-btn cew-btn-primary" onClick={handleNext}>
          Next → Resources
        </button>
      </div>
    </div>
  );
}