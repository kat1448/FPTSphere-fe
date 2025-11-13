import React, { useState } from "react";
import "../assets/css/header.css";
import logo from "../assets/images/logo.jpg"; 
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
      logout();
      setIsOpen(false);
      navigate('/login');
    }
  };

  return (
    <header className="header">
      <div className="container">
        <div className="logo-section">
          <img src={logo} alt="FPTSphere Logo" className="logo" />
          <h1>FPTSphere</h1>
        </div>

        {/* Navigation */}
        <nav className={`nav ${isOpen ? "open" : ""}`}>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/event">Events</a></li>
            <li><a href="#">Features</a></li>
            <li><a href="#">About</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </nav>

        {/* Right section - Auth */}
        <div className="right-section">
          {isAuthenticated && user ? (
            <div className="user-info">
              <span className="user-greeting">👋</span>
              <span className="user-name">{user.fullName}</span>
              <span className="user-role">({user.roleName})</span>
              <button onClick={handleLogout} className="btn-logout">
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-login">
              Sign In
            </Link>
          )}
          
          <div className={`hamburger ${isOpen ? "active" : ""}`}
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