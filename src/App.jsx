import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/HomePage";
import Login from "./pages/Login";
import Event from "./pages/Events";
import EventDetail from './pages/EventDetail';

// Dashboard imports (create these files)
import AdminDashboard from './pages/Admin/AdminDashboard';
import ManagerDashboard from './pages/EventManager/ManagerDashboard';

// Protected Route wrapper
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  // Get Google Client ID from environment variables
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Check if Google Client ID is configured
  if (!googleClientId) {
    console.error('❌ VITE_GOOGLE_CLIENT_ID is not configured in .env file');
    console.error('Please add VITE_GOOGLE_CLIENT_ID to your .env file');
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Router>
        <Header />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/event" element={<Event />} />
          <Route path="/events/:id" element={<EventDetail />} />

          {/* Protected routes - Admin only */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute requiredRole="Admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Protected routes - Manager only */}
          <Route 
            path="/manager/dashboard" 
            element={
              <ProtectedRoute requiredRole="Manager">
                <ManagerDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;