import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

/**
 * Protected Route Component
 * Checks if user is authenticated and optionally if they have required role
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  // Check if user is authenticated
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    // Not logged in, redirect to login page
    console.log('❌ Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // If no specific role required, just check authentication
  if (!requiredRole) {
    console.log('✅ Authenticated, no role required');
    return children;
  }

  // Check if user has required role
  const userRole = authService.getUserRole();
  
  if (userRole !== requiredRole) {
    // User doesn't have required role, redirect to their appropriate dashboard
    console.log(`❌ User role "${userRole}" does not match required role "${requiredRole}"`);
    
    // Redirect based on actual role
    if (userRole === 'Admin') {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === 'Event Manager') {
      return <Navigate to="/manager/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // User is authenticated and has correct role
  console.log(`✅ User has required role: ${requiredRole}`);
  return children;
};

export default ProtectedRoute;