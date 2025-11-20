import React, { useState } from "react";
import "../assets/css/header.css";
import logo from "../assets/images/logo.jpg"; 
import { Link } from "react-router-dom";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

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
            <li><a href="/create-event">Create Event</a></li>
            <li><a href="#">Features</a></li>
            <li><a href="#">About</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </nav>

        {/* Right side */}
        <div className="right-section">
        <Link to="/login" className="btn-login">
                    Sign In
                  </Link> 
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
