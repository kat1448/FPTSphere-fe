// src/pages/EventManager/CreateEventWizard/steps/Step2SubEvents.jsx
import React, { useEffect, useState } from "react";
import apiClient from "../../../../services/api.js";
import { WizardSS } from "../wizardStorage";
import "../../../../assets/css/Step1MainEvent.css";

export default function Step2SubEvents({ onPrev, onNext }) {
  const [mainEvent, setMainEvent] = useState(null);
  const [subEvents, setSubEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const [form, setForm] = useState({
    eventName: "",
    description: "",
    startTime: "",
    endTime: "",
    bannerUrl: "",
  });

  // Banner upload states
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Location states
  const [locationMode, setLocationMode] = useState("internal");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [externalLocationName, setExternalLocationName] = useState("");
  const [externalLocationAddress, setExternalLocationAddress] = useState("");
  
  // Location modal states
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [err, setErr] = useState(null);
  const [saving, setSaving] = useState(false);

  // Cloudinary config
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // ==========================================
  // INIT
  // ==========================================
  useEffect(() => {
    const me = WizardSS.get("mainEvent", null);
    if (!me) {
      alert("Không tìm thấy Main Event. Vui lòng quay lại Step 1.");
      onPrev();
      return;
    }
    setMainEvent(me);

    const subs = WizardSS.get("subEvents", []);
    setSubEvents(subs);
  }, [onPrev]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // Convert datetime-local to ISO
  const toISO = (dtLocal) => {
    if (!dtLocal) return null;
    const d = new Date(dtLocal);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  };

  // Filter rooms by search
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

  // ==========================================
  // BANNER UPLOAD
  // ==========================================
  const hasCloudinaryConfig = () => {
    return !!(cloudName && uploadPreset);
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "fptsphere/sub-events");

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Cloudinary upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Cloudinary upload successful:", data.secure_url);
      return data.secure_url;
    } catch (error) {
      console.error("❌ Cloudinary upload error:", error);
      throw error;
    }
  };

  const uploadToBackend = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post("/upload/banner", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      return response.data.data.url;
    } catch (error) {
      console.error("❌ Backend upload failed:", error);
      throw error;
    }
  };

  const uploadBanner = async (file) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      let bannerUrl;

      if (hasCloudinaryConfig()) {
        console.log("📤 Uploading to Cloudinary...");
        bannerUrl = await uploadToCloudinary(file);
        setUploadProgress(100);
      } else {
        console.warn("⚠️ Cloudinary not configured, using backend upload");
        bannerUrl = await uploadToBackend(file);
      }

      return bannerUrl;
    } catch (error) {
      console.error("❌ Upload failed:", error);
      console.warn("⚠️ Using placeholder image");
      return "https://via.placeholder.com/1200x400?text=Sub+Event+Banner";
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErr("Vui lòng chọn file ảnh!");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErr("File quá lớn! Vui lòng chọn ảnh nhỏ hơn 10MB.");
      return;
    }

    setBannerFile(file);
    setErr(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // ==========================================
  // LOCATION MODAL
  // ==========================================
  const openLocationModal = async () => {
    setErr(null);

    if (!form.startTime || !form.endTime) {
      setErr("Vui lòng chọn Start/End trước khi chọn phòng.");
      return;
    }

    const startISO = toISO(form.startTime);
    const endISO = toISO(form.endTime);
    if (!startISO || !endISO) {
      setErr("Start/End không hợp lệ");
      return;
    }

    setShowLocationModal(true);
    setLoadingRooms(true);

    try {
      // Lấy tất cả phòng available (đã loại bỏ xung đột với Main Event)
      const res = await apiClient.get("/locations/available", {
        params: { startTime: startISO, endTime: endISO },
      });

      if (!res.data?.success) {
        setErr(res.data?.message || "Không tải được phòng khả dụng.");
        setLoadingRooms(false);
        return;
      }

      let availableRoomsList = res.data.data || [];

      // ✅ KIỂM TRA XUNG ĐỘT VỚI SUB-EVENTS KHÁC
      // Chỉ loại bỏ phòng nếu trùng với sub-event khác (không tính sub-event đang edit)
      const otherSubEvents = subEvents.filter((_, idx) => idx !== editingIndex);
      
      availableRoomsList = availableRoomsList.filter((room) => {
        // Chỉ kiểm tra internal locations
        if (!room.locationId) return true;

        // Kiểm tra xem phòng này có bị sub-event khác chiếm không?
        const isConflict = otherSubEvents.some((subEvent) => {
          // Chỉ kiểm tra nếu sub-event đó dùng internal location
          if (subEvent.locationMode !== "internal" || !subEvent.selectedLocation) {
            return false;
          }

          // Nếu không cùng phòng → không xung đột
          if (subEvent.selectedLocation.locationId !== room.locationId) {
            return false;
          }

          // Cùng phòng → kiểm tra thời gian
          const subStart = new Date(subEvent.startTime);
          const subEnd = new Date(subEvent.endTime);
          const currentStart = new Date(form.startTime);
          const currentEnd = new Date(form.endTime);

          // Formula: (startA < endB) AND (endA > startB)
          const hasTimeConflict = currentStart < subEnd && currentEnd > subStart;

          return hasTimeConflict;
        });

        // Chỉ giữ lại phòng không xung đột
        return !isConflict;
      });

      setAvailableRooms(availableRoomsList);
      setFilteredRooms(availableRoomsList);

      if (availableRoomsList.length === 0) {
        setErr("⚠️ Không có phòng nào khả dụng trong khoảng thời gian này (các sub-event khác đã chiếm hết phòng).");
      }
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Không tải được phòng khả dụng.");
    } finally {
      setLoadingRooms(false);
    }
  };

  const selectLocation = (loc) => {
    setSelectedLocation(loc);
    setShowLocationModal(false);
    setSearchTerm("");
  };

  // ==========================================
  // MODAL OPEN/CLOSE
  // ==========================================
  const openModal = (index = null) => {
    if (index !== null) {
      // Edit mode
      const sub = subEvents[index];
      setForm({
        eventName: sub.eventName,
        description: sub.description,
        startTime: sub.startTime,
        endTime: sub.endTime,
        bannerUrl: sub.bannerUrl || "",
      });
      setLocationMode(sub.locationMode || "internal");
      setSelectedLocation(sub.selectedLocation || null);
      setExternalLocationName(sub.externalLocationName || "");
      setExternalLocationAddress(sub.externalLocationAddress || "");
      setBannerPreview(sub.bannerUrl || "");
      setBannerFile(null);
      setEditingIndex(index);
    } else {
      // Add new mode
      setForm({ 
        eventName: "", 
        description: "", 
        startTime: "", 
        endTime: "", 
        bannerUrl: "" 
      });
      setLocationMode("internal");
      setSelectedLocation(null);
      setExternalLocationName("");
      setExternalLocationAddress("");
      setBannerFile(null);
      setBannerPreview("");
      setEditingIndex(null);
    }
    setShowModal(true);
    setErr(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingIndex(null);
    setErr(null);
    setBannerFile(null);
    setBannerPreview("");
    setUploadProgress(0);
    setSearchTerm("");
  };

  // ==========================================
  // VALIDATION
  // ==========================================
  const validateSubEvent = () => {
    if (!form.eventName?.trim()) {
      setErr("❌ Vui lòng nhập tên Sub-Event!");
      return false;
    }

    if (!form.startTime || !form.endTime) {
      setErr("❌ Vui lòng chọn đầy đủ Start Time và End Time!");
      return false;
    }

    if (!mainEvent) {
      setErr("❌ Main Event không tồn tại!");
      return false;
    }

    const subStart = new Date(form.startTime);
    const subEnd = new Date(form.endTime);
    const mainStart = new Date(mainEvent.start);
    const mainEnd = new Date(mainEvent.end);

    if (subStart >= subEnd) {
      setErr("❌ Start Time phải nhỏ hơn End Time!");
      return false;
    }

    if (subStart < mainStart) {
      setErr(
        `❌ Sub-event không thể bắt đầu trước Main Event!\n` +
        `Main Event bắt đầu: ${mainStart.toLocaleString('vi-VN')}`
      );
      return false;
    }

    if (subEnd > mainEnd) {
      setErr(
        `❌ Sub-event không thể kết thúc sau Main Event!\n` +
        `Main Event kết thúc: ${mainEnd.toLocaleString('vi-VN')}`
      );
      return false;
    }

    if (locationMode === "internal" && !selectedLocation) {
      setErr("❌ Vui lòng chọn phòng (Internal) hoặc chuyển sang External!");
      return false;
    }

    if (locationMode === "external" && !externalLocationName.trim()) {
      setErr("❌ Vui lòng nhập tên địa điểm bên ngoài!");
      return false;
    }

    // ✅ KIỂM TRA XUNG ĐỘT PHÒNG VỚI SUB-EVENTS KHÁC
    if (locationMode === "internal" && selectedLocation) {
      const otherSubEvents = subEvents.filter((_, idx) => idx !== editingIndex);
      
      const conflictingSub = otherSubEvents.find((subEvent) => {
        if (subEvent.locationMode !== "internal" || !subEvent.selectedLocation) {
          return false;
        }

        if (subEvent.selectedLocation.locationId !== selectedLocation.locationId) {
          return false;
        }

        const otherStart = new Date(subEvent.startTime);
        const otherEnd = new Date(subEvent.endTime);
        const currentStart = new Date(form.startTime);
        const currentEnd = new Date(form.endTime);

        return currentStart < otherEnd && currentEnd > otherStart;
      });

      if (conflictingSub) {
        setErr(
          `❌ Phòng "${selectedLocation.name}" đã được sử dụng bởi sub-event "${conflictingSub.eventName}"!\n` +
          `Thời gian: ${new Date(conflictingSub.startTime).toLocaleString('vi-VN')} → ${new Date(conflictingSub.endTime).toLocaleString('vi-VN')}\n\n` +
          `Vui lòng chọn phòng khác hoặc thay đổi thời gian.`
        );
        return false;
      }
    }

    return true;
  };

  // ==========================================
  // SAVE SUB-EVENT
  // ==========================================
  const saveSubEvent = async () => {
    if (!validateSubEvent()) return;

    try {
      setSaving(true);
      setErr(null);

      // Step 1: Upload banner if has new file
      let finalBannerUrl = form.bannerUrl || "";
      if (bannerFile) {
        console.log("📤 Uploading banner...");
        finalBannerUrl = await uploadBanner(bannerFile);
        console.log("✅ Banner uploaded:", finalBannerUrl);
      }

      // Step 2: Create external location if needed
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
        if (!extRes.data?.success || !extId) {
          throw new Error("Không tạo được external location");
        }
        externalLocationId = extId;
      }

      // Step 3: Prepare payload
      const payload = {
        eventName: form.eventName,
        description: form.description || "",
        bannerUrl: finalBannerUrl || null,
        startTime: toISO(form.startTime),
        endTime: toISO(form.endTime),
        locationId: locationMode === "internal" ? selectedLocation?.locationId : null,
        externalLocationId,
      };

      console.log("📤 Creating sub-event with payload:", payload);
      console.log("📤 Main Event ID:", mainEvent.eventId);

      // Step 4: Call API
      const res = await apiClient.post(`/events/${mainEvent.eventId}/subevents`, payload);
      
      console.log("✅ API Response:", res.data);

      if (!res.data?.success) {
        setErr(res.data?.message || "Tạo sub-event thất bại.");
        return;
      }

      const createdSubEvent = res.data.data;
      console.log("✅ Sub-event created:", createdSubEvent);

      // Step 5: Save to sessionStorage
      const subEventData = {
        eventId: createdSubEvent.eventId,
        eventName: form.eventName,
        description: form.description,
        bannerUrl: finalBannerUrl,
        startTime: form.startTime,
        endTime: form.endTime,
        locationMode,
        selectedLocation: locationMode === "internal" ? selectedLocation : null,
        externalLocationName: locationMode === "external" ? externalLocationName : "",
        externalLocationAddress: locationMode === "external" ? externalLocationAddress : "",
      };

      let updatedSubEvents;
      if (editingIndex !== null) {
        updatedSubEvents = [...subEvents];
        updatedSubEvents[editingIndex] = subEventData;
      } else {
        updatedSubEvents = [...subEvents, subEventData];
      }

      setSubEvents(updatedSubEvents);
      WizardSS.set("subEvents", updatedSubEvents);

      closeModal();

    } catch (e) {
      console.error("❌ Error saving sub-event:", e);
      
      const errorMessage = e.response?.data?.message 
        || e.response?.data?.errors?.join(", ")
        || e.message 
        || "Lỗi không xác định khi tạo sub-event";

      setErr(`❌ ${errorMessage}`);
      
      if (e.response) {
        console.error("❌ API Error Details:", {
          status: e.response.status,
          statusText: e.response.statusText,
          data: e.response.data,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DELETE SUB-EVENT
  // ==========================================
  const deleteSubEvent = async (index) => {
    if (!window.confirm("Xóa sub-event này?")) return;

    try {
      const sub = subEvents[index];
      if (sub.eventId) {
        await apiClient.delete(`/events/subevents/${sub.eventId}`);
      }

      const updated = subEvents.filter((_, i) => i !== index);
      setSubEvents(updated);
      WizardSS.set("subEvents", updated);
    } catch (e) {
      alert(e?.response?.data?.message || "Xóa sub-event thất bại.");
    }
  };

  const skipSubEvents = () => {
    if (mainEvent?.hasSubEvents && subEvents.length === 0) {
      if (!window.confirm("Bạn chưa tạo sub-event nào. Tiếp tục?")) return;
    }
    onNext();
  };

  if (!mainEvent) return null;

  return (
    <div className="cew-card">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#0f172a" }}>
          Sub-Events for: {mainEvent.name}
        </h2>
        <div className="cew-note" style={{ marginTop: 8 }}>
          📅 Main Event: {new Date(mainEvent.start).toLocaleString('vi-VN')} → {new Date(mainEvent.end).toLocaleString('vi-VN')}
        </div>
        <div className="cew-note" style={{ marginTop: 4, color: "#f97316", fontWeight: 500 }}>
          ⚠️ Tất cả Sub-Events phải nằm trong khoảng thời gian trên
        </div>
        <div className="cew-note" style={{ marginTop: 4, color: "#0891b2", fontWeight: 500 }}>
          ℹ️ Sub-events có thể dùng chung phòng với Main Event nhưng không được trùng phòng với nhau
        </div>
      </div>

      {/* List Sub-Events */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Sub-Events ({subEvents.length})</h3>
          <button
            type="button"
            className="cew-btn cew-btn-primary"
            onClick={() => openModal()}
            style={{ padding: "8px 14px", fontSize: 12 }}
          >
            + Add Sub-Event
          </button>
        </div>

        {subEvents.length === 0 ? (
          <div
            className="cew-note"
            style={{ textAlign: "center", padding: 30, background: "#f8fafc", borderRadius: 14 }}
          >
            Chưa có sub-event nào. Nhấn "Add Sub-Event" để tạo.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {subEvents.map((sub, idx) => (
              <div
                key={idx}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: 14,
                  display: "flex",
                  gap: 14,
                  alignItems: "start",
                }}
              >
                {sub.bannerUrl && (
                  <img
                    src={sub.bannerUrl}
                    alt={sub.eventName}
                    style={{
                      width: 100,
                      height: 60,
                      objectFit: "cover",
                      borderRadius: 8,
                      flexShrink: 0,
                    }}
                  />
                )}

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 6 }}>{sub.eventName}</div>
                  <div className="cew-note">{sub.description || "No description"}</div>
                  <div className="cew-note" style={{ marginTop: 6 }}>
                    📅 {new Date(sub.startTime).toLocaleString('vi-VN')} → {new Date(sub.endTime).toLocaleString('vi-VN')}
                  </div>
                  <div className="cew-note">
                    📍{" "}
                    {sub.locationMode === "internal"
                      ? sub.selectedLocation?.name || `Room ID ${sub.selectedLocation?.locationId}`
                      : sub.externalLocationName || "External location"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="cew-btn cew-btn-ghost"
                    onClick={() => openModal(idx)}
                    style={{ padding: "6px 12px", fontSize: 12 }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="cew-btn cew-btn-ghost"
                    onClick={() => deleteSubEvent(idx)}
                    style={{ padding: "6px 12px", fontSize: 12, color: "#dc2626" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="cew-actions">
        <button type="button" className="cew-btn cew-btn-ghost" onClick={onPrev}>
          ← Back to Main Event
        </button>
        <button type="button" className="cew-btn cew-btn-primary" onClick={skipSubEvents}>
          Next → Resources
        </button>
      </div>

      {/* Modal Add/Edit Sub-Event */}
      {showModal && (
        <div className="cew-modal-backdrop" onClick={closeModal}>
          <div className="cew-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>
                {editingIndex !== null ? "Edit Sub-Event" : "Add New Sub-Event"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: 24,
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                ×
              </button>
            </div>

            {/* Time Range Notice */}
            <div 
              style={{ 
                padding: 12, 
                background: "#fef3c7", 
                borderRadius: 8, 
                marginBottom: 16,
                border: "1px solid #fbbf24"
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 4, color: "#92400e" }}>
                ⏰ Giới hạn thời gian
              </div>
              <div className="cew-note" style={{ color: "#78350f" }}>
                Bắt đầu: {new Date(mainEvent.start).toLocaleString('vi-VN')}
              </div>
              <div className="cew-note" style={{ color: "#78350f" }}>
                Kết thúc: {new Date(mainEvent.end).toLocaleString('vi-VN')}
              </div>
            </div>

            <div className="cew-grid">
              {/* Event Name */}
              <div className="cew-field" style={{ gridColumn: "1 / -1" }}>
                <label>Sub-Event Name *</label>
                <input
                  className="cew-input"
                  placeholder="e.g., Opening Ceremony"
                  value={form.eventName}
                  onChange={(e) => set("eventName", e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="cew-field" style={{ gridColumn: "1 / -1" }}>
                <label>Description</label>
                <textarea
                  className="cew-textarea"
                  placeholder="Brief description..."
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={3}
                />
              </div>

              {/* Banner Upload */}
              <div className="cew-field" style={{ gridColumn: "1 / -1" }}>
                <label>Sub-Event Banner (Optional)</label>
                <div
                  className="cew-upload-box"
                  onClick={() => document.getElementById("subevent-banner-upload").click()}
                >
                  {bannerPreview ? (
                    <img
                      src={bannerPreview}
                      alt="Banner preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: 14,
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 40, marginBottom: 10 }}>📷</div>
                      <div style={{ fontWeight: 900, marginBottom: 6 }}>Click to upload banner</div>
                      <div className="cew-note">PNG, JPG, GIF up to 10MB</div>
                    </div>
                  )}
                </div>
                <input
                  id="subevent-banner-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleBannerChange}
                />
                {isUploading && (
                  <div style={{ marginTop: 10 }}>
                    <div
                      style={{
                        background: "#e5e7eb",
                        height: 8,
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          background: "linear-gradient(90deg, #f97316, #fb923c)",
                          height: "100%",
                          width: `${uploadProgress}%`,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                    <div className="cew-note" style={{ textAlign: "center", marginTop: 6 }}>
                      Uploading: {uploadProgress}%
                    </div>
                  </div>
                )}
              </div>

              {/* Start & End Time */}
              <div className="cew-field">
                <label>Start Date & Time *</label>
                <input
                  className="cew-input"
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) => set("startTime", e.target.value)}
                  min={mainEvent.start}
                  max={mainEvent.end}
                />
              </div>

              <div className="cew-field">
                <label>End Date & Time *</label>
                <input
                  className="cew-input"
                  type="datetime-local"
                  value={form.endTime}
                  onChange={(e) => set("endTime", e.target.value)}
                  min={form.startTime || mainEvent.start}
                  max={mainEvent.end}
                />
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
                      <button 
                        type="button" 
                        className="cew-btn cew-btn-primary" 
                        onClick={openLocationModal}
                      >
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

            {err && (
              <div className="cew-error" style={{ whiteSpace: "pre-line" }}>
                {err}
              </div>
            )}

            <div className="cew-actions" style={{ marginTop: 16 }}>
              <button type="button" className="cew-btn cew-btn-ghost" onClick={closeModal}>
                Cancel
              </button>
              <button
                type="button"
                className="cew-btn cew-btn-primary"
                onClick={saveSubEvent}
                disabled={saving || isUploading}
              >
                {saving ? "Saving..." : isUploading ? "Uploading..." : editingIndex !== null ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Selection Modal */}
      {showLocationModal && (
        <div className="cew-modal-backdrop" onClick={() => setShowLocationModal(false)}>
          <div className="cew-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 900 }}>
            <div className="modal-header">
              <h3 className="modal-title">Select Location</h3>
              <button 
                type="button" 
                onClick={() => setShowLocationModal(false)} 
                className="modal-close"
              >
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
              <div className="cew-note" style={{ marginTop: 8 }}>
                📅 Available for:{" "}
                {form.startTime && form.endTime
                  ? `${new Date(form.startTime).toLocaleString('vi-VN')} → ${new Date(form.endTime).toLocaleString('vi-VN')}`
                  : "N/A"}
              </div>
              <div className="cew-note" style={{ marginTop: 4, color: "#0891b2" }}>
                ℹ️ Danh sách này đã loại bỏ phòng bị trùng với sub-events khác
              </div>
            </div>

            {loadingRooms ? (
              <div className="loading">Loading available rooms...</div>
            ) : filteredRooms.length === 0 ? (
              <div className="empty">
                {searchTerm ? "No rooms match your search" : "No available rooms found"}
              </div>
            ) : (
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}