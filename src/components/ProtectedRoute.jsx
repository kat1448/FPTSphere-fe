import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Forbidden403 from "../pages/Errors/Forbidden403";

/**
 * ProtectedRoute với phân quyền dựa trên roleId và roleName
 * 
 * @param {Object} props
 * @param {ReactNode} props.children - Component con cần được bảo vệ
 * @param {Array<number>} props.allowedRoleIds - Mảng roleId được phép (1=Admin, 2=Director, 3=Event Manager, 4=Staff, 5=Student)
 * @param {Array<string>} props.allowedRoles - Mảng roleName được phép (fallback nếu không có roleId)
 * @param {number} props.requiredRoleId - RoleId bắt buộc (single)
 * @param {string} props.requiredRole - RoleName bắt buộc (single, fallback)
 */
const ProtectedRoute = ({ 
  children, 
  allowedRoleIds = [], 
  allowedRoles = [],
  requiredRoleId = null,
  requiredRole = null 
}) => {
  const location = useLocation();
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh",
        fontSize: "16px",
        color: "#666"
      }}>
        Đang tải...
      </div>
    );
  }

  // Chưa đăng nhập -> redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Normalize userRoleId to number (handle string "2" -> number 2)
  const userRoleId = user?.roleId ? Number(user.roleId) : null;
  const userRoleName = user?.roleName;

  console.log(`🔐 ProtectedRoute check - Path: ${location.pathname}`);
  console.log(`👤 User - roleId: ${userRoleId} (type: ${typeof userRoleId}), roleName: ${userRoleName}`);
  console.log(`📋 Allowed roleIds:`, allowedRoleIds);
  console.log(`📋 Allowed roles:`, allowedRoles);

  // Xác định roles được phép
  let allowedRoleIdsList = [];
  
  if (allowedRoleIds && allowedRoleIds.length > 0) {
    // Normalize to numbers
    allowedRoleIdsList = allowedRoleIds.map(id => Number(id));
  } else if (requiredRoleId !== null) {
    allowedRoleIdsList = [Number(requiredRoleId)];
  } else if (allowedRoles && allowedRoles.length > 0) {
    // Map roleName to roleId (fallback)
    const roleNameToId = {
      "Admin": 1,
      "Director": 2,
      "Event Manager": 3,
      "Staff": 4,
      "Student": 5
    };
    allowedRoleIdsList = allowedRoles.map(role => roleNameToId[role]).filter(Boolean);
  } else if (requiredRole) {
    const roleNameToId = {
      "Admin": 1,
      "Director": 2,
      "Event Manager": 3,
      "Staff": 4,
      "Student": 5
    };
    allowedRoleIdsList = [roleNameToId[requiredRole]].filter(Boolean);
  }

  console.log(`✅ Normalized allowed roleIds:`, allowedRoleIdsList);

  // Nếu không có yêu cầu quyền cụ thể -> cho phép truy cập
  if (allowedRoleIdsList.length === 0) {
    console.log(`✅ No role restriction, allowing access`);
    return children;
  }

  // Kiểm tra quyền truy cập: Ưu tiên roleId, fallback về roleName
  let hasAccess = false;
  
  if (userRoleId !== null && userRoleId !== undefined) {
    // Check by roleId (priority)
    hasAccess = allowedRoleIdsList.includes(userRoleId);
    console.log(`🔍 Checking by roleId: ${userRoleId} in [${allowedRoleIdsList.join(', ')}] = ${hasAccess}`);
  }
  
  // Fallback: Check by roleName if roleId check failed or roleId is not available
  if (!hasAccess && userRoleName) {
    const roleNameToId = {
      "Admin": 1,
      "Director": 2,
      "Event Manager": 3,
      "Staff": 4,
      "Student": 5
    };
    const mappedRoleId = roleNameToId[userRoleName];
    if (mappedRoleId) {
      hasAccess = allowedRoleIdsList.includes(mappedRoleId);
      console.log(`🔍 Checking by roleName fallback: "${userRoleName}" (mapped to ${mappedRoleId}) in [${allowedRoleIdsList.join(', ')}] = ${hasAccess}`);
    }
  }

  console.log(`🎯 Final access decision: ${hasAccess ? '✅ ALLOWED' : '❌ DENIED'}`);

  // Nếu không có quyền -> hiển thị trang 403
  if (!hasAccess) {
    console.log(`❌ Access denied for ${userRoleName} (roleId: ${userRoleId}) to ${location.pathname}`);
    return <Forbidden403 />;
  }

  return children;
};

export default ProtectedRoute;
