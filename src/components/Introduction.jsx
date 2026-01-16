import React, { useEffect } from "react";
import "../assets/css/introduction.css";
import AOS from "aos";
import "aos/dist/aos.css";
import campusImage from "../assets/images/fpt-university.jpg"; 

const Introduction = () => {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  return (
    <section className="introduction">
      <div className="intro-container">
        <div className="intro-text" data-aos="fade-right">
          <h2>About FPTSphere</h2>
          <p>
            FPTSphere is an all-in-one event management platform designed for
            FPT University students and clubs. Easily create, promote, and
            manage events — from volunteer campaigns to large-scale festivals.
          </p>
          <p>
            Our mission is to bring students together, nurture creativity, and
            make every campus event more meaningful and memorable.
          </p>
          <button className="learn-more-btn">Learn More</button>
        </div>

        <div className="intro-image" data-aos="fade-left">
          <img src={campusImage} alt="FPT University Event" />
        </div>
      </div>
    </section>
  );
};

export default Introduction;
