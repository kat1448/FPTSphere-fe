import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/HomePage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Event from "./pages/Events"
function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/event" element={<Event />} />
      </Routes>
    </Router>
  );
}
export default App;
