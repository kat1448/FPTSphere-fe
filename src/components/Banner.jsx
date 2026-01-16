import React, { useEffect } from "react";
import "../assets/css/banner.css";
import AOS from "aos";
import "aos/dist/aos.css";
import { ArrowRight } from "lucide-react"; 

const Banner = () => {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  return (
    <section className="banner">
      <div className="banner-overlay"></div>
      <div className="banner-content" data-aos="fade-up">
        <h1 data-aos="fade-up" data-aos-delay="100">
          Empower Your Events with <span>FPTSphere</span>
        </h1>
        <p data-aos="fade-up" data-aos-delay="200">
          Streamline planning, connect your attendees, and create unforgettable experiences.
        </p>
        <div className="buttons" data-aos="fade-up" data-aos-delay="300">
          <button className="btn-primary">
            Get Started <ArrowRight size={18} className="inline-block ml-2" />
          </button>
          <button className="btn-outline">Create Event</button>
        </div>
      </div>
    </section>
  );
};

export default Banner;
