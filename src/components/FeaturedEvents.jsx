import React from "react";
import "../assets/css/featured-events.css";
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";
import talkshowImg from "../assets/images/talkshow-event.jpg";
import voluntaryImg from "../assets/images/voluntary-event.png";
import musicImg from "../assets/images/music-event.jpg";
const events = [
  {
    title: "FPT Tech Fair 2025",
    desc: "Showcasing cutting-edge innovations by FPT students and industry experts.",
    image: talkshowImg,
  },
  {
    title: "Green Summer 2025",
    desc: "Join hands in volunteer activities that make a positive impact on the community.",
    image: voluntaryImg,
  },
  {
    title: "Cultural Festival",
    desc: "Celebrate diversity with music, dance, and traditional performances.",
    image: musicImg,
  },
];

const FeaturedEvents = () => {
  useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);

  return (
    <section className="featured-events">
      <div className="container mx-auto px-6 py-16">
        <h2 className="section-title" data-aos="fade-up">Featured Events</h2>
        <div className="events-grid">
          {events.map((e, i) => (
            <div
              key={i}
              className="event-card"
              style={{ backgroundImage: `url(${e.image})` }}
              data-aos="fade-up"
              data-aos-delay={i * 150}
            >
              <div className="overlay"></div>
              <div className="event-info">
                <h3>{e.title}</h3>
                <p>{e.desc}</p>
                <button className="btn-explore">Explore</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedEvents;
