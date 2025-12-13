import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { GoogleOAuthProvider } from "@react-oauth/google";

import PublicLayout from "./layouts/PublicLayout";
import ConsoleLayout from "./layouts/ConsoleLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";

import Home from "./pages/HomePage";
import Login from "./pages/Login";
import Event from "./pages/Events";
import EventDetail from "./pages/EventDetail";

import EventHistory from "./pages/EventHistory";

import AdminDashboard from "./pages/Admin/AdminDashboard";
import ManagerDashboard from "./pages/EventManager/ManagerDashboard";
import CreateEventWizard from "./pages/EventManager/create-event/CreateEventWizard";
import StaffDashboard from "./pages/Staff/StaffDashboard";

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <Router>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            style={{ zIndex: 999999 }}
          />
          <Routes>
            {/* ===== PUBLIC ===== */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/event" element={<Event />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/event-history" element={<EventHistory />} />
            </Route>

            {/* ===== CONSOLE (Admin/Staff/EM dùng chung template) ===== */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["Admin", "Staff", "Event Manager"]}>
                  <ConsoleLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/manager/dashboard" element={<ManagerDashboard />} />
              <Route path="/manager/events/create" element={<CreateEventWizard />} />
              <Route path="/staff/dashboard" element={<StaffDashboard />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
