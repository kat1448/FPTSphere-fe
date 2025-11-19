import React, { useState, useEffect } from "react";
import "../assets/css/header.css";
import logo from "../assets/images/logo.jpg"; 
import { Link, useNavigate } from "react-router-dom";
import authService from "../services/authService";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      if (authService.isAuthenticated()) {
        setUser(authService.getCurrentUser());
      } else {
        setUser(null);
      }
    };

    checkAuth();

    window.addEventListener('storage', checkAuth);
  
    window.addEventListener('auth-change', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('auth-change', checkAuth);
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    window.dispatchEvent(new Event('auth-change'));
  };

  const handleDashboardClick = () => {
    if (user?.roleName === "Admin") {
      navigate("/admin/dashboard");
    } else if (user?.roleName === "Manager") {
      navigate("/manager/dashboard");
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
            <li><a href="/">Home</a></li>
            <li><a href="/event">Events</a></li>
            <li><a href="#">Features</a></li>
            <li><a href="#">About</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </nav>

        <div className="right-section">
          {user ? (
            // Logged in: Show user name + logout
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem' 
            }}>
              <div 
                className="user-info-btn"
                onClick={handleDashboardClick}
              >
                <span style={{ fontSize: '1.2rem' }}></span>
                <span className="user-name">
                  {user.fullName}
                </span>
              </div>
              <button 
                onClick={handleLogout}
                className="btn-logout"
              >
                Logout
              </button>
            </div>
          ) : (
            // Not logged in: Show sign in button
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