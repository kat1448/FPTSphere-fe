import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import PublicLayout from "./layouts/PublicLayout";
import ConsoleLayout from "./layouts/ConsoleLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/HomePage";
import Login from "./pages/Login";
import Event from "./pages/Events";
import EventDetail from "./pages/EventDetail";

import AdminDashboard from "./pages/Admin/AdminDashboard";
import ManagerDashboard from "./pages/EventManager/ManagerDashboard";
import CreateEventWizard from "./pages/EventManager/CreateEventWizard";
// import StaffDashboard from "./pages/Staff/StaffDashboard";

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Router>
        <Routes>
          {/* ===== PUBLIC ===== */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/event" element={<Event />} />
            <Route path="/events/:id" element={<EventDetail />} />
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
            {/* <Route path="/staff/dashboard" element={<StaffDashboard />} /> */}
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
