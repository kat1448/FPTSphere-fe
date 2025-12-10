import { Navigate, useLocation } from "react-router-dom";
import authService from "../services/authService";

const ProtectedRoute = ({ children, allowedRoles, requiredRole }) => {
  const location = useLocation();

  const isAuthenticated = authService.isAuthenticated();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const userRole = authService.getUserRole(); // ví dụ: 'Admin' | 'Staff' | 'Event Manager'

  const rolesToCheck =
    (Array.isArray(allowedRoles) && allowedRoles.length > 0
      ? allowedRoles
      : requiredRole
      ? [requiredRole]
      : null);

  if (!rolesToCheck) return children;

  if (!rolesToCheck.includes(userRole)) {
    if (userRole === "Admin") return <Navigate to="/admin/dashboard" replace />;
    if (userRole === "Event Manager") return <Navigate to="/manager/dashboard" replace />;
    if (userRole === "Staff") return <Navigate to="/staff/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
