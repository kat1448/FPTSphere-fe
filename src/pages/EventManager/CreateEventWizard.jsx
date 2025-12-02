import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import eventService from "../../services/EventService";
import apiClient from "../../services/api"; // dùng trực tiếp apiClient để gọi /locations/available
import "../../assets/css/manager-dashboard.css";

const CreateEventWizard = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const displayName = user?.fullName || "Event Manager";

  // ======= STEP STATE =======
  const [step, setStep] = useState(1);

  // ID event sau khi tạo main event (dùng cho các step sau)
  const [eventId, setEventId] = useState(null);

  // ======= MAIN EVENT STATE =======
  const [mainEvent, setMainEvent] = useState({
    eventName: "",
    description: "",
    startTime: "",
    endTime: "",
    expectedAttendees: "",
    estimatedCost: "",
  });

  // ======= LOCATION STATE =======
  const [locationMode, setLocationMode] = useState("internal"); // "internal" | "external"
  const [locationId, setLocationId] = useState(null);

  const [externalLocationName, setExternalLocationName] = useState("");
  const [externalLocationAddress, setExternalLocationAddress] = useState("");

  // danh sách phòng khả dụng (nội bộ)
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomsError, setRoomsError] = useState(null);

  // filter thêm cho phòng
  const [roomFilters, setRoomFilters] = useState({
    minCapacity: "",
    building: "",
  });

  // ======= FLAGS KHÁC =======
  const [hasSubEvents, setHasSubEvents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // (subEvents, resources, tasks sẽ dùng ở step sau)
  const [subEvents, setSubEvents] = useState([]);
  const [internalResources, setInternalResources] = useState([]);
  const [externalResources, setExternalResources] = useState([]);
  const [tasks, setTasks] = useState([]);

  // ================== LOCATION: FETCH AVAILABLE ROOMS ==================
  const fetchAvailableRooms = async () => {
    setRoomsError(null);

    // cần có start/end mới lọc được
    if (!mainEvent.startTime || !mainEvent.endTime) {
      setRoomsError("Vui lòng chọn thời gian bắt đầu / kết thúc sự kiện trước khi lọc phòng.");
      return;
    }

    try {
      setLoadingRooms(true);

      const params = {
        startTime: mainEvent.startTime,
        endTime: mainEvent.endTime,
      };

      if (roomFilters.minCapacity) {
        params.minCapacity = Number(roomFilters.minCapacity);
      }
      if (roomFilters.building) {
        params.building = roomFilters.building;
      }

      const res = await apiClient.get("/locations/available", { params });

      if (res.data?.success) {
        setAvailableRooms(res.data.data || []);
      } else {
        setRoomsError(res.data?.message || "Không tải được danh sách phòng khả dụng.");
      }
    } catch (err) {
      console.error("❌ Lỗi load phòng khả dụng:", err);
      setRoomsError(
        err.response?.data?.message || "Không tải được danh sách phòng khả dụng."
      );
    } finally {
      setLoadingRooms(false);
    }
  };

  // ================== STEP: NEXT / PREV ==================
  const prevStep = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const nextStep = async () => {
    setError(null);

    // Bước 1: tạo main event
    if (step === 1 && !eventId) {
      // validate cơ bản
      if (!mainEvent.eventName || !mainEvent.startTime || !mainEvent.endTime) {
        setError("Vui lòng nhập tên sự kiện và thời gian bắt đầu/kết thúc.");
        return;
      }

      // validate location
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

        const payload = {
          eventName: mainEvent.eventName,
          description: mainEvent.description,
          startTime: mainEvent.startTime,
          endTime: mainEvent.endTime,
          expectedAttendees: mainEvent.expectedAttendees
            ? Number(mainEvent.expectedAttendees)
            : null,
          estimatedCost: mainEvent.estimatedCost
            ? Number(mainEvent.estimatedCost)
            : null,
          // mapping location theo backend
          locationId: locationMode === "internal" ? Number(locationId) : null,
          externalLocationId: locationMode === "external" ? 2 : null, // tạm 2, sau này map đúng id
          externalLocationName:
            locationMode === "external" ? externalLocationName : null,
          externalLocationAddress:
            locationMode === "external" ? externalLocationAddress : null,
        };

        const created = await eventService.createEvent(payload);
        setEventId(created.eventId); // theo DTO backend

        // sang bước 2 nếu có sub-events, không thì sang bước 3
        setStep(hasSubEvents ? 2 : 3);
        return;
      } catch (err) {
        console.error(err);
        setError(err.message || "Không thể tạo sự kiện chính.");
        return;
      } finally {
        setSaving(false);
      }
    }

    // các bước sau chỉ next bình thường
    setStep((s) => Math.min(5, s + 1));
  };

  const handleSubmitAll = async () => {
    // tạm thời demo, sau này bạn call API tạo subEvents, resources, tasks
    console.log("Submit event package", {
      eventId,
      mainEvent,
      subEvents,
      internalResources,
      externalResources,
      tasks,
    });

    alert("Đã lưu gói sự kiện (demo). Sau này sẽ gọi API thật.");
    navigate("/manager/dashboard");
  };

  // ================== RENDER UI ==================

  const renderStepper = () => (
    <div className="md-stepper">
      {["Main", "Sub-Events", "Resources", "Tasks", "Review"].map(
        (label, index) => {
          const num = index + 1;
          const active = num === step;
          const done = num < step;
          return (
            <div
              key={label}
              className={`md-stepper-item ${
                active ? "active" : done ? "done" : ""
              }`}
            >
              <div className="md-stepper-dot">{num}</div>
              <span>{label}</span>
            </div>
          );
        }
      )}
    </div>
  );

  // ===== STEP 1: MAIN EVENT + LOCATION PICKER =====
  const renderStep1 = () => (
    <div className="md-card md-card-padding-lg">
      <div className="md-card-header-row">
        <div>
          <h2>1. Thông tin sự kiện chính</h2>
          <p className="md-text-muted">
            Nhập thông tin cơ bản, thời gian và chọn địa điểm nội bộ / bên
            ngoài.
          </p>
        </div>

        <div className="md-toggle-sub">
          <label className="md-switch">
            <input
              type="checkbox"
              checked={hasSubEvents}
              onChange={(e) => setHasSubEvents(e.target.checked)}
            />
            <span className="md-switch-slider" />
          </label>
          <div className="md-toggle-sub-text">
            <div className="md-toggle-title">This event has Sub-Events</div>
            <div className="md-toggle-subtitle">
              Bật nếu sự kiện gồm nhiều phiên (keynote, workshop, party...)
            </div>
          </div>
        </div>
      </div>

      {/* FORM CHÍNH */}
      <div className="md-form-grid">
        {/* Tên sự kiện */}
        <div className="md-field md-field-full">
          <label>
            Tên sự kiện <span className="md-required">*</span>
          </label>
          <input
            type="text"
            value={mainEvent.eventName}
            onChange={(e) =>
              setMainEvent({ ...mainEvent, eventName: e.target.value })
            }
            placeholder="VD: FPT Tech Summit 2026"
          />
        </div>

        {/* Thời gian */}
        <div className="md-field">
          <label>
            Ngày bắt đầu <span className="md-required">*</span>
          </label>
          <input
            type="datetime-local"
            value={mainEvent.startTime}
            onChange={(e) =>
              setMainEvent({ ...mainEvent, startTime: e.target.value })
            }
          />
        </div>

        <div className="md-field">
          <label>
            Ngày kết thúc <span className="md-required">*</span>
          </label>
          <input
            type="datetime-local"
            value={mainEvent.endTime}
            onChange={(e) =>
              setMainEvent({ ...mainEvent, endTime: e.target.value })
            }
          />
        </div>

        {/* Số lượng & ngân sách */}
        <div className="md-field">
          <label>Số lượng tham dự dự kiến</label>
          <input
            type="number"
            min="0"
            value={mainEvent.expectedAttendees}
            onChange={(e) =>
              setMainEvent({
                ...mainEvent,
                expectedAttendees: e.target.value,
              })
            }
            placeholder="VD: 300"
          />
        </div>

        <div className="md-field">
          <label>Ngân sách dự kiến (₫)</label>
          <input
            type="number"
            min="0"
            step="100000"
            value={mainEvent.estimatedCost}
            onChange={(e) =>
              setMainEvent({ ...mainEvent, estimatedCost: e.target.value })
            }
            placeholder="VD: 50.000.000"
          />
        </div>

        {/* Mô tả */}
        <div className="md-field md-field-full">
          <label>Mô tả</label>
          <textarea
            rows={4}
            value={mainEvent.description}
            onChange={(e) =>
              setMainEvent({ ...mainEvent, description: e.target.value })
            }
            placeholder="Mục tiêu, nội dung chính, đối tượng tham gia..."
          />
        </div>
      </div>

      {/* ===== LOCATION BLOCK ===== */}
      <div className="md-location-block">
        <div className="md-location-header">
          <h3>Địa điểm tổ chức</h3>
          <span className="md-text-muted">
            Chọn phòng nội bộ của FPTU hoặc nhập địa điểm bên ngoài. Với phòng
            nội bộ, hệ thống sẽ kiểm tra trùng lịch theo khung giờ sự kiện.
          </span>
        </div>

        {/* Mode switch */}
        <div className="md-radio-group">
          <label
            className={`md-radio-pill ${
              locationMode === "internal" ? "active" : ""
            }`}
          >
            <input
              type="radio"
              name="location-mode"
              value="internal"
              checked={locationMode === "internal"}
              onChange={() => setLocationMode("internal")}
            />
            <span>Địa điểm nội bộ</span>
          </label>
          <label
            className={`md-radio-pill ${
              locationMode === "external" ? "active" : ""
            }`}
          >
            <input
              type="radio"
              name="location-mode"
              value="external"
              checked={locationMode === "external"}
              onChange={() => setLocationMode("external")}
            />
            <span>Địa điểm bên ngoài</span>
          </label>
        </div>

        {/* ===== INTERNAL ROOMS: CARD VIEW + FILTER ===== */}
        {locationMode === "internal" ? (
          <>
            {/* Filters */}
            <div className="md-form-grid md-room-filters">
              <div className="md-field">
                <label>Tòa nhà (building)</label>
                <input
                  type="text"
                  value={roomFilters.building}
                  onChange={(e) =>
                    setRoomFilters({
                      ...roomFilters,
                      building: e.target.value,
                    })
                  }
                  placeholder="VD: A, B, C..."
                />
              </div>
              <div className="md-field">
                <label>Sức chứa tối thiểu</label>
                <input
                  type="number"
                  min="0"
                  value={roomFilters.minCapacity}
                  onChange={(e) =>
                    setRoomFilters({
                      ...roomFilters,
                      minCapacity: e.target.value,
                    })
                  }
                  placeholder="VD: 100"
                />
              </div>
              <div className="md-field md-field-full">
                <button
                  type="button"
                  className="md-btn-ghost"
                  onClick={fetchAvailableRooms}
                >
                  🔍 Lọc phòng khả dụng theo thời gian sự kiện
                </button>
              </div>
            </div>

            {roomsError && (
              <p style={{ color: "red", marginTop: 4 }}>{roomsError}</p>
            )}

            <div className="md-room-grid">
              {loadingRooms ? (
                <p>Đang tải danh sách phòng...</p>
              ) : availableRooms.length === 0 ? (
                <p className="md-text-muted">
                  Chưa có dữ liệu phòng. Hãy chọn thời gian và bấm{" "}
                  <strong>Lọc phòng khả dụng</strong>.
                </p>
              ) : (
                availableRooms.map((room) => {
                  const selected = locationId === room.locationId;
                  return (
                    <div
                      key={room.locationId}
                      className={`md-room-card ${
                        selected ? "selected" : ""
                      }`}
                      onClick={() => setLocationId(room.locationId)}
                    >
                      <div className="md-room-image-wrapper">
                        <img
                          src={
                            room.imageUrl ||
                            "https://placehold.co/600x400/0f172a/FFFFFF?text=Room"
                          }
                          alt={room.name}
                        />
                        {selected && (
                          <div className="md-room-badge-selected">
                            Đã chọn
                          </div>
                        )}
                      </div>
                      <div className="md-room-body">
                        <h4>{room.name}</h4>
                        <p className="md-text-muted">
                          {room.building} • {room.roomNumber}
                        </p>
                        <p className="md-text-muted">
                          Sức chứa:{" "}
                          <strong>{room.capacity ?? "Không rõ"}</strong>
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          // ===== EXTERNAL LOCATION =====
          <div className="md-form-grid">
            <div className="md-field md-field-full">
              <label>
                Tên địa điểm bên ngoài <span className="md-required">*</span>
              </label>
              <input
                type="text"
                value={externalLocationName}
                onChange={(e) => setExternalLocationName(e.target.value)}
                placeholder="VD: Sheraton Conference Center"
              />
            </div>
            <div className="md-field md-field-full">
              <label>Địa chỉ chi tiết</label>
              <textarea
                rows={3}
                value={externalLocationAddress}
                onChange={(e) =>
                  setExternalLocationAddress(e.target.value)
                }
                placeholder="Số nhà, đường, quận/huyện, thành phố..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ===== STEP 2–5: TẠM THỜI PLACEHOLDER (bạn sẽ map sau) =====
  const renderStep2 = () => (
    <div className="md-card">
      <h2>2. Sub-Events</h2>
      <p className="md-text-muted">
        Ở đây sẽ là UI tạo sub-events (giống file create-sub-events.html).
      </p>
    </div>
  );

  const renderStep3 = () => (
    <div className="md-card">
      <h2>3. Resources</h2>
      <p className="md-text-muted">
        Bước này sẽ map UI phân bổ tài nguyên (rooms/devices/service) giống
        resources-allocation.html.
      </p>
    </div>
  );

  const renderStep4 = () => (
    <div className="md-card">
      <h2>4. Tasks</h2>
      <p className="md-text-muted">
        Bước này sẽ map UI Task board giống Task.html (to-do, in-progress,
        done...).
      </p>
    </div>
  );

  const renderStep5 = () => (
    <div className="md-card">
      <h2>5. Review & Submit</h2>
      <p className="md-text-muted">
        Tổng hợp lại main event + sub-events + resources + tasks trước khi gửi
        duyệt.
      </p>
      <button
        className="md-btn-primary"
        type="button"
        onClick={handleSubmitAll}
      >
        Gửi duyệt
      </button>
    </div>
  );

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

  // ================== MAIN LAYOUT ==================
  return (
    <div className="manager-dashboard">
      <main className="md-main">
        <div className="md-topbar">
          <div className="md-topbar-left">
            <h1>
              Tạo sự kiện mới <span className="badge">Event Manager</span>
            </h1>
            <p>Main → Sub-Events → Resources → Tasks → Review</p>
          </div>
          <div className="md-topbar-right">
            <div className="md-topbar-user">
              <div className="md-topbar-user-avatar">
                {displayName[0]?.toUpperCase() || "EM"}
              </div>
              <div className="md-topbar-user-info">
                <strong>{displayName}</strong>
                <span>Event Manager</span>
              </div>
            </div>
          </div>
        </div>

        {renderStepper()}

        {error && (
          <p style={{ color: "red", marginBottom: 8 }}>
            {error}
          </p>
        )}

        {renderCurrentStep()}

        {/* FOOTER BUTTONS */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 16,
          }}
        >
          <button
            className="md-btn-ghost"
            type="button"
            onClick={step === 1 ? () => navigate("/manager/dashboard") : prevStep}
          >
            {step === 1 ? "Hủy" : "← Quay lại"}
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            {step < 5 && (
              <button
                className="md-btn-primary"
                type="button"
                onClick={nextStep}
                disabled={saving}
              >
                {saving ? "Đang lưu..." : "Tiếp tục →"}
              </button>
            )}
            {step === 5 && (
              <button
                className="md-btn-primary"
                type="button"
                onClick={handleSubmitAll}
              >
                Gửi duyệt
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateEventWizard;
