import React, { useEffect, useState } from "react";
import authService from "../../services/authService";
import eventService from "../../services/EventService";
import "../../assets/css/manager-dashboard.css";
import { useNavigate } from "react-router-dom";

const ManagerDashboard = () => {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();

  // ==== OVERVIEW STATE ====
  const [stats, setStats] = useState({
    upcomingEvents: 0,
    ongoingEvents: 0,
    pastEvents: 0,
    totalRegistrations: 0,
  });

  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // ==== EVENT LIST ====
  const [myEvents, setMyEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // ==== FILTER ====
  const [activeFilter, setActiveFilter] = useState("all");

  // ==== USER INFO ====
  const displayName = user?.fullName || "Event Manager";
  const roleName = user?.roleName || "Event Manager";

  const getInitials = (name) => {
    if (!name) return "EM";
    const parts = name.trim().split(/\s+/);
    return parts.map((p) => p[0]?.toUpperCase()).join("").slice(0, 2);
  };
  const initials = getInitials(displayName);

  // ==== STATUS MAPPING (UI only) ====
  const mapStatusBadge = (statusId) => {
    switch (statusId) {
      case 1:
        return "md-status-draft";
      case 2:
        return "md-status-pending";
      case 3:
        return "md-status-upcoming";
      case 4:
        return "md-status-live";
      case 5:
        return "md-status-done";
      case 6:
        return "md-status-cancelled";
      default:
        return "md-status-draft";
    }
  };

  // ========= API: OVERVIEW (cards) =========
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoadingStats(true);
        setStatsError(null);

        const overview = await eventService.getMyEventsOverview();

        setStats({
          upcomingEvents: overview?.upcomingEvents ?? 0,
          ongoingEvents: overview?.ongoingEvents ?? 0,
          pastEvents: overview?.pastEvents ?? 0,
          totalRegistrations: overview?.totalRegistrations ?? 0,
        });
      } catch (err) {
        console.error(err);
        setStatsError(err.message || "Failed to load statistics");
      } finally {
        setLoadingStats(false);
      }
    };

    fetchOverview();
  }, []);

  // ========= API: EVENTS BY FILTER =========

  const fetchEventsByFilter = async (filterKey) => {
    try {
      setLoadingEvents(true);

      // Base params giống curl: sortBy=CreatedAt, sortDescending=true
      const params = {
        includeDeleted: false,
        sortBy: "CreatedAt",
        sortDescending: true,
      };

      // Map filter -> statusId (backend)
      // 3 = Approved (Upcoming), 4 = In Progress, 5 = Completed
      switch (filterKey) {
        case "upcoming":
          params.statusId = 3;
          break;
        case "live":
          params.statusId = 4;
          break;
        case "done":
          params.statusId = 5; // Completed
          break;
        case "all":
        default:
          // no statusId -> lấy tất cả (sau đó ẩn draft ở FE)
          break;
      }

      const events = await eventService.getMyManagedEvents(params);

      // 🔥 ẨN Draft (statusId = 1) ở mọi tab
      const visibleEvents = (events || []).filter((ev) => ev.statusId !== 1);

      console.log(
        `📂 Events for filter "${filterKey}":`,
        visibleEvents.length,
        visibleEvents
      );

      setMyEvents(visibleEvents);
      setFilteredEvents(visibleEvents);
    } catch (err) {
      console.error("❌ Error loading events:", err);
      setMyEvents([]);
      setFilteredEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Lần đầu load: tab "all"
  useEffect(() => {
    fetchEventsByFilter("all");
  }, []);

  const applyFilter = (filterKey) => {
    setActiveFilter(filterKey);
    fetchEventsByFilter(filterKey);
  };

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <div className="manager-dashboard">
      {/* SIDEBAR */}
      <aside className="md-sidebar">
        <div className="md-sidebar-logo">
          <div className="md-sidebar-logo-circle">F</div>
          <div className="md-sidebar-logo-text">
            <strong>FPTU EVENTS</strong>
            <span>Campus activity hub</span>
          </div>
        </div>

        <div>
          <div className="md-sidebar-section-title">Overview</div>
          <ul className="md-sidebar-nav">
            <li className="md-sidebar-nav-item">
              <button className="md-sidebar-nav-link active">
                <span className="icon">📊</span>
                <span>Dashboard</span>
              </button>
            </li>
            <li className="md-sidebar-nav-item">
              <button className="md-sidebar-nav-link">
                <span className="icon">📅</span>Events
              </button>
            </li>
            <li className="md-sidebar-nav-item">
              <button className="md-sidebar-nav-link">
                <span className="icon">📍</span>Locations
              </button>
            </li>
            <li className="md-sidebar-nav-item">
              <button className="md-sidebar-nav-link">
                <span className="icon">👥</span>Participants
              </button>
            </li>
          </ul>

          <div className="md-sidebar-section-title">Others</div>
          <ul className="md-sidebar-nav">
            <li className="md-sidebar-nav-item">
              <button className="md-sidebar-nav-link">
                <span className="icon">📈</span>Reports
              </button>
            </li>
            <li className="md-sidebar-nav-item">
              <button className="md-sidebar-nav-link">
                <span className="icon">⚙️</span>Settings
              </button>
            </li>
          </ul>
        </div>

        <div className="md-sidebar-footer">
          <div className="md-sidebar-user">
            <div className="md-sidebar-user-avatar">{initials}</div>
            <div className="md-sidebar-user-info">
              <strong>{displayName}</strong>
              <span>{roleName}</span>
            </div>
          </div>
          <button className="md-logout-btn" onClick={handleLogout}>
            <span className="icon">🚪</span>Logout
          </button>
          <small>© 2025 FPTU Event Manager</small>
        </div>
      </aside>

      {/* MAIN */}
      <main className="md-main">
        <div className="md-topbar">
          <div className="md-topbar-left">
            <h1>
              Event Dashboard <span className="badge">Event Manager</span>
            </h1>
            <p>Manage events, registrations and locations at FPT University.</p>
          </div>

          <div className="md-topbar-right">
            <div className="md-search-box">
              <input type="text" placeholder="Search events, locations..." />
              <span className="icon">🔍</span>
            </div>
            <div className="md-topbar-user">
              <div className="md-topbar-user-avatar">{initials}</div>
              <div className="md-topbar-user-info">
                <strong>{displayName}</strong>
                <span>{roleName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARDS */}
        <section>
          <div className="md-cards-row">
            <div className="md-card">
              <div className="md-card-header">
                <span>Upcoming</span>
                <span>⏳</span>
              </div>
              <div className="md-card-main">
                <span>{loadingStats ? "..." : stats.upcomingEvents}</span>
              </div>
            </div>

            <div className="md-card">
              <div className="md-card-header">
                <span>Ongoing</span>
                <span>🟢</span>
              </div>
              <div className="md-card-main">
                <span>{loadingStats ? "..." : stats.ongoingEvents}</span>
              </div>
            </div>

            <div className="md-card">
              <div className="md-card-header">
                <span>Completed</span>
                <span>✅</span>
              </div>
              <div className="md-card-main">
                <span>{loadingStats ? "..." : stats.pastEvents}</span>
              </div>
            </div>

            <div className="md-card">
              <div className="md-card-header">
                <span>Total Registrations</span>
                <span>👥</span>
              </div>
              <div className="md-card-main">
                <span>{loadingStats ? "..." : stats.totalRegistrations}</span>
              </div>
            </div>
          </div>

          {statsError && (
            <p style={{ color: "red", marginTop: 8 }}>{statsError}</p>
          )}

          {/* TABLE + RIGHT COLUMN */}
          <div className="md-content-grid">
            {/* EVENT TABLE */}
            <div className="md-card">
              <div className="md-card-table-header">
                <h2>Events You're Managing</h2>

                <div className="md-filters">
                  <button
                    className={`md-pill ${
                      activeFilter === "all" ? "active" : ""
                    }`}
                    onClick={() => applyFilter("all")}
                  >
                    All
                  </button>

                  <button
                    className={`md-pill ${
                      activeFilter === "upcoming" ? "active" : ""
                    }`}
                    onClick={() => applyFilter("upcoming")}
                  >
                    <span className="dot blue"></span>Upcoming
                  </button>

                  <button
                    className={`md-pill ${
                      activeFilter === "live" ? "active" : ""
                    }`}
                    onClick={() => applyFilter("live")}
                  >
                    <span className="dot"></span>Ongoing
                  </button>

                  <button
                    className={`md-pill ${
                      activeFilter === "done" ? "active" : ""
                    }`}
                    onClick={() => applyFilter("done")}
                  >
                    <span className="dot gray"></span>Completed
                  </button>
                </div>
              </div>

              <div className="md-table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Event Name</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Location</th>
                      <th>Registrations</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {loadingEvents ? (
                      <tr>
                        <td
                          colSpan="6"
                          style={{ padding: 20, textAlign: "center" }}
                        >
                          Loading...
                        </td>
                      </tr>
                    ) : filteredEvents.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          style={{ padding: 20, textAlign: "center" }}
                        >
                          No matching events
                        </td>
                      </tr>
                    ) : (
                      filteredEvents.map((ev) => (
                        <tr key={ev.eventId}>
                          <td>{ev.eventName}</td>
                          <td>
                            {new Date(ev.startTime).toLocaleDateString(
                              "en-US"
                            )}
                            {" → "}
                            {new Date(ev.endTime).toLocaleDateString("en-US")}
                          </td>

                          <td>
                            <span
                              className={`md-status-badge ${mapStatusBadge(
                                ev.statusId
                              )}`}
                            >
                              <span className="dot"></span>
                              {ev.status?.statusName}
                            </span>
                          </td>

                          <td>
                            {ev.location?.name ||
                              ev.externalLocation?.name ||
                              "Not specified"}
                          </td>

                          <td>{ev.expectedAttendees ?? 0}</td>

                          <td>
                            <button className="md-btn-link">
                              View details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="md-side-column">
              <div className="md-card">
                <div className="md-card-header">
                  <span className="md-card-title">Event Calendar</span>
                  <span className="md-card-subtitle">November / 2025</span>
                </div>

                <div className="md-calendar-grid">
                  <div className="md-calendar-day-name">Mon</div>
                  <div className="md-calendar-day-name">Tue</div>
                  <div className="md-calendar-day-name">Wed</div>
                  <div className="md-calendar-day-name">Thu</div>
                  <div className="md-calendar-day-name">Fri</div>
                  <div className="md-calendar-day-name">Sat</div>
                  <div className="md-calendar-day-name">Sun</div>

                  <div></div>
                  <div></div>
                  <div></div>
                  <div className="md-calendar-day">1</div>
                  <div className="md-calendar-day">2</div>
                  <div className="md-calendar-day">3</div>
                  <div className="md-calendar-day">4</div>

                  <div className="md-calendar-day">5</div>
                  <div className="md-calendar-day">6</div>
                  <div className="md-calendar-day">7</div>
                  <div className="md-calendar-day">8</div>
                  <div className="md-calendar-day">9</div>
                  <div className="md-calendar-day">10</div>
                  <div className="md-calendar-day">11</div>

                  <div className="md-calendar-day has-event">12</div>
                  <div className="md-calendar-day">13</div>
                  <div className="md-calendar-day">14</div>
                  <div className="md-calendar-day">15</div>
                  <div className="md-calendar-day">16</div>
                  <div className="md-calendar-day today">17</div>
                  <div className="md-calendar-day">18</div>

                  <div className="md-calendar-day has-event">19</div>
                  <div className="md-calendar-day has-event">20</div>
                  <div className="md-calendar-day">21</div>
                  <div className="md-calendar-day has-event">22</div>
                  <div className="md-calendar-day">23</div>
                  <div className="md-calendar-day">24</div>
                  <div className="md-calendar-day">25</div>

                  <div className="md-calendar-day">26</div>
                  <div className="md-calendar-day">27</div>
                  <div className="md-calendar-day">28</div>
                  <div className="md-calendar-day has-event">29</div>
                  <div className="md-calendar-day">30</div>
                </div>

                <div className="md-campus-pill">
                  <span className="icon">🏫</span>
                  <span>Campuses: Hanoi, HCMC, Danang</span>
                </div>

                <div className="md-mini-list">
                  <div className="md-mini-list-item">
                    <strong>FPTU Tech Summit</strong>
                    <span>20/11 • Hall F, HCMC</span>
                    <span className="tag">Ongoing</span>
                  </div>
                  <div className="md-mini-list-item">
                    <strong>Music Night - Acoustic Vibes</strong>
                    <span>25/11 • Sky Yard, HCMC</span>
                    <span className="tag">Upcoming</span>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="md-card">
                <div className="md-card-header">
                  <span className="md-card-title">Quick Actions</span>
                  <span className="md-card-subtitle">
                    Speed up your workflow
                  </span>
                </div>

                <div className="md-quick-actions">
                  <button
                    className="md-btn-primary"
                    onClick={() => navigate("/manager/events/create")}
                  >
                    <span className="icon">➕</span>
                    <span>Create new event</span>
                  </button>

                  <button className="md-btn-ghost">
                    <span className="icon">📤</span>
                    <span>Export registrations (.xlsx)</span>
                  </button>

                  <button className="md-btn-ghost">
                    <span className="icon">📩</span>
                    <span>Send reminder email</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ManagerDashboard;
  