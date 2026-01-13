import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../contexts/AuthContext";
import { getDashboardPath } from "../utils/roleUtils";
import { Card, Spin, Alert, Typography, Space } from "antd";
import { LockOutlined, SafetyOutlined } from "@ant-design/icons";
import logo from "../assets/images/logo.jpg";

const { Title, Text, Paragraph } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const dashboardPath = getDashboardPath(user.roleId, user.roleName);
      console.log(`🔄 User already logged in, redirecting to: ${dashboardPath}`);
      navigate(dashboardPath, { replace: true });
    }
  }, [isAuthenticated, user, authLoading, navigate]);

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
        console.log("🆔 User roleId:", result.user.roleId);

        // Set flag for showing success message on home page
        localStorage.setItem("justLoggedIn", "true");
        localStorage.setItem("loginUserName", result.user.fullName);

        // Determine redirect path based on roleId (priority) or roleName (fallback)
        const roleId = result.user.roleId;
        const roleName = result.user.roleName;
        const redirectPath = getDashboardPath(roleId, roleName);

        console.log(`🚀 Redirecting to: ${redirectPath} (roleId: ${roleId}, roleName: ${roleName})`);

        // Redirect immediately
        navigate(redirectPath, { replace: true });
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

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="text-center shadow-lg" style={{ borderRadius: "16px", maxWidth: "400px", width: "100%" }}>
          <Spin size="large" style={{ color: "#F2721E" }} />
          <p className="mt-4 text-gray-600">Đang kiểm tra đăng nhập...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card
          className="shadow-2xl border-0"
          style={{
            borderRadius: "20px",
            overflow: "hidden",
          }}
          bodyStyle={{ padding: "3rem 2.5rem" }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src={logo}
                alt="FPTSphere"
                className="w-20 h-20 rounded-2xl shadow-lg"
                style={{ border: "3px solid #F2721E" }}
              />
            </div>
            <Title level={2} style={{ color: "#F2721E", marginBottom: "0.5rem", fontWeight: 700 }}>
              Welcome to FPTSphere 👋
            </Title>
            <Text className="text-gray-600 text-base">
              Sign in with your Google account to continue
            </Text>
          </div>

          {/* Error Message */}
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              onClose={() => setError("")}
              className="mb-6"
              style={{
                borderRadius: "12px",
                border: "1px solid #ffccc7",
              }}
            />
          )}

          {/* Google Login Section */}
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-full flex justify-center"
              style={{
                opacity: loading ? 0.6 : 1,
                pointerEvents: loading ? "none" : "auto",
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
                width="100%"
              />
            </div>

            {loading && (
              <Space className="mt-2">
                <Spin size="small" style={{ color: "#F2721E" }} />
                <Text style={{ color: "#F2721E", fontWeight: 600 }}>
                  Signing in with Google...
                </Text>
              </Space>
            )}
          </div>

          {/* Info section */}
          <div
            className="mt-8 p-4 rounded-xl"
            style={{
              backgroundColor: "#FFF7ED",
              border: "1px solid #FED7AA",
            }}
          >
            <Paragraph
              className="text-center mb-0 flex items-center justify-center gap-2"
              style={{ color: "#C2410C", fontSize: "0.875rem" }}
            >
              <SafetyOutlined style={{ fontSize: "1.2rem", color: "#F2721E" }} />
              <span>Secure authentication powered by Google</span>
            </Paragraph>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <Text className="text-gray-500 text-sm">
            © 2026 FPTSphere. All rights reserved.
          </Text>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        /* Override Google Login Button Styles */
        div[id*="google-login"] {
          width: 100% !important;
        }
        
        div[id*="google-login"] > div {
          width: 100% !important;
          border-radius: 12px !important;
          box-shadow: 0 2px 8px rgba(242, 114, 30, 0.15) !important;
          transition: all 0.3s ease !important;
        }
        
        div[id*="google-login"] > div:hover {
          box-shadow: 0 4px 12px rgba(242, 114, 30, 0.25) !important;
          transform: translateY(-2px) !important;
        }
        
        /* Animation */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .ant-card {
          animation: fadeIn 0.6s ease;
        }
      `}</style>
    </div>
  );
};

export default Login;
