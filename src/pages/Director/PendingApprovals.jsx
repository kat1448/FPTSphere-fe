import { useNavigate } from "react-router-dom";

const PendingApprovals = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "60vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "40px"
    }}>
      <div style={{ fontSize: "64px", marginBottom: "20px" }}>📋</div>
      <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", marginBottom: "12px" }}>
        Pending Approvals
      </h1>
      <p style={{ fontSize: "16px", color: "#64748b", marginBottom: "24px" }}>
        This page is under development. You'll be able to review and approve/reject events here.
      </p>
      <button
        onClick={() => navigate("/director/dashboard")}
        style={{
          padding: "12px 24px",
          background: "#4f46e5",
          color: "white",
          border: "none",
          borderRadius: "10px",
          fontSize: "15px",
          fontWeight: "700",
          cursor: "pointer"
        }}
      >
        ← Back to Dashboard
      </button>
    </div>
  );
};

export default PendingApprovals;