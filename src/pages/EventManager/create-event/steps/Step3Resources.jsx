import React, { useEffect, useState } from "react";
import apiClient from "../../../../services/api.js";
import { WizardSS } from "../wizardStorage";
import eventService from "../../../../services/EventService.js";

export default function Step3Resources({ onPrev, onNext }) {
  const [mainEvent, setMainEvent] = useState(null);
  const [subEvents, setSubEvents] = useState([]);
  const [selectedSubEventId, setSelectedSubEventId] = useState(null);

  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState({}); // { subEventId: [deviceIds] }

  const [loadingDevices, setLoadingDevices] = useState(false);
  const [err, setErr] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load data
  useEffect(() => {
    const me = WizardSS.get("mainEvent", null);
    const subs = WizardSS.get("subEvents", []);

    if (!me || !me.eventId) {
      setErr("Không tìm thấy Main Event. Vui lòng quay lại Step 1.");
      return;
    }

    setMainEvent(me);
    setSubEvents(subs);

    if (subs.length > 0) {
      setSelectedSubEventId(subs[0].subEventId);
    }

    // Load draft resources nếu có
    const draft = WizardSS.get("resourcesDraft", null);
    if (draft?.selectedDevices) {
      setSelectedDevices(draft.selectedDevices);
    }
  }, []);

  // Fetch devices
  const fetchDevices = async () => {
    setErr(null);
    try {
      setLoadingDevices(true);
      const res = await eventService.getResources();
      console.log(res);
      
      if (res) {
        setDevices(res.data || []);
      } else {
        setErr("Không tải được danh sách devices.");
      }
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e.message ||
          "Không tải được danh sách devices."
      );
    } finally {
      setLoadingDevices(false);
    }
  };

  // Load devices khi component mount
  useEffect(() => {
    fetchDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle device selection for current sub-event
  const toggleDevice = (deviceId) => {
    if (!selectedSubEventId) return;

    setSelectedDevices((prev) => {
      const currentDevices = prev[selectedSubEventId] || [];
      const isSelected = currentDevices.includes(deviceId);

      return {
        ...prev,
        [selectedSubEventId]: isSelected
          ? currentDevices.filter((id) => id !== deviceId)
          : [...currentDevices, deviceId],
      };
    });
  };

  // Check if device is selected for current sub-event
  const isDeviceSelected = (deviceId) => {
    if (!selectedSubEventId) return false;
    const currentDevices = selectedDevices[selectedSubEventId] || [];
    return currentDevices.includes(deviceId);
  };

  // Save resources to backend
  const saveResources = async () => {
    setErr(null);
    setSaving(true);

    try {
      // Loop through each sub-event and save resources
      for (const [subEventId, deviceIds] of Object.entries(selectedDevices)) {
        if (deviceIds.length === 0) continue;

        const payload = {
          deviceIds: deviceIds.map(Number),
        };

        await apiClient.post(
          `/events/${mainEvent.eventId}/sub-events/${subEventId}/resources`,
          payload
        );
      }

      alert("Đã lưu resources thành công! ✔");
    } catch (e) {
      setErr(
        e?.response?.data?.message || e.message || "Lưu resources thất bại."
      );
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = () => {
    WizardSS.set("resourcesDraft", {
      selectedDevices,
      savedAt: new Date().toISOString(),
    });
    alert("Đã lưu draft (Step 3) ✔");
  };

  const handleNext = async () => {
    // Save resources trước khi next
    await saveResources();

    if (!err) {
      WizardSS.set("resources", selectedDevices);
      WizardSS.remove("resourcesDraft");
      onNext();
    }
  };

  if (!mainEvent || subEvents.length === 0) {
    return (
      <div className="cew-card">
        <div className="cew-error">
          {!mainEvent
            ? "Không tìm thấy Main Event."
            : "Không có Sub-Event nào. Vui lòng quay lại Step 2."}
        </div>
        <div className="cew-actions">
          <button
            type="button"
            className="cew-btn cew-btn-ghost"
            onClick={onPrev}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  const selectedSubEvent = subEvents.find(
    (s) => s.subEventId === selectedSubEventId
  );

  return (
    <div className="cew-card">
      <h2 style={{ marginTop: 0 }}>Step 3: Resources (Devices)</h2>

      <div className="cew-note" style={{ marginBottom: 20 }}>
        Chọn devices cho từng Sub-Event
      </div>

      {/* Sub-Event Selector */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontWeight: 900, marginBottom: 10, display: "block" }}>
          Select Sub-Event to assign resources:
        </label>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: 10,
          }}
        >
          {subEvents.map((sub) => {
            const isSelected = selectedSubEventId === sub.subEventId;
            const deviceCount = (selectedDevices[sub.subEventId] || []).length;

            return (
              <button
                key={sub.subEventId}
                type="button"
                onClick={() => setSelectedSubEventId(sub.subEventId)}
                className="cew-btn cew-btn-ghost"
                style={{
                  textAlign: "left",
                  padding: 12,
                  borderColor: isSelected
                    ? "#f97316"
                    : "rgba(255,255,255,0.14)",
                  background: isSelected
                    ? "rgba(249,115,22,0.14)"
                    : "rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ fontWeight: 900 }}>{sub.eventName}</div>
                <div className="cew-note">
                  {new Date(sub.startTime).toLocaleString("vi-VN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div
                  className="cew-note"
                  style={{ color: "#f97316", marginTop: 5 }}
                >
                  {deviceCount} device{deviceCount !== 1 ? "s" : ""} assigned
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Sub-Event Info */}
      {selectedSubEvent && (
        <div
          className="cew-card"
          style={{
            padding: 15,
            background: "rgba(249,115,22,0.08)",
            marginBottom: 20,
            border: "1px solid rgba(249,115,22,0.3)",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 5 }}>
            Currently assigning to: {selectedSubEvent.eventName}
          </div>
          <div className="cew-note">
            📅 {new Date(selectedSubEvent.startTime).toLocaleString("vi-VN")} →{" "}
            {new Date(selectedSubEvent.endTime).toLocaleString("vi-VN")}
          </div>
        </div>
      )}

      {/* Devices List */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <h3 style={{ margin: 0 }}>
            Available Devices ({devices.length})
          </h3>
          {loadingDevices && <span className="cew-note">Loading...</span>}
        </div>

        {devices.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 10,
            }}
          >
            {devices.map((device) => {
              const isSelected = isDeviceSelected(device.deviceId);

              return (
                <button
                  key={device.deviceId}
                  type="button"
                  onClick={() => toggleDevice(device.deviceId)}
                  className="cew-btn cew-btn-ghost"
                  style={{
                    textAlign: "left",
                    padding: 15,
                    borderColor: isSelected
                      ? "#f97316"
                      : "rgba(255,255,255,0.14)",
                    background: isSelected
                      ? "rgba(249,115,22,0.14)"
                      : "rgba(255,255,255,0.06)",
                    position: "relative",
                  }}
                >
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        background: "#f97316",
                        borderRadius: "50%",
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                      }}
                    >
                      ✓
                    </div>
                  )}

                  <div style={{ fontWeight: 900, marginBottom: 5 }}>
                    {device.name}
                  </div>
                  <div className="cew-note" style={{ marginBottom: 5 }}>
                    {device.type || "Unknown Type"} • {device.category || "N/A"}
                  </div>
                  <div className="cew-note">
                    Status:{" "}
                    <span
                      style={{
                        color: device.isAvailable ? "#10b981" : "#ef4444",
                      }}
                    >
                      {device.isAvailable ? "Available" : "In Use"}
                    </span>
                  </div>
                  {device.quantity && (
                    <div className="cew-note">Qty: {device.quantity}</div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div
            className="cew-note"
            style={{ textAlign: "center", padding: 40 }}
          >
            {loadingDevices ? "Loading devices..." : "No devices available"}
          </div>
        )}
      </div>

      {/* Summary */}
      <div
        className="cew-card"
        style={{
          padding: 15,
          background: "rgba(255,255,255,0.04)",
          marginBottom: 20,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Resources Summary</h3>
        {subEvents.map((sub) => {
          const deviceIds = selectedDevices[sub.subEventId] || [];
          if (deviceIds.length === 0) return null;

          return (
            <div key={sub.subEventId} style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 900 }}>{sub.eventName}</div>
              <div className="cew-note">
                {deviceIds.length} device{deviceIds.length !== 1 ? "s" : ""}{" "}
                assigned
              </div>
            </div>
          );
        })}
        {Object.keys(selectedDevices).every(
          (key) => selectedDevices[key].length === 0
        ) && <div className="cew-note">No resources assigned yet</div>}
      </div>

      {err && <div className="cew-error">{err}</div>}

      <div className="cew-actions">
        <button
          type="button"
          className="cew-btn cew-btn-ghost"
          onClick={onPrev}
        >
          ← Back
        </button>
        <button
          type="button"
          className="cew-btn cew-btn-ghost"
          onClick={saveDraft}
        >
          Save Draft
        </button>
        <button
          type="button"
          className="cew-btn cew-btn-primary"
          onClick={handleNext}
          disabled={saving}
        >
          {saving ? "Saving..." : "Next → Tasks"}
        </button>
      </div>
    </div>
  );
}