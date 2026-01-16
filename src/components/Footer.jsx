import React from "react";
import "../assets/css/footer.css";
import {
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Brand Section */}
        <div className="footer-section brand">
          <h2 className="footer-logo">FPT<span>Sphere</span></h2>
          <p className="footer-desc">
            Empowering students to create, connect, and celebrate through impactful events.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/event">Events</a></li>
            <li><a href="/feature">Features</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="footer-section">
          <h3>Contact Us</h3>
          <ul className="contact-info">
            <li><Mail size={18} /> events@fpt.edu.vn</li>
            <li><Phone size={18} /> +84 987 654 321</li>
            <li><MapPin size={18} /> FPT University, Da Nang</li>
          </ul>
        </div>

        {/* Social Media */}
        <div className="footer-section">
          <h3>Follow Us</h3>
          <div className="social-icons">
            <a href="#"><Facebook /></a>
            <a href="#"><Instagram /></a>
            <a href="#"><Linkedin /></a>
            <a href="#"><Youtube /></a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} FPTSphere. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
