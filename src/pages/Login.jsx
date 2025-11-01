import React, { useState } from "react";
import "../assets/css/login.css";
import logo from "../assets/images/logo.jpg";
import googleLogo from "../assets/images/google.png"; 

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [remember, setRemember] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isRegister) {
      if (formData.password !== formData.confirmPassword) {
        alert("Passwords do not match!");
        return;
      }
      console.log("Register Data:", formData);
      // TODO: call API register
    } else {
      console.log("Login Data:", {
        email: formData.email,
        password: formData.password,
        remember,
      });
      // TODO: call API login
    }
  };

  const handleGoogleLogin = () => {
    console.log("Login with Google clicked");
    // TODO: Add Google OAuth logic (Firebase or Google API)
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <img src={logo} alt="FPTSphere" className="login-logo" />
          <h2>{isRegister ? "Create Your Account ✨" : "Welcome Back 👋"}</h2>
          <p>
            {isRegister
              ? "Join FPTSphere and start managing your events effortlessly."
              : "Log in to your FPTSphere account"}
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {isRegister && (
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {isRegister && (
            <div className="input-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          )}

          {!isRegister && (
            <div className="login-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={() => setRemember(!remember)}
                />
                Remember me
              </label>
              <a href="#" className="forgot-password">
                Forgot Password?
              </a>
            </div>
          )}

          <button type="submit" className="login-btn">
            {isRegister ? "Create Account" : "Sign In"}
          </button>

          {!isRegister && (
            <>
              <div className="divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="google-btn"
                onClick={handleGoogleLogin}
              >
                <img src={googleLogo} alt="Google" className="google-icon" />
                Sign in with Google
              </button>
            </>
          )}

          <p className="signup-text">
            {isRegister ? (
              <>
                Already have an account?{" "}
                <a href="#" onClick={() => setIsRegister(false)}>
                  Sign in
                </a>
              </>
            ) : (
              <>
                Don’t have an account?{" "}
                <a href="#" onClick={() => setIsRegister(true)}>
                  Sign up
                </a>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
