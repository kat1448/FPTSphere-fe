// src/pages/HomePage.jsx

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header";
import Banner from "../components/Banner";
import Footer from "../components/Footer";
import Testimonials from "../components/Testimonials";
import Introduction from "../components/Introduction";
import FeaturedEvents from "../components/FeaturedEvents";
import UpcomingEvents from "../components/UpcomingEvents";

const HomePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();

  // Optional: Nếu muốn force login trước khi xem home
  // Bỏ comment dòng dưới nếu muốn bắt buộc login
  /*
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);
  */

  // Show loading khi đang check auth
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '20px'
      }}>
        Loading...
      </div>
    );
  }

  // Log user info nếu đã login (for debugging)
  if (user) {
    console.log('👤 Current User:', user);
  }

  return (
    <>
      {/* Header sẽ tự động hiển thị user info nếu đã login */}
      <Banner />
      <Introduction />
      <FeaturedEvents />
      <UpcomingEvents />
      <Testimonials />
      <Footer />
    </>
  );
};

export default HomePage;