import React, { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getDashboardPath, hasRoleAccess, getRoleIdByName } from "../utils/roleUtils";
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  MapPin,
  Users,
  UserCog,
  BarChart3,
  LogOut,
  Search,
  User,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import "../assets/css/console-layout.css";

export default function ConsoleLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const displayName = user?.fullName || "User";
  const roleName = user?.roleName || "User";
  const roleId = user?.roleId || null;

  const initials = useMemo(() => {
    const name = (displayName || "").trim();
    if (!name) return "U";
    const parts = name.split(/\s+/);
    return parts.map((p) => (p[0] || "").toUpperCase()).join("").slice(0, 2);
  }, [displayName]);

  // ✅ Nav theo roleId và roleName
  // Role IDs: 1=Admin, 2=Director, 3=Event Manager, 4=Staff, 5=Student
  const navItems = useMemo(() => {
    // Normalize roleId to number
    const normalizedRoleId = roleId ? Number(roleId) : (roleName ? getRoleIdByName(roleName) : null);

    // Phân quyền theo roleId:
    // - Admin (1): Chỉnh sửa User, các trang khác chỉ xem
    // - Director (2): Full quyền
    // - Event Manager (3): Tạo Event, Subevent, Assign cho staff
    // - Staff (4): Tạo nội dung subevent được assign
    
    const items = [
      // Dashboard - tất cả đều có quyền xem
      { 
        to: normalizedRoleId === 1 || roleName === "Admin" 
          ? "/admin/dashboard" 
          : normalizedRoleId === 4 || roleName === "Staff" 
          ? "/staff/dashboard" 
          : "/manager/dashboard", 
        label: "Dashboard", 
        icon: LayoutDashboard, 
        allowedRoleIds: [1, 2, 3, 4] // Tất cả roles đều có quyền
      },

      // Events - Admin (xem), Director (full), Event Manager (full), Staff (xem)
      { 
        to: "/manager/events", 
        label: "Events", 
        icon: Calendar, 
        allowedRoleIds: [1, 2, 3, 4],
        disabled: true // Disabled vì route này không tồn tại hoặc không hoạt động
      },
      
      // Create Event - Director (full), Event Manager (full)
      { 
        to: "/manager/events/create", 
        label: "Create Event", 
        icon: PlusCircle, 
        allowedRoleIds: [2, 3] // Chỉ Director và Event Manager
      },

      // Locations - Admin (xem), Director (full), Event Manager (xem only) - Staff KHÔNG có quyền
      { 
        to: "/manager/locations", 
        label: "Locations", 
        icon: MapPin, 
        allowedRoleIds: [1, 2, 3] // Loại bỏ Staff (4)
      },
      
      // Resources - Admin (xem), Director (full), Event Manager (xem only) - Staff KHÔNG có quyền
      { 
        to: "/manager/resources", 
        label: "Resources", 
        icon: Package, 
        allowedRoleIds: [1, 2, 3] // Loại bỏ Staff (4)
      },
      
      // Participants - Director (full), Staff (full) - Event Manager và Admin KHÔNG có quyền
      { 
        to: "/manager/participants", 
        label: "Participants", 
        icon: Users, 
        allowedRoleIds: [2, 4] // Director và Staff
      },

      // Users - Admin (chỉnh sửa), Director (full)
      { 
        to: "/admin/users", 
        label: "Users", 
        icon: UserCog, 
        allowedRoleIds: [1, 2]
      },
      
      // Reports - Admin (xem), Director (full) - Staff KHÔNG có quyền
      { 
        to: "/admin/reports", 
        label: "Reports", 
        icon: BarChart3, 
        allowedRoleIds: [1, 2] // Loại bỏ Staff (4)
      },
    ];

    // Check access for each item
    return items.map(item => ({
      ...item,
      hasAccess: normalizedRoleId ? hasRoleAccess(normalizedRoleId, item.allowedRoleIds) : false
    }));
  }, [roleId, roleName]);

  const pageTitle = useMemo(() => {
    // map đơn giản theo URL
    if (location.pathname.includes("/events/create")) return "Create Event";
    if (location.pathname.includes("/events")) return "Events";
    if (location.pathname.includes("/locations")) return "Locations";
    if (location.pathname.includes("/resources")) return "Resources";
    if (location.pathname.includes("/participants")) return "Participants";
    if (location.pathname.includes("/users")) return "Users";
    if (location.pathname.includes("/reports")) return "Reports";
    return "Dashboard";
  }, [location.pathname]);

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="console">
      {/* SIDEBAR */}
      <aside className={`console-sidebar ${isCollapsed ? "collapsed" : ""}`}>
        <div className="console-sidebar-header">
          <button
            className="console-brand"
            onClick={() => navigate(getDashboardPath(roleId, roleName))}
            type="button"
          >
            <div className="console-brand-logo">F</div>
            {!isCollapsed && (
              <div className="console-brand-text">
                <div className="console-brand-name">FPTU Events</div>
                <div className="console-brand-sub">{roleName} Console</div>
              </div>
            )}
          </button>
        </div>

        {!isCollapsed && <div className="console-section-title">MAIN</div>}
        <nav className="console-nav">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const hasAccess = item.hasAccess;
            const isDisabled = item.disabled || !hasAccess;
            
            // Fix: Use end prop to match exact path, prevent "/events/create" from matching "/events"
            const isExactMatch = item.to === "/manager/events" || item.to === "/admin/dashboard" || item.to === "/staff/dashboard" || item.to === "/manager/dashboard";
            
            // Special handling for Events: should be active when on sub-events or event detail pages
            const isEventsItem = item.to === "/manager/events";
            const isOnEventsPage = location.pathname.includes("/events") && !location.pathname.includes("/events/create");
            
            // Disabled item (no access or explicitly disabled)
            if (isDisabled) {
              const tooltipText = !hasAccess 
                ? "unauthorized"
                : item.label;
              
              return (
                <div
                  key={item.to}
                  className={`console-nav-item ${isOnEventsPage && isEventsItem ? "active" : ""}`}
                  style={{ 
                    cursor: "not-allowed", 
                    opacity: 0.5,
                    pointerEvents: "none"
                  }}
                  title={tooltipText}
                >
                  <span className="console-nav-icon" style={{ opacity: 0.5 }}>
                    <IconComponent size={20} strokeWidth={2} />
                  </span>
                  {!isCollapsed && (
                    <span className="console-nav-label" style={{ opacity: 0.5 }}>
                      {item.label}
                    </span>
                  )}
                </div>
              );
            }
            
            // Enabled item with access
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={isExactMatch}
                className={({ isActive }) => {
                  return `console-nav-item ${isActive ? "active" : ""}`;
                }}
                title={isCollapsed ? item.label : item.label}
              >
                <span className="console-nav-icon">
                  <IconComponent size={20} strokeWidth={2} />
                </span>
                {!isCollapsed && <span className="console-nav-label">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="console-footer">
          {/* {!isCollapsed && (
            <div className="console-user-card">
              <div className="console-avatar">{initials}</div>
              <div className="console-user-meta">
                <div className="console-user-name">{displayName}</div>
                <div className="console-user-role">{roleName}</div>
              </div>
            </div>
          )}

          <button 
            className="console-logout" 
            onClick={onLogout} 
            type="button"
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut size={18} strokeWidth={2} />
            {!isCollapsed && <span>Logout</span>}
          </button> */}

          {!isCollapsed && (
            <div className="console-copyright">© 2025 FPTU Events</div>
          )}

          <button
            className="console-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            type="button"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Minimize sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight size={18} strokeWidth={2} />
            ) : (
              <>
                <ChevronLeft size={18} strokeWidth={2} />
                {!isCollapsed && <span className="console-toggle-text">Minimize</span>}
              </>
            )}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="console-main">
        {/* TOPBAR */}
        <header className="console-topbar">
          <div className="console-topbar-left">
            <div className="console-title">{pageTitle}</div>
            <div className="console-subtitle">Workspace for Admin / Staff / Event Manager</div>
          </div>

          <div className="console-topbar-right">
            <div className="console-search">
              <span className="console-search-icon">
                <Search size={18} strokeWidth={2} />
              </span>
              <input placeholder="Search…" />
            </div>

            {/* Chỉ Director và Event Manager có quyền tạo event */}
            {(roleId === 2 || roleId === 3 || roleName === "Director" || roleName === "Event Manager") && (
              <button
                className="console-btn console-btn-primary"
                type="button"
                onClick={() => navigate("/manager/events/create")}
              >
                <PlusCircle size={18} strokeWidth={2} />
                <span>Tạo sự kiện</span>
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
              <span className="console-caret">
                <ChevronDown size={16} strokeWidth={2} />
              </span>
            </button>

            {openUserMenu && (
              <div className="console-menu" onMouseLeave={() => setOpenUserMenu(false)}>
                <button className="console-menu-item" type="button" onClick={() => navigate("/profile")}>
                  <User size={18} strokeWidth={2} />
                  <span>Profile</span>
                </button>
                <button className="console-menu-item" type="button" onClick={onLogout}>
                  <LogOut size={18} strokeWidth={2} />
                  <span>Logout</span>
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
