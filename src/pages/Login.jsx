import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";
import "../assets/css/login.css";
import logo from "../assets/images/logo.jpg";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  /**
   * Handle Google Login Success
   * Auto-approve all Google users (no authorization check)
   */
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");

    try {
      console.log("🔐 Google credential received");

      const idToken = credentialResponse.credential;

      if (!idToken) {
        throw new Error("No credential received from Google");
      }

      console.log("✅ ID Token received, authenticating with backend...");

      const result = await login(idToken);

      if (result.success) {
        console.log("✅ Login successful:", result.user);
        console.log("👤 User role:", result.user.roleName);

        // ⭐ AUTO-APPROVE: Skip authorization check
        // All Google users are automatically approved

        // Set flag for showing success message on home page
        localStorage.setItem("justLoggedIn", "true");
        localStorage.setItem("loginUserName", result.user.fullName);

        // Determine redirect path based on role
        let redirectPath;

        if (result.user.roleName === "Admin") {
          redirectPath = "/admin/dashboard";
        } else if (result.user.roleName === "Event Manager") {
          redirectPath = "/manager/dashboard";
        } else if (result.user.roleName === "Director") {
          redirectPath = "/director/dashboard";
        } else if (result.user.roleName === "Staff") {
          redirectPath = "/staff/dashboard";
        } else {
          // Students and other users go to home page
          redirectPath = "/";
        }

        // Redirect immediately
        navigate(redirectPath);
      }
    } catch (error) {
      console.error("❌ Google login error:", error);

      // User-friendly error messages
      if (error.message.includes("not found in database")) {
        setError(
          "❌ This Google account is not registered in our system. Please contact the administrator to get access."
        );
      } else {
        setError(
          error.message || "Failed to login with Google. Please try again."
        );
      }
      setLoading(false);
    }
  };

  /**
   * Handle Google Login Error
   */
  const handleGoogleLoginError = (error) => {
    console.error("❌ Google OAuth error:", error);
    setError("Failed to initialize Google login. Please try again.");
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <img src={logo} alt="FPTSphere" className="login-logo" />
          <h2>Welcome to FPTSphere 👋</h2>
          <p>Sign in with your Google account to continue</p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: "1rem",
              marginBottom: "1.5rem",
              background: "linear-gradient(135deg, #fee2e2, #fecaca)",
              border: "2px solid #ef4444",
              borderRadius: "0.75rem",
              color: "#991b1b",
              fontSize: "0.875rem",
              textAlign: "left",
              lineHeight: "1.5",
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
            }}
          >
            {error}
          </div>
        )}

        {/* Google Login Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
            marginTop: "2rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              opacity: loading ? 0.6 : 1,
              pointerEvents: loading ? "none" : "auto",
              width: "100%",
            }}
          >
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={handleGoogleLoginError}
              useOneTap={false}
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
              width="384"
            />
          </div>

          {loading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "#2563eb",
                fontSize: "0.875rem",
                fontWeight: "600",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "16px",
                  height: "16px",
                  border: "2px solid #dbeafe",
                  borderTop: "2px solid #2563eb",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Signing in with Google...
            </div>
          )}
        </div>

        {/* Info section */}
        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            backgroundColor: "#f0f9ff",
            border: "1px solid #bfdbfe",
            borderRadius: "0.75rem",
            fontSize: "0.875rem",
            color: "#1e40af",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>🔒</span>
            <span>Secure authentication powered by Google</span>
          </p>
        </div>
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes slideDown {
            0% { 
              opacity: 0; 
              transform: translateY(-10px); 
            }
            100% { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
        `}
      </style>
    </div>
  );
};

export default Login;
