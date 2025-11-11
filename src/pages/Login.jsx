// src/pages/Login.jsx

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";
import "../assets/css/login.css";
import logo from "../assets/images/logo.jpg";

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const result = await login(credentialResponse.credential);

      if (result.success) {
        navigate("/");
      } else {
        alert(`Đăng nhập thất bại: ${result.message}`);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại!");
    }
  };

  const handleGoogleError = () => {
    alert("Đăng nhập Google thất bại. Vui lòng thử lại!");
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
      </div>

      <div className="login-container">
        <div className="login-left">
          <div className="brand-section">
            <img src={logo} alt="FPTSphere" className="brand-logo" />
            <h1 className="brand-title">FPTSphere</h1>
            <p className="brand-tagline">Empower Your Events</p>
          </div>
          
          <div className="features-list">
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <div>
                <h3>Smart Event Management</h3>
                <p>Organize events efficiently</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">👥</span>
              <div>
                <h3>Team Collaboration</h3>
                <p>Work together seamlessly</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <div>
                <h3>Analytics & Reports</h3>
                <p>Track your success</p>
              </div>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-card">
            <div className="login-header">
              <h2>Welcome Back! 👋</h2>
              <p>Sign in with your Google account to continue</p>
            </div>

            <div className="google-login-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                theme="outline"
                size="large"
                text="continue_with"
                shape="rectangular"
                logo_alignment="left"
              />
            </div>

            <div className="login-footer">
              <p>🔒 Secure authentication via Google OAuth 2.0</p>
              <p className="note">Only authorized FPT University accounts can access</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;