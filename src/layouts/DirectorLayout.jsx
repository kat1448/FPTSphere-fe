import React, { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../assets/css/console-layout.css";

export default function DirectorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openUserMenu, setOpenUserMenu] = useState(false);

  const displayName = user?.fullName || "Director";
  const roleName = user?.roleName || "Director";

  const initials = useMemo(() => {
    const name = (displayName || "").trim();
    if (!name) return "D";
    const parts = name.split(/\s+/);
    return parts
      .map((p) => (p[0] || "").toUpperCase())
      .join("")
      .slice(0, 2);
  }, [displayName]);

  const navItems = [
    {
      to: "/director/dashboard",
      label: "Dashboard",
      icon: "📊",
    },
    {
      to: "/director/events/approvals",
      label: "Pending Approvals",
      icon: "📋",
    },
    {
      to: "/director/events/ongoing",
      label: "Ongoing Events",
      icon: "🟢",
    },
    {
      to: "/director/events/history",
      label: "Event History",
      icon: "📜",
    },
  ];

  const pageTitle = useMemo(() => {
    if (location.pathname.includes("/approvals")) return "Pending Approvals";
    if (location.pathname.includes("/ongoing")) return "Ongoing Events";
    if (location.pathname.includes("/history")) return "Event History";
    return "Dashboard";
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="console">
      {/* SIDEBAR */}
      <aside className="console-sidebar">
        {/* Brand */}
        <button
          className="console-brand"
          onClick={() => navigate("/director/dashboard")}
          type="button"
        >
          <div className="console-brand-logo">F</div>
          <div className="console-brand-text">
            <div className="console-brand-name">FPTSphere</div>
            <div className="console-brand-sub">Director Console</div>
          </div>
        </button>

        {/* Navigation Section */}
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

        {/* Footer */}
        <div className="console-footer">
          <div className="console-user-card">
            <div className="console-avatar">{initials}</div>
            <div className="console-user-meta">
              <div className="console-user-name">{displayName}</div>
              <div className="console-user-role">{roleName}</div>
            </div>
          </div>

          <button
            className="console-logout"
            onClick={handleLogout}
            type="button"
          >
            🚪 Logout
          </button>

          <div className="console-copyright">© 2025 FPTSphere</div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="console-main">
        {/* TOPBAR */}
        <header className="console-topbar">
          <div className="console-topbar-left">
            <div className="console-title">{pageTitle}</div>
            <div className="console-subtitle">Director Workspace</div>
          </div>

          <div className="console-topbar-right">
            {/* Search */}
            <div className="console-search">
              <span className="console-search-icon">⌕</span>
              <input placeholder="Search events..." />
            </div>

            {/* User Menu Button */}
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

            {/* Dropdown Menu */}
            {openUserMenu && (
              <div
                className="console-menu"
                onMouseLeave={() => setOpenUserMenu(false)}
              >
                <button
                  className="console-menu-item"
                  type="button"
                  onClick={() => navigate("/")}
                >
                  🏠 Home
                </button>
                <button
                  className="console-menu-item"
                  type="button"
                  onClick={handleLogout}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="console-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}