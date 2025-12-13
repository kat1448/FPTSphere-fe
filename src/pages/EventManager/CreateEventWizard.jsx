import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import eventService from "../../services/EventService";
import apiClient from "../../services/api";
import "../../assets/css/manager-dashboard.css";

/** ========= helpers: storage ========= */
const SS = {
  get(key, fallback) {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    sessionStorage.removeItem(key);
  },
};

const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? `id_${Date.now()}_${Math.random()}`);

const toISO = (v) => (v ? new Date(v).toISOString() : null);

/** ========= data normalizers ========= */
function mapMainEventToStorage({ mainEvent, locationMode, locationId, externalLocationName, externalLocationAddress, displayName }) {
  return {
    name: mainEvent.eventName?.trim() || "",
    description: mainEvent.description?.trim() || "",
    expected: mainEvent.expectedAttendees ? Number(mainEvent.expectedAttendees) : 0,
    start: mainEvent.startTime ? new Date(mainEvent.startTime).toISOString() : null,
    end: mainEvent.endTime ? new Date(mainEvent.endTime).toISOString() : null,
    estimatedCost: mainEvent.estimatedCost ? Number(mainEvent.estimatedCost) : 0,
    manager: displayName,
    locationMode,
    locationId: locationMode === "internal" ? locationId : null,
    externalLocationName: locationMode === "external" ? externalLocationName : "",
    externalLocationAddress: locationMode === "external" ? externalLocationAddress : "",
  };
}

function withinMain(main, startISO, endISO) {
  if (!main?.start || !main?.end) return true;
  const ms = new Date(main.start).getTime();
  const me = new Date(main.end).getTime();
  const s = new Date(startISO).getTime();
  const e = new Date(endISO).getTime();
  return s >= ms && e <= me;
}

const CreateEventWizard = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const displayName = user?.fullName || "Event Manager";

  /** ========= step state ========= */
  const [step, setStep] = useState(1);

  /** ========= backend ids ========= */
  const [eventId, setEventId] = useState(null);

  /** ========= step 1 state ========= */
  const [mainEvent, setMainEvent] = useState({
    eventName: "",
    description: "",
    startTime: "",
    endTime: "",
    expectedAttendees: "",
    estimatedCost: "",
  });

  const [locationMode, setLocationMode] = useState("internal"); // internal|external
  const [locationId, setLocationId] = useState(null);
  const [externalLocationName, setExternalLocationName] = useState("");
  const [externalLocationAddress, setExternalLocationAddress] = useState("");

  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomsError, setRoomsError] = useState(null);
  const [roomFilters, setRoomFilters] = useState({ minCapacity: "", building: "" });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  /** ========= step 2 state: sub events ========= */
  const [subEvents, setSubEvents] = useState([]);

  const [seModalOpen, setSeModalOpen] = useState(false);
  const [seEditingId, setSeEditingId] = useState(null);
  const [seDraft, setSeDraft] = useState({
    name: "",
    start: "",
    end: "",
    cost: "",
    desc: "",
  });

  /** ========= step 3 state: resources ========= */
  const [activeSeId, setActiveSeId] = useState(null);
  const [internalResources, setInternalResources] = useState([]);
  const [externalResources, setExternalResources] = useState([]);

  /** ========= step 4 state: tasks ========= */
  const [tasks, setTasks] = useState([]);
  const [taskDraft, setTaskDraft] = useState({
    title: "",
    subEventId: "",
    due: "",
    est: "",
    emails: "",
  });
  const [taskEditingIndex, setTaskEditingIndex] = useState(-1);

  /** ========= step 5 derived ========= */
  const storedMain = useMemo(() => SS.get("mainEvent", null), [step]);
  const money = (v) => (Number(v || 0)).toLocaleString("vi-VN") + " ₫";

  /** ========= initial load draft if any ========= */
  useEffect(() => {
    const main = SS.get("mainEvent", null);
    const subs = SS.get("subEvents", []);
    const intr = SS.get("internalResources", []);
    const extr = SS.get("externalResources", []);
    const tks = SS.get("tasks", []);

    if (subs?.length) setSubEvents(subs);
    if (intr?.length) setInternalResources(intr);
    if (extr?.length) setExternalResources(extr);
    if (tks?.length) setTasks(tks);

    // Nếu có mainEvent draft trước đó, fill ngược về form step 1 (optional)
    if (main && step === 1) {
      setMainEvent((prev) => ({
        ...prev,
        eventName: main.name || "",
        description: main.description || "",
        startTime: main.start ? new Date(main.start).toISOString().slice(0, 16) : "",
        endTime: main.end ? new Date(main.end).toISOString().slice(0, 16) : "",
        expectedAttendees: main.expected ?? "",
        estimatedCost: main.estimatedCost ?? "",
      }));
      setLocationMode(main.locationMode || "internal");
      setLocationId(main.locationId || null);
      setExternalLocationName(main.externalLocationName || "");
      setExternalLocationAddress(main.externalLocationAddress || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ========= fetch rooms ========= */
  const fetchAvailableRooms = async () => {
    setRoomsError(null);

    if (!mainEvent.startTime || !mainEvent.endTime) {
      setRoomsError("Vui lòng chọn thời gian bắt đầu / kết thúc sự kiện trước khi lọc phòng.");
      return;
    }

    try {
      setLoadingRooms(true);
      const params = { startTime: mainEvent.startTime, endTime: mainEvent.endTime };

      if (roomFilters.minCapacity) params.minCapacity = Number(roomFilters.minCapacity);
      if (roomFilters.building) params.building = roomFilters.building;

      const res = await apiClient.get("/locations/available", { params });

      if (res.data?.success) setAvailableRooms(res.data.data || []);
      else setRoomsError(res.data?.message || "Không tải được danh sách phòng khả dụng.");
    } catch (err) {
      console.error("❌ Lỗi load phòng khả dụng:", err);
      setRoomsError(err.response?.data?.message || "Không tải được danh sách phòng khả dụng.");
    } finally {
      setLoadingRooms(false);
    }
  };

  /** ========= nav ========= */
  const prevStep = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const nextStep = async () => {
    setError(null);

    // ===== STEP 1: create main event + location, then persist to sessionStorage
    if (step === 1) {
      if (!mainEvent.eventName || !mainEvent.startTime || !mainEvent.endTime) {
        setError("Vui lòng nhập tên sự kiện và thời gian bắt đầu/kết thúc.");
        return;
      }

      if (locationMode === "internal") {
        if (!locationId) {
          setError("Vui lòng chọn một phòng nội bộ cho sự kiện hoặc chuyển sang địa điểm bên ngoài.");
          return;
        }
      } else {
        if (!externalLocationName) {
          setError("Vui lòng nhập tên địa điểm bên ngoài.");
          return;
        }
      }

      try {
        setSaving(true);

        // payload backend (giữ theo code bạn đang làm)
        const payload = {
          eventName: mainEvent.eventName,
          description: mainEvent.description,
          startTime: mainEvent.startTime,
          endTime: mainEvent.endTime,
          expectedAttendees: mainEvent.expectedAttendees ? Number(mainEvent.expectedAttendees) : null,
          estimatedCost: mainEvent.estimatedCost ? Number(mainEvent.estimatedCost) : null,
          locationId: locationMode === "internal" ? locationId : null,
          externalLocation: locationMode === "external"
            ? { name: externalLocationName, address: externalLocationAddress }
            : null,
        };

        const created = await eventService.createEvent(payload);
        const createdId = created?.eventId ?? created?.data?.eventId ?? null;
        if (createdId) setEventId(createdId);

        // persist for other steps like HTML review.html expects
        const mainForSS = mapMainEventToStorage({
          mainEvent,
          locationMode,
          locationId,
          externalLocationName,
          externalLocationAddress,
          displayName,
        });
        SS.set("mainEvent", mainForSS);

        setStep(2);
      } catch (e) {
        console.error(e);
        setError(e?.response?.data?.message || e.message || "Tạo sự kiện thất bại.");
      } finally {
        setSaving(false);
      }
      return;
    }

    // ===== STEP 2: require >=1 sub event then persist
    if (step === 2) {
      if (!subEvents.length) {
        setError("Bạn cần tạo ít nhất 1 Sub-Event trước khi sang bước Resources.");
        return;
      }
      SS.set("subEvents", subEvents);
      // auto choose first for resources
      if (!activeSeId) setActiveSeId(subEvents[0].id);
      setStep(3);
      return;
    }

    // ===== STEP 3: persist resources then go tasks
    if (step === 3) {
      SS.set("internalResources", internalResources);
      SS.set("externalResources", externalResources);
      setStep(4);
      return;
    }

    // ===== STEP 4: persist tasks then go review
    if (step === 4) {
      SS.set("tasks", tasks);
      setStep(5);
      return;
    }

    // ===== STEP 5: submit (your backend)
    if (step === 5) {
      // bạn có thể gọi API submit all ở đây
      // await eventService.submitDirectorPack(eventId)
      navigate("/manager/dashboard");
    }
  };

  /** ========= step 2: sub events ========= */
  const openAddSubEvent = () => {
    setSeEditingId(null);
    setSeDraft({ name: "", start: "", end: "", cost: "", desc: "" });
    setSeModalOpen(true);
  };
  const openEditSubEvent = (id) => {
    const se = subEvents.find((x) => x.id === id);
    if (!se) return;
    setSeEditingId(id);
    setSeDraft({
      name: se.name || "",
      start: se.start ? new Date(se.start).toISOString().slice(0, 16) : "",
      end: se.end ? new Date(se.end).toISOString().slice(0, 16) : "",
      cost: se.cost ?? "",
      desc: se.desc ?? "",
    });
    setSeModalOpen(true);
  };
  const saveSubEvent = () => {
    const main = SS.get("mainEvent", null);
    const name = seDraft.name.trim();
    const startISO = seDraft.start ? new Date(seDraft.start).toISOString() : null;
    const endISO = seDraft.end ? new Date(seDraft.end).toISOString() : null;

    if (!name) return setError("Vui lòng nhập tên Sub-Event.");
    if (!startISO || !endISO) return setError("Vui lòng chọn Start/End cho Sub-Event.");
    if (new Date(endISO) <= new Date(startISO)) return setError("End phải sau Start.");

    if (main && !withinMain(main, startISO, endISO)) {
      return setError("Thời gian Sub-Event phải nằm trong khung thời gian Main Event.");
    }

    const obj = {
      id: seEditingId || uid(),
      name,
      start: startISO,
      end: endISO,
      cost: Number(seDraft.cost || 0),
      desc: seDraft.desc?.trim() || "",
      // location sẽ gán ở Step 3
    };

    setError(null);
    setSubEvents((prev) => {
      if (!seEditingId) return [...prev, obj];
      return prev.map((x) => (x.id === seEditingId ? obj : x));
    });
    setSeModalOpen(false);
  };
  const deleteSubEvent = (id) => {
    setSubEvents((prev) => prev.filter((x) => x.id !== id));
    // cleanup resources/tasks linked
    setInternalResources((prev) => prev.filter((x) => x.assignId !== id));
    setExternalResources((prev) => prev.filter((x) => x.assignId !== id));
    setTasks((prev) => prev.filter((t) => t.subEventId !== id));
  };

  /** ========= step 3: resources minimal UI ========= */
  const activeSub = useMemo(() => subEvents.find((x) => x.id === activeSeId), [subEvents, activeSeId]);

  const addInternalRoomForActive = () => {
    if (!activeSub) return setError("Hãy chọn Sub-Event trước.");
    const name = prompt("Nhập tên phòng (demo) - VD: Auditorium 200");
    if (!name) return;
    setError(null);
    setInternalResources((prev) => [
      ...prev,
      {
        type: "Room",
        name,
        assignId: activeSub.id,
        qty: 1,
        start: activeSub.start,
        end: activeSub.end,
        status: "Planned",
      },
    ]);
  };

  const addInternalDeviceForActive = () => {
    if (!activeSub) return setError("Hãy chọn Sub-Event trước.");
    const name = prompt("Nhập tên thiết bị (demo) - VD: Projector");
    if (!name) return;
    const qty = Number(prompt("Số lượng? (demo)", "1") || 1);
    setError(null);
    setInternalResources((prev) => [
      ...prev,
      {
        type: "Device",
        name,
        assignId: activeSub.id,
        qty: Math.max(1, qty),
        start: activeSub.start,
        end: activeSub.end,
        status: "Planned",
      },
    ]);
  };

  const addExternalForActive = () => {
    if (!activeSub) return setError("Hãy chọn Sub-Event trước.");
    const provider = prompt("Nhập nhà cung cấp (demo) - VD: AV Pro Co.");
    if (!provider) return;
    const expected = Number(prompt("Chi phí dự kiến?", "0") || 0);
    setError(null);
    setExternalResources((prev) => [
      ...prev,
      { provider, type: "Service", assignId: activeSub.id, expected, actual: 0, contract: "" },
    ]);
  };

  /** ========= step 4: tasks ========= */
  const saveTask = () => {
    const title = taskDraft.title.trim();
    const subEventId = taskDraft.subEventId;
    const dueISO = taskDraft.due ? new Date(taskDraft.due).toISOString() : null;

    if (!title) return setError("Vui lòng nhập tiêu đề task.");
    if (!subEventId) return setError("Vui lòng chọn Sub-Event cho task.");
    if (!dueISO) return setError("Vui lòng chọn deadline.");

    const obj = {
      title,
      subEventId,
      due: dueISO,
      est: Number(taskDraft.est || 0),
      emails: (taskDraft.emails || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    setError(null);
    setTasks((prev) => {
      if (taskEditingIndex < 0) return [...prev, obj];
      return prev.map((x, i) => (i === taskEditingIndex ? obj : x));
    });

    setTaskDraft({ title: "", subEventId: "", due: "", est: "", emails: "" });
    setTaskEditingIndex(-1);
  };

  const editTask = (idx) => {
    const t = tasks[idx];
    if (!t) return;
    setTaskEditingIndex(idx);
    setTaskDraft({
      title: t.title || "",
      subEventId: t.subEventId || "",
      due: t.due ? new Date(t.due).toISOString().slice(0, 16) : "",
      est: t.est ?? "",
      emails: (t.emails || []).join(", "),
    });
  };

  const deleteTask = (idx) => setTasks((prev) => prev.filter((_, i) => i !== idx));

  /** ========= Step renderers ========= */
  const Stepper = () => {
    const steps = [
      { n: 1, label: "1. Main Info" },
      { n: 2, label: "2. Sub-Events" },
      { n: 3, label: "3. Resources" },
      { n: 4, label: "4. Tasks" },
      { n: 5, label: "5. Review" },
    ];
    return (
      <div className="md-card" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {steps.map((s) => (
            <button
              key={s.n}
              type="button"
              className={`md-pill ${step === s.n ? "active" : ""}`}
              onClick={() => {
                // chỉ cho nhảy nếu đã có mainEvent ở SS
                if (s.n > 1 && !SS.get("mainEvent", null)) return;
                setError(null);
                setStep(s.n);
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderStep1 = () => (
    <div className="md-card">
      <h2>1. Main Event + Location</h2>

      <div className="md-form-grid">
        <div className="md-field md-field-full">
          <label>Tên sự kiện *</label>
          <input
            value={mainEvent.eventName}
            onChange={(e) => setMainEvent((p) => ({ ...p, eventName: e.target.value }))}
            placeholder="VD: FPT TechFest 2025"
          />
        </div>

        <div className="md-field md-field-full">
          <label>Mô tả</label>
          <textarea
            rows={3}
            value={mainEvent.description}
            onChange={(e) => setMainEvent((p) => ({ ...p, description: e.target.value }))}
          />
        </div>

        <div className="md-field">
          <label>Start *</label>
          <input
            type="datetime-local"
            value={mainEvent.startTime}
            onChange={(e) => setMainEvent((p) => ({ ...p, startTime: e.target.value }))}
          />
        </div>
        <div className="md-field">
          <label>End *</label>
          <input
            type="datetime-local"
            value={mainEvent.endTime}
            onChange={(e) => setMainEvent((p) => ({ ...p, endTime: e.target.value }))}
          />
        </div>

        <div className="md-field">
          <label>Expected</label>
          <input
            type="number"
            value={mainEvent.expectedAttendees}
            onChange={(e) => setMainEvent((p) => ({ ...p, expectedAttendees: e.target.value }))}
          />
        </div>

        <div className="md-field">
          <label>Budget (Estimated)</label>
          <input
            type="number"
            value={mainEvent.estimatedCost}
            onChange={(e) => setMainEvent((p) => ({ ...p, estimatedCost: e.target.value }))}
          />
        </div>
      </div>

      <div className="md-sep" />

      <h3>Location</h3>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <button
          type="button"
          className={`md-pill ${locationMode === "internal" ? "active" : ""}`}
          onClick={() => setLocationMode("internal")}
        >
          Internal (Room)
        </button>
        <button
          type="button"
          className={`md-pill ${locationMode === "external" ? "active" : ""}`}
          onClick={() => setLocationMode("external")}
        >
          External
        </button>
      </div>

      {locationMode === "internal" ? (
        <>
          <div className="md-form-grid">
            <div className="md-field">
              <label>Min capacity</label>
              <input
                type="number"
                value={roomFilters.minCapacity}
                onChange={(e) => setRoomFilters((p) => ({ ...p, minCapacity: e.target.value }))}
              />
            </div>
            <div className="md-field">
              <label>Building</label>
              <input
                value={roomFilters.building}
                onChange={(e) => setRoomFilters((p) => ({ ...p, building: e.target.value }))}
                placeholder="VD: A, E, S..."
              />
            </div>
          </div>

          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="md-btn-primary" onClick={fetchAvailableRooms}>
              Lọc phòng khả dụng
            </button>
            {roomsError && <span style={{ color: "crimson" }}>{roomsError}</span>}
          </div>

          <div className="md-room-grid" style={{ marginTop: 12 }}>
            {loadingRooms ? (
              <p>Đang tải danh sách phòng...</p>
            ) : availableRooms.length === 0 ? (
              <p className="md-text-muted">Chưa có dữ liệu phòng.</p>
            ) : (
              availableRooms.map((room) => {
                const selected = locationId === room.locationId;
                return (
                  <div
                    key={room.locationId}
                    className={`md-room-card ${selected ? "selected" : ""}`}
                    onClick={() => setLocationId(room.locationId)}
                  >
                    <div className="md-room-body">
                      <h4>{room.name}</h4>
                      <p className="md-text-muted">
                        {room.building} • {room.roomNumber}
                      </p>
                      <p className="md-text-muted">
                        Sức chứa: <strong>{room.capacity ?? "Không rõ"}</strong>
                      </p>
                      {selected && <div className="md-room-badge-selected">Đã chọn</div>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        <div className="md-form-grid">
          <div className="md-field md-field-full">
            <label>Tên địa điểm bên ngoài *</label>
            <input value={externalLocationName} onChange={(e) => setExternalLocationName(e.target.value)} />
          </div>
          <div className="md-field md-field-full">
            <label>Địa chỉ chi tiết</label>
            <textarea rows={3} value={externalLocationAddress} onChange={(e) => setExternalLocationAddress(e.target.value)} />
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => {
    const main = SS.get("mainEvent", null);
    return (
      <div className="md-card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <h2>2. Sub-Events</h2>
            <p className="md-text-muted">
              Parent: <strong>{main?.name || "—"}</strong> (chỉ khai báo Sub-Event, resources gán ở bước 3)
            </p>
          </div>
          <button type="button" className="md-btn-primary" onClick={openAddSubEvent}>
            + Add Sub-Event
          </button>
        </div>

        <div className="md-table-wrapper" style={{ marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Start</th>
                <th>End</th>
                <th>Cost</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {subEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 16, textAlign: "center" }}>
                    Chưa có Sub-Event
                  </td>
                </tr>
              ) : (
                subEvents.map((se) => (
                  <tr key={se.id}>
                    <td>
                      <strong>{se.name}</strong>
                      <div className="md-text-muted">{se.desc || ""}</div>
                    </td>
                    <td>{new Date(se.start).toLocaleString()}</td>
                    <td>{new Date(se.end).toLocaleString()}</td>
                    <td>{money(se.cost)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button className="md-btn-link" type="button" onClick={() => openEditSubEvent(se.id)}>
                        Edit
                      </button>
                      {" · "}
                      <button className="md-btn-link" type="button" onClick={() => deleteSubEvent(se.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* modal */}
        {seModalOpen && (
          <div className="md-modal">
            <div className="md-modal-panel">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <h3 style={{ margin: 0 }}>{seEditingId ? "Edit Sub-Event" : "Add Sub-Event"}</h3>
                <button className="md-btn-ghost" type="button" onClick={() => setSeModalOpen(false)}>
                  Close
                </button>
              </div>

              <div className="md-form-grid" style={{ marginTop: 10 }}>
                <div className="md-field md-field-full">
                  <label>Name *</label>
                  <input value={seDraft.name} onChange={(e) => setSeDraft((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="md-field">
                  <label>Start *</label>
                  <input
                    type="datetime-local"
                    value={seDraft.start}
                    onChange={(e) => setSeDraft((p) => ({ ...p, start: e.target.value }))}
                    min={main?.start ? new Date(main.start).toISOString().slice(0, 16) : undefined}
                    max={main?.end ? new Date(main.end).toISOString().slice(0, 16) : undefined}
                  />
                </div>
                <div className="md-field">
                  <label>End *</label>
                  <input
                    type="datetime-local"
                    value={seDraft.end}
                    onChange={(e) => setSeDraft((p) => ({ ...p, end: e.target.value }))}
                    min={main?.start ? new Date(main.start).toISOString().slice(0, 16) : undefined}
                    max={main?.end ? new Date(main.end).toISOString().slice(0, 16) : undefined}
                  />
                </div>
                <div className="md-field">
                  <label>Cost</label>
                  <input type="number" value={seDraft.cost} onChange={(e) => setSeDraft((p) => ({ ...p, cost: e.target.value }))} />
                </div>
                <div className="md-field md-field-full">
                  <label>Description</label>
                  <textarea rows={3} value={seDraft.desc} onChange={(e) => setSeDraft((p) => ({ ...p, desc: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button className="md-btn-ghost" type="button" onClick={() => setSeModalOpen(false)}>
                  Cancel
                </button>
                <button className="md-btn-primary" type="button" onClick={saveSubEvent}>
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="md-card">
      <h2>3. Resources (gán theo Sub-Event)</h2>

      <div className="md-form-grid">
        <div className="md-field md-field-full">
          <label>Chọn Sub-Event</label>
          <select value={activeSeId || ""} onChange={(e) => setActiveSeId(e.target.value)}>
            <option value="" disabled>
              -- chọn --
            </option>
            {subEvents.map((se) => (
              <option key={se.id} value={se.id}>
                {se.name}
              </option>
            ))}
          </select>
          <div className="md-text-muted" style={{ marginTop: 6 }}>
            Active: <strong>{activeSub?.name || "—"}</strong>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
        <button className="md-btn-primary" type="button" onClick={addInternalRoomForActive}>
          + Add Room (demo)
        </button>
        <button className="md-btn-primary" type="button" onClick={addInternalDeviceForActive}>
          + Add Device (demo)
        </button>
        <button className="md-btn-primary" type="button" onClick={addExternalForActive}>
          + Add External (demo)
        </button>
      </div>

      <div className="md-content-grid" style={{ marginTop: 14 }}>
        <div className="md-card">
          <h3>Internal Resources</h3>
          <div className="md-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Assign</th>
                  <th>Qty</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {internalResources.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 12, textAlign: "center" }}>
                      Chưa có
                    </td>
                  </tr>
                ) : (
                  internalResources.map((r, idx) => (
                    <tr key={idx}>
                      <td>{r.type}</td>
                      <td>{r.name}</td>
                      <td>{subEvents.find((s) => s.id === r.assignId)?.name || "—"}</td>
                      <td>{r.qty}</td>
                      <td>
                        <button
                          className="md-btn-link"
                          type="button"
                          onClick={() => setInternalResources((p) => p.filter((_, i) => i !== idx))}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="md-card">
          <h3>External Resources</h3>
          <div className="md-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Assign</th>
                  <th>Expected</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {externalResources.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: 12, textAlign: "center" }}>
                      Chưa có
                    </td>
                  </tr>
                ) : (
                  externalResources.map((r, idx) => (
                    <tr key={idx}>
                      <td>{r.provider}</td>
                      <td>{subEvents.find((s) => s.id === r.assignId)?.name || "—"}</td>
                      <td>{money(r.expected)}</td>
                      <td>
                        <button
                          className="md-btn-link"
                          type="button"
                          onClick={() => setExternalResources((p) => p.filter((_, i) => i !== idx))}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="md-text-muted" style={{ marginTop: 10 }}>
        (UI demo tối giản) — Bạn có thể “port” UI đẹp từ `resources-allocation.html` vào đây sau.
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="md-card">
      <h2>4. Tasks</h2>

      <div className="md-form-grid">
        <div className="md-field md-field-full">
          <label>Title *</label>
          <input value={taskDraft.title} onChange={(e) => setTaskDraft((p) => ({ ...p, title: e.target.value }))} />
        </div>

        <div className="md-field">
          <label>Sub-Event *</label>
          <select value={taskDraft.subEventId} onChange={(e) => setTaskDraft((p) => ({ ...p, subEventId: e.target.value }))}>
            <option value="">-- chọn --</option>
            {subEvents.map((se) => (
              <option key={se.id} value={se.id}>
                {se.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md-field">
          <label>Deadline *</label>
          <input type="datetime-local" value={taskDraft.due} onChange={(e) => setTaskDraft((p) => ({ ...p, due: e.target.value }))} />
        </div>

        <div className="md-field">
          <label>Est (hours)</label>
          <input type="number" value={taskDraft.est} onChange={(e) => setTaskDraft((p) => ({ ...p, est: e.target.value }))} />
        </div>

        <div className="md-field md-field-full">
          <label>Assignees emails (comma)</label>
          <input value={taskDraft.emails} onChange={(e) => setTaskDraft((p) => ({ ...p, emails: e.target.value }))} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
        <button className="md-btn-primary" type="button" onClick={saveTask}>
          {taskEditingIndex >= 0 ? "Update Task" : "Add Task"}
        </button>
      </div>

      <div className="md-table-wrapper" style={{ marginTop: 12 }}>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Sub-Event</th>
              <th>Due</th>
              <th>Est</th>
              <th>Emails</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 16, textAlign: "center" }}>
                  Chưa có task
                </td>
              </tr>
            ) : (
              tasks.map((t, idx) => (
                <tr key={idx}>
                  <td>{t.title}</td>
                  <td>{subEvents.find((s) => s.id === t.subEventId)?.name || "—"}</td>
                  <td>{t.due ? new Date(t.due).toLocaleString() : "—"}</td>
                  <td>{t.est || 0}</td>
                  <td>{(t.emails || []).join(", ")}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="md-btn-link" type="button" onClick={() => editTask(idx)}>
                      Edit
                    </button>
                    {" · "}
                    <button className="md-btn-link" type="button" onClick={() => deleteTask(idx)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStep5 = () => {
    const main = SS.get("mainEvent", null);
    const subs = SS.get("subEvents", subEvents);
    const intr = SS.get("internalResources", internalResources);
    const extr = SS.get("externalResources", externalResources);
    const tks = SS.get("tasks", tasks);

    const totalSE = subs.reduce((s, x) => s + Number(x.cost || 0), 0);
    const totalEXT = extr.reduce((s, x) => s + Number(x.expected || 0), 0);
    const used = totalSE + totalEXT;
    const remain = Math.max(0, Number(main?.estimatedCost || 0) - used);

    return (
      <div className="md-card">
        <h2>5. Review</h2>
        <p className="md-text-muted">
          Bước này tương đương `review.html` — đọc 5 key trong sessionStorage và tổng hợp lại.
        </p>

        <div className="md-content-grid">
          <div className="md-card">
            <h3>Main Event</h3>
            <div className="md-text-muted">Name: <strong>{main?.name || "—"}</strong></div>
            <div className="md-text-muted">Time: {main?.start ? new Date(main.start).toLocaleString() : "—"} → {main?.end ? new Date(main.end).toLocaleString() : "—"}</div>
            <div className="md-text-muted">Expected: <strong>{(main?.expected || 0).toLocaleString("vi-VN")}</strong></div>
            <div className="md-text-muted">Budget: <strong>{money(main?.estimatedCost || 0)}</strong></div>
          </div>

          <div className="md-card">
            <h3>Budget</h3>
            <div className="md-text-muted">Sub-events cost: <strong>{money(totalSE)}</strong></div>
            <div className="md-text-muted">External expected: <strong>{money(totalEXT)}</strong></div>
            <div className="md-text-muted">Used: <strong>{money(used)}</strong></div>
            <div className="md-text-muted">Remain: <strong>{money(remain)}</strong></div>
          </div>
        </div>

        <div className="md-sep" />

        <div className="md-content-grid">
          <div className="md-card">
            <h3>Sub-Events ({subs.length})</h3>
            <div className="md-table-wrapper">
              <table>
                <thead>
                  <tr><th>Name</th><th>Start</th><th>End</th><th>Cost</th></tr>
                </thead>
                <tbody>
                  {subs.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{new Date(s.start).toLocaleString()}</td>
                      <td>{new Date(s.end).toLocaleString()}</td>
                      <td>{money(s.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md-card">
            <h3>Tasks ({tks.length})</h3>
            <div className="md-table-wrapper">
              <table>
                <thead>
                  <tr><th>Title</th><th>Sub</th><th>Due</th></tr>
                </thead>
                <tbody>
                  {tks.map((t, idx) => (
                    <tr key={idx}>
                      <td>{t.title}</td>
                      <td>{subs.find((s) => s.id === t.subEventId)?.name || "—"}</td>
                      <td>{t.due ? new Date(t.due).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="md-sep" />

        <div className="md-content-grid">
          <div className="md-card">
            <h3>Internal Resources ({intr.length})</h3>
            <div className="md-table-wrapper">
              <table>
                <thead>
                  <tr><th>Type</th><th>Name</th><th>Assign</th><th>Qty</th></tr>
                </thead>
                <tbody>
                  {intr.map((r, idx) => (
                    <tr key={idx}>
                      <td>{r.type}</td>
                      <td>{r.name}</td>
                      <td>{subs.find((s) => s.id === r.assignId)?.name || "—"}</td>
                      <td>{r.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md-card">
            <h3>External ({extr.length})</h3>
            <div className="md-table-wrapper">
              <table>
                <thead>
                  <tr><th>Provider</th><th>Assign</th><th>Expected</th></tr>
                </thead>
                <tbody>
                  {extr.map((r, idx) => (
                    <tr key={idx}>
                      <td>{r.provider}</td>
                      <td>{subs.find((s) => s.id === r.assignId)?.name || "—"}</td>
                      <td>{money(r.expected)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            className="md-btn-ghost"
            onClick={() => {
              SS.set("mainEvent", main);
              SS.set("subEvents", subs);
              SS.set("internalResources", intr);
              SS.set("externalResources", extr);
              SS.set("tasks", tks);
              alert("Đã lưu draft vào sessionStorage ✔");
            }}
          >
            Save Draft
          </button>

          <button type="button" className="md-btn-primary" onClick={() => nextStep()}>
            Submit / Finish
          </button>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  return (
    <div className="manager-dashboard">
      <main className="md-main">
        <div className="md-topbar">
          <div className="md-topbar-left">
            <h1>
              Create Event Wizard <span className="badge">Event Manager</span>
            </h1>
            <p>Main → Sub-Events → Resources → Tasks → Review</p>
          </div>
          <div className="md-topbar-right">
            <div className="md-topbar-user">
              <div className="md-topbar-user-avatar">{displayName?.[0]?.toUpperCase() || "E"}</div>
              <div className="md-topbar-user-info">
                <strong>{displayName}</strong>
                <span>Event Manager</span>
              </div>
            </div>
          </div>
        </div>

        <Stepper />

        {error && (
          <div className="md-card" style={{ borderColor: "rgba(220,38,38,0.5)" }}>
            <p style={{ color: "crimson", margin: 0 }}>{error}</p>
          </div>
        )}

        {renderCurrentStep()}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <button type="button" className="md-btn-ghost" onClick={prevStep} disabled={step === 1 || saving}>
            ← Back
          </button>

          <button type="button" className="md-btn-primary" onClick={nextStep} disabled={saving}>
            {saving ? "Saving..." : step === 5 ? "Finish" : "Next →"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default CreateEventWizard;
