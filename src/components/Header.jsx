import React, { useState } from "react";
import "../assets/css/header.css";
import logo from "../assets/images/logo.jpg";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate("/");
  };

  const handleDashboardClick = () => {
    console.log("Current Role:", user?.roleName);

    if (user?.roleName === "Admin") {
      navigate("/admin/dashboard");
    } else if (user?.roleName === "Event Manager") {
      navigate("/manager/dashboard");
    } else if (user?.roleName === "Staff") {
      navigate("/staff/dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <header className="header">
      <div className="container">
        <div className="logo-section">
          <img src={logo} alt="FPTSphere Logo" className="logo" />
          <h1>FPTSphere</h1>
        </div>

        <nav className={`nav ${isOpen ? "open" : ""}`}>
          <ul>
            <li>
              <Link to="/" onClick={() => setIsOpen(false)}>Home</Link>
            </li>
            <li>
              <Link to="/event" onClick={() => setIsOpen(false)}>Events</Link>
            </li>
            <li>
              <Link to="/feature" onClick={() => setIsOpen(false)}>Features</Link>
            </li>
            <li>
              <Link to="/about" onClick={() => setIsOpen(false)}>About</Link>
            </li>
            <li>
              <Link to="/contact" onClick={() => setIsOpen(false)}>Contact</Link>
            </li>
            {user?.roleName === "Event Manager" && (
              <li>
                <Link to="/manager/events/create" onClick={() => setIsOpen(false)}>Create Event</Link>
              </li>
            )}
            {user?.roleName === "Student" && (
              <li>
                <Link to="/event-history" onClick={() => setIsOpen(false)}>Event History</Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="right-section">
          {user ? (
            // Logged in: Show user name + logout
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <div className="user-info-btn" onClick={handleDashboardClick}>
                <span style={{ fontSize: "1.2rem" }}></span>
                <span className="user-name">{user.fullName}</span>
              </div>
              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </div>
          ) : (
            // Not logged in: Show sign in button
            <Link to="/login" className="btn-login">
              Sign In
            </Link>
          )}

          <div
            className={`hamburger ${isOpen ? "active" : ""}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
