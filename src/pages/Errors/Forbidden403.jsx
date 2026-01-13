import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "antd";
import { LockOutlined, HomeOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useAuth } from "../../contexts/AuthContext";
import { getDashboardPath } from "../../utils/roleUtils";

const Forbidden403 = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const roleName = user?.roleName || "User";
  const roleId = user?.roleId;
  
  // Xác định dashboard dựa trên role
  const dashboardPath = getDashboardPath(roleId, roleName);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "60px 40px",
          maxWidth: "600px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div
          style={{
            fontSize: "120px",
            color: "#ff4d4f",
            marginBottom: "20px",
            lineHeight: "1",
          }}
        >
          <LockOutlined />
        </div>
        
        <h1
          style={{
            fontSize: "48px",
            fontWeight: "bold",
            color: "#1a1a1a",
            marginBottom: "16px",
            marginTop: "0",
          }}
        >
          403
        </h1>
        
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "600",
            color: "#595959",
            marginBottom: "16px",
            marginTop: "0",
          }}
        >
          Truy cập bị từ chối
        </h2>
        
        <p
          style={{
            fontSize: "16px",
            color: "#8c8c8c",
            lineHeight: "1.6",
            marginBottom: "32px",
          }}
        >
          Xin lỗi, bạn không có quyền truy cập vào trang này.
          <br />
          Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Button
            type="primary"
            size="large"
            icon={<HomeOutlined />}
            onClick={() => navigate(dashboardPath)}
            style={{
              height: "48px",
              paddingLeft: "24px",
              paddingRight: "24px",
              fontSize: "16px",
              fontWeight: "500",
            }}
          >
            Về trang chủ
          </Button>
          
          <Button
            size="large"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{
              height: "48px",
              paddingLeft: "24px",
              paddingRight: "24px",
              fontSize: "16px",
            }}
          >
            Quay lại
          </Button>
        </div>

        <div
          style={{
            marginTop: "40px",
            paddingTop: "24px",
            borderTop: "1px solid #f0f0f0",
            fontSize: "14px",
            color: "#8c8c8c",
          }}
        >
          <p style={{ margin: "0 0 8px 0" }}>
            <strong>Vai trò hiện tại:</strong> {roleName}
            {roleId && ` (ID: ${roleId})`}
          </p>
          <p style={{ margin: "0" }}>
            Nếu bạn cần quyền truy cập, vui lòng liên hệ quản trị viên hệ thống.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Forbidden403;
