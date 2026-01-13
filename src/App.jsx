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
import Features from "./pages/Features";
import About from "./pages/About";
import Contact from "./pages/Contact";

import EventHistory from "./pages/EventHistory";

import AdminDashboard from "./pages/Admin/AdminDashboard";
import SubEventOperations from "./pages/Admin/SubEventOperations";
import ViewDetailSubEvent from "./pages/Admin/ViewDetailSubEvent";
import SubEventGallery from "./pages/Admin/SubEventGallery";
import SubEventFeedback from "./pages/Admin/SubEventFeedback";
import EmailEditor from "./pages/Admin/EmailEditor";
import FormBuilder from "./pages/Admin/FormBuilder";
import StakeholderFeedbackEmail from "./pages/Admin/StakeholderFeedbackEmail";
import ManagerDashboard from "./pages/EventManager/ManagerDashboard";
import CreateEventWizard from "./pages/EventManager/create-event/CreateEventWizard";
import StaffDashboard from "./pages/Staff/StaffDashboard";
import Locations from "./pages/Locations/Locations";
import Resources from "./pages/Resources/Resources";
import Participants from "./pages/Participants/Participants";
import Users from "./pages/Users/Users";
import Reports from "./pages/Reports/Reports";
import Forbidden403 from "./pages/Errors/Forbidden403";

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
              <Route path="/feature" element={<Features />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/event-history" element={<EventHistory />} />
            </Route>

            {/* ===== CONSOLE (Admin/Staff/EM dùng chung template) ===== */}
            <Route
              element={
                <ProtectedRoute allowedRoleIds={[1, 2, 3, 4]}>
                  <ConsoleLayout />
                </ProtectedRoute>
              }
            >
              {/* Admin Dashboard - Admin (1), Director (2) */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute allowedRoleIds={[1, 2]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Users Management - Admin (1), Director (2) - Chỉnh sửa User */}
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute allowedRoleIds={[1, 2]}>
                    <Users />
                  </ProtectedRoute>
                } 
              />

              {/* Reports - Admin (1), Director (2) - Staff KHÔNG có quyền */}
              <Route 
                path="/admin/reports" 
                element={
                  <ProtectedRoute allowedRoleIds={[1, 2]}>
                    <Reports />
                  </ProtectedRoute>
                } 
              />

              {/* Sub-events Operations - Admin (1), Director (2), Event Manager (3), Staff (4) */}
              <Route 
                path="/admin/events/:eventId/sub-events" 
                element={
                  <ProtectedRoute allowedRoleIds={[1, 2, 3, 4]}>
                    <SubEventOperations />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/events/:eventId/sub-events/:subEventId/detail" 
                element={
                  <ProtectedRoute allowedRoleIds={[1, 2, 3, 4]}>
                    <ViewDetailSubEvent />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/events/:eventId/sub-events/:subEventId/gallery" 
                element={
                  <ProtectedRoute allowedRoleIds={[1, 2, 3, 4]}>
                    <SubEventGallery />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/events/:eventId/sub-events/:subEventId/feedback" 
                element={
                  <ProtectedRoute allowedRoleIds={[1, 2, 3, 4]}>
                    <SubEventFeedback />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/events/:eventId/sub-events/:subEventId/email-editor" 
                element={
                  <ProtectedRoute allowedRoleIds={[1, 2, 3, 4]}>
                    <EmailEditor />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/events/:eventId/sub-events/:subEventId/form-builder" 
                element={
                  <ProtectedRoute allowedRoleIds={[1, 2, 3, 4]}>
                    <FormBuilder />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/events/:eventId/sub-events/:subEventId/stakeholder-feedback" 
                element={
                  <ProtectedRoute allowedRoleIds={[1, 2, 3, 4]}>
                    <StakeholderFeedbackEmail />
                  </ProtectedRoute>
                } 
              />

              {/* Manager Dashboard - Event Manager (3), Director (2) */}
              <Route 
                path="/manager/dashboard" 
                element={
                  <ProtectedRoute allowedRoleIds={[2, 3]}>
                    <ManagerDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Create Event - Event Manager (3), Director (2) */}
              <Route 
                path="/manager/events/create" 
                element={
                  <ProtectedRoute allowedRoleIds={[2, 3]}>
                    <CreateEventWizard />
                  </ProtectedRoute>
                } 
              />

              {/* Locations - Admin (1), Director (2), Event Manager (3 - xem only) - Staff KHÔNG có quyền */}
              <Route 
                path="/manager/locations" 
                element={
                  <ProtectedRoute allowedRoleIds={[1, 2, 3]}>
                    <Locations />
                  </ProtectedRoute>
                } 
              />

              {/* Resources - Admin (1), Director (2), Event Manager (3 - xem only) - Staff KHÔNG có quyền */}
              <Route 
                path="/manager/resources" 
                element={
                  <ProtectedRoute allowedRoleIds={[1, 2, 3]}>
                    <Resources />
                  </ProtectedRoute>
                } 
              />

              {/* Participants - Director (2), Staff (4) - Event Manager và Admin KHÔNG có quyền */}
              <Route 
                path="/manager/participants" 
                element={
                  <ProtectedRoute allowedRoleIds={[2, 4]}>
                    <Participants />
                  </ProtectedRoute>
                } 
              />

              {/* Staff Dashboard - Staff (4), Director (2) */}
              <Route 
                path="/staff/dashboard" 
                element={
                  <ProtectedRoute allowedRoleIds={[2, 4]}>
                    <StaffDashboard />
                  </ProtectedRoute>
                } 
              />
            </Route>

            {/* 403 Forbidden Page */}
            <Route path="/403" element={<Forbidden403 />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
