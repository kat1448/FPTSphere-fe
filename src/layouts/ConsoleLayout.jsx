import React, { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../assets/css/console-layout.css";

export default function ConsoleLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openUserMenu, setOpenUserMenu] = useState(false);

  const displayName = user?.fullName || "User";
  const roleName = user?.roleName || "User";

  const initials = useMemo(() => {
    const name = (displayName || "").trim();
    if (!name) return "U";
    const parts = name.split(/\s+/);
    return parts
      .map((p) => (p[0] || "").toUpperCase())
      .join("")
      .slice(0, 2);
  }, [displayName]);

  // ✅ Nav theo role (đúng string role bạn dùng: "Event Manager")
  const navItems = useMemo(() => {
    const isAdmin = roleName === "Admin";
    const isStaff = roleName === "Staff";
    const isEM = roleName === "Event Manager";

    const items = [
      {
        to: isAdmin
          ? "/admin/dashboard"
          : isStaff
          ? "/staff/dashboard"
          : "/manager/dashboard",
        label: "Dashboard",
        icon: "📊",
        show: true,
      },

      {
        to: "/manager/events",
        label: "Events",
        icon: "📅",
        show: isAdmin || isStaff || isEM,
      },
      {
        to: "/manager/events/create",
        label: "Create Event",
        icon: "➕",
        show: isAdmin,
      },
      {
        to: "/manager/events/TaskManagement",
        label: "Management Task",
        icon: "➕",
        show: isAdmin || isEM,
      },

      {
        to: "/manager/events/Sub-Event",
        label: "Management Sub-Event",
        icon: "➕",
        show: isAdmin || isEM,
      },

      {
        to: "/manager/locations",
        label: "Locations",
        icon: "📍",
        show: isAdmin || isStaff,
      },
      {
        to: "/manager/participants",
        label: "Participants",
        icon: "👥",
        show: isAdmin || isStaff || isEM,
      },

      { to: "/admin/users", label: "Users", icon: "🧩", show: isAdmin },
      {
        to: "/admin/reports",
        label: "Reports",
        icon: "📈",
        show: isAdmin || isStaff,
      },
      { to: "/admin/settings", label: "Settings", icon: "⚙️", show: isAdmin },
    ];

    return items.filter((x) => x.show);
  }, [roleName]);

  const pageTitle = useMemo(() => {
    // map đơn giản theo URL
    if (location.pathname.includes("/events/create")) return "Create Event";
    if (location.pathname.includes("/events")) return "Events";
    if (location.pathname.includes("/locations")) return "Locations";
    if (location.pathname.includes("/participants")) return "Participants";
    if (location.pathname.includes("/users")) return "Users";
    if (location.pathname.includes("/reports")) return "Reports";
    if (location.pathname.includes("/settings")) return "Settings";
    return "Dashboard";
  }, [location.pathname]);

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="console">
      {/* SIDEBAR */}
      <aside className="console-sidebar">
        <button
          className="console-brand"
          onClick={() =>
            navigate(
              roleName === "Admin"
                ? "/admin/dashboard"
                : roleName === "Staff"
                ? "/staff/dashboard"
                : "/manager/dashboard"
            )
          }
          type="button"
        >
          <div className="console-brand-logo">F</div>
          <div className="console-brand-text">
            <div className="console-brand-name">FPTU Events</div>
            <div className="console-brand-sub">{roleName} Console</div>
          </div>
        </button>

        <div className="console-section-title">MAIN</div>
        <nav className="console-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `console-nav-item ${isActive ? "active" : ""}`
              }
            >
              <span className="console-nav-icon">{item.icon}</span>
              <span className="console-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="console-footer">
          <div className="console-user-card">
            <div className="console-avatar">{initials}</div>
            <div className="console-user-meta">
              <div className="console-user-name">{displayName}</div>
              <div className="console-user-role">{roleName}</div>
            </div>
          </div>

          <button className="console-logout" onClick={onLogout} type="button">
            🚪 Logout
          </button>

          <div className="console-copyright">© 2025 FPTU Events</div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="console-main">
        {/* TOPBAR */}
        <header className="console-topbar">
          <div className="console-topbar-left">
            <div className="console-title">{pageTitle}</div>
            <div className="console-subtitle">
              Workspace for Admin / Staff / Event Manager
            </div>
          </div>

          <div className="console-topbar-right">
            <div className="console-search">
              <span className="console-search-icon">⌕</span>
              <input placeholder="Search…" />
            </div>

            {(roleName === "Admin" || roleName === "Event Manager") && (
              <button
                className="console-btn console-btn-primary"
                type="button"
                onClick={() => navigate("/manager/events/create")}
              >
                + Tạo sự kiện
              </button>
            )}

            <button
              className="console-userbtn"
              type="button"
              onClick={() => setOpenUserMenu((v) => !v)}
            >
              <div className="console-userbtn-avatar">{initials}</div>
              <div className="console-userbtn-text">
                <div className="console-userbtn-name">{displayName}</div>
                <div className="console-userbtn-role">{roleName}</div>
              </div>
              <span className="console-caret">▾</span>
            </button>

            {openUserMenu && (
              <div
                className="console-menu"
                onMouseLeave={() => setOpenUserMenu(false)}
              >
                <button
                  className="console-menu-item"
                  type="button"
                  onClick={() => navigate("/profile")}
                >
                  👤 Profile
                </button>
                <button
                  className="console-menu-item"
                  type="button"
                  onClick={onLogout}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="console-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
