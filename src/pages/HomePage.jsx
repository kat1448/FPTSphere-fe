import React from "react";
import Header from "../components/Header";
import Banner from "../components/Banner";
import Footer from "../components/Footer";
import Testimonials from "../components/Testimonials";
import Introduction from "../components/Introduction"
import FeaturedEvents from "../components/FeaturedEvents";
import UpcomingEvents from "../components/UpcomingEvents";


const HomePage = () => {
  return (
    <>
      <Banner />
      <Introduction />
      <FeaturedEvents/>
      <UpcomingEvents/>
      <Testimonials/>
      <Footer />
    </>
  );
};

export default HomePage;
