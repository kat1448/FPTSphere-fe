import React, { useEffect } from "react";
import "../assets/css/upcoming-events.css";
import AOS from "aos";
import "aos/dist/aos.css";

import workshopImg from "../assets/images/ai-talkshow.jpg";
import sportsImg from "../assets/images/football.png";
import TechTalkImg from "../assets/images/techtalk.jpg";

const events = [
  {
    title: "AI Innovation Workshop",
    date: "Nov 10, 2025",
    location: "FPT University Da Nang",
    desc: "A hands-on session for students passionate about Artificial Intelligence.",
    image: workshopImg,
  },
  {
    title: "FPT Sports Week",
    date: "Nov 25, 2025",
    location: "FPTU HCMC Stadium",
    desc: "Join thrilling competitions, build team spirit, and celebrate student sports.",
    image: sportsImg,
  },
  {
    title: "TechTalk: Future of Startups",
    date: "Dec 3, 2025",
    location: "FPT Hanoi Campus - Hall B",
    desc: "Inspiring entrepreneurs share their journeys and future tech trends.",
    image: TechTalkImg,
  },
];

const UpcomingEvents = () => {
  useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);

  return (
    <section className="upcoming-events">
      <div className="container mx-auto px-6 py-16">
        <h2 className="upcoming-title" data-aos="fade-up">
          Upcoming Events
        </h2>
        <p
          className="upcoming-subtitle"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          Don’t miss what’s happening next on campus!
        </p>

        <div className="upcoming-list">
          {events.map((e, i) => (
            <div
              key={i}
              className="upcoming-card"
              data-aos="fade-up"
              data-aos-delay={i * 150}
            >
              <div
                className="upcoming-image"
                style={{ backgroundImage: `url(${e.image})` }}
              ></div>
              <div className="upcoming-content">
                <h3>{e.title}</h3>
                <p className="upcoming-meta">
                  📅 {e.date} | 📍 {e.location}
                </p>
                <p className="upcoming-desc">{e.desc}</p>
                <button className="upcoming-btn">Read more</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UpcomingEvents;
