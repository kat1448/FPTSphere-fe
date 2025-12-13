    // src/pages/EventManager/CreateEventWizard/steps/Step1MainEvent.jsx
    import React, { useEffect, useState } from "react";
    import apiClient from "../../../../services/api.js";
    import eventService from "../../../../services/EventService.js";

    import { WizardSS } from "../wizardStorage";

    export default function Step1MainEvent({ onNext }) {
    const [form, setForm] = useState({
        eventName: "",
        description: "",
        expectedAttendees: "",
        startTime: "",
        endTime: "",
        estimatedCost: "",
        hasSubEvents: true,
    });

    const [locationMode, setLocationMode] = useState("internal"); // internal|external
    const [locationId, setLocationId] = useState(null);
    const [externalLocationName, setExternalLocationName] = useState("");
    const [externalLocationAddress, setExternalLocationAddress] = useState("");

    const [availableRooms, setAvailableRooms] = useState([]);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [err, setErr] = useState(null);
    const [saving, setSaving] = useState(false);

    // Load draft nếu có
    useEffect(() => {
        const draft = WizardSS.get("mainEventDraft", null);
        if (draft) {
        setForm(draft.form || form);
        setLocationMode(draft.locationMode || "internal");
        setLocationId(draft.locationId || null);
        setExternalLocationName(draft.externalLocationName || "");
        setExternalLocationAddress(draft.externalLocationAddress || "");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    const saveDraft = () => {
        WizardSS.set("mainEventDraft", {
        form,
        locationMode,
        locationId,
        externalLocationName,
        externalLocationAddress,
        savedAt: new Date().toISOString(),
        });
        setErr(null);
        alert("Đã lưu draft (Step 1) ✔");
    };

    const next = async () => {
        setErr(null);

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

        try {
        setSaving(true);

        // 1) Create main event (backend)
        const payload = {
            eventName: form.eventName,
            description: form.description,
            startTime: form.startTime,
            endTime: form.endTime,
            expectedAttendees: form.expectedAttendees ? Number(form.expectedAttendees) : null,
            estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : null,
            locationId: locationMode === "internal" ? locationId : null,
            externalLocation: locationMode === "external"
            ? { name: externalLocationName, address: externalLocationAddress }
            : null,
        };

        const created = await eventService.createEvent(payload);

        // 2) Save “mainEvent” giống đúng flow HTML review
        const mainEventSS = {
            name: form.eventName,
            description: form.description,
            expected: form.expectedAttendees ? Number(form.expectedAttendees) : 0,
            start: new Date(form.startTime).toISOString(),
            end: new Date(form.endTime).toISOString(),
            estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : 0,
            locationMode,
            locationId: locationMode === "internal" ? locationId : null,
            externalLocationName: locationMode === "external" ? externalLocationName : "",
            externalLocationAddress: locationMode === "external" ? externalLocationAddress : "",
            eventId: created?.eventId ?? created?.data?.eventId ?? null,
            hasSubEvents: !!form.hasSubEvents,
        };

        WizardSS.set("mainEvent", mainEventSS);

        // Clear draft step1 (optional)
        WizardSS.remove("mainEventDraft");

        onNext(); // sang Step 2
        } catch (e) {
        setErr(e?.response?.data?.message || e.message || "Tạo sự kiện thất bại.");
        } finally {
        setSaving(false);
        }
    };

    return (
        <div className="cew-card">
        <div className="cew-grid">
            <div className="cew-field" style={{ gridColumn: "1 / -1" }}>
            <label>Event Name</label>
            <input
                className="cew-input"
                placeholder="e.g., FPT TechFest 2025"
                value={form.eventName}
                onChange={(e) => set("eventName", e.target.value)}
            />
            </div>

            <div className="cew-field" style={{ gridColumn: "1 / -1" }}>
            <label>Description</label>
            <textarea
                className="cew-textarea"
                placeholder="Overall purpose, target audience, and outcomes..."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
            />
            </div>

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

            <div className="cew-field">
            <label>Start Date & Time</label>
            <input
                className="cew-input"
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => set("startTime", e.target.value)}
            />
            </div>

            <div className="cew-field">
            <label>End Date & Time</label>
            <input
                className="cew-input"
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => set("endTime", e.target.value)}
            />
            </div>

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
                {form.estimatedCost
                ? Number(form.estimatedCost).toLocaleString("vi-VN") + " ₫"
                : "—"}
            </div>
            </div>

            <div className="cew-row" style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 900 }}>
                <input
                type="checkbox"
                checked={form.hasSubEvents}
                onChange={(e) => set("hasSubEvents", e.target.checked)}
                style={{ width: 18, height: 18, accentColor: "#f97316" }}
                />
                This event has Sub-Events
            </label>
            </div>

            {/* Location (tuỳ bạn: nếu step1 chỉ muốn chọn location thì giữ, còn muốn tách location sang step khác thì bỏ khối này) */}
            <div className="cew-field" style={{ gridColumn: "1 / -1" }}>
            <label>Location</label>
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
                    <span className="cew-note">Chọn room cho Main Event</span>
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
                    placeholder="External location name"
                    value={externalLocationName}
                    onChange={(e) => setExternalLocationName(e.target.value)}
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

        <div className="cew-actions">
            <button type="button" className="cew-btn cew-btn-ghost" onClick={saveDraft}>
            Save Draft
            </button>
            <button type="button" className="cew-btn cew-btn-primary" onClick={next} disabled={saving}>
            {saving ? "Saving..." : "Next → Sub-Events"}
            </button>
        </div>
        </div>
    );
    }
