// src/App.jsx

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import { GOOGLE_CLIENT_ID } from './config/api.config';
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;