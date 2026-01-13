import React from "react";
import "../assets/css/testimonials.css";
import avatarImg from "../assets/images/avatar-sample.jpg";

const data = [
  {
    img: avatarImg,
    name: "Jane Doe",
    role: "Event Planner, XYZ Inc",
    quote: "This platform helped us manage our event smoothly and engage our audience like never before.",
  },
  {
    img: avatarImg,
    name: "John Smith",
    role: "Marketing Head, ABC Corp",
    quote: "The ticketing and analytics features were game changers for our conference.",
  },
  {
    img: avatarImg,
    name: "Alice Johnson",
    role: "Coordinator, Global Meetup",
    quote: "We saved hours in setup and focused more on content, thanks to the seamless workflows.",
  },
];

const Testimonials = () => {
  return (
    <section className="testimonials">
      <div className="inner">
        <h2>What Our Clients Say</h2>
        <div className="grid">
          {data.map((d, i) => (
            <div key={i} className="card">
              <div className="quote-mark">❝</div>
              <p className="quote">{d.quote}</p>
              <div className="person">
                <img src={d.img} alt={d.name} />
                <div className="info">
                  <p className="name">{d.name}</p>
                  <p className="role">{d.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
