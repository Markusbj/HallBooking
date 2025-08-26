import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Home from "./Home";
import Bookings from "./Bookings";
import AdminPanel from "./AdminPanel";
import NavBar from "./NavBar";
import Account from "./Account";
import "./styles/global.css";
import "./components/NavBar.css";
import "./components/Home.css";
import "./components/Bookings.css";


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("token");
    const email = localStorage.getItem("userEmail") || "";
    const admin = localStorage.getItem("isAdmin") === "true";
    if (t) { setIsLoggedIn(true); setToken(t); setUserEmail(email); setIsAdmin(admin); }
  }, []);

  const handleLogin = (email, admin, tok) => {
    localStorage.setItem("token", tok);
    localStorage.setItem("userEmail", email || "");
    localStorage.setItem("isAdmin", admin ? "true" : "false");
    setIsLoggedIn(true); setUserEmail(email||""); setIsAdmin(Boolean(admin)); setToken(tok);
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); localStorage.removeItem("userEmail"); localStorage.removeItem("isAdmin");
    setIsLoggedIn(false); setUserEmail(""); setIsAdmin(false); setToken("");
    window.location.href = "/login";
  };

  return (
    <>
      <NavBar />
      <div className="app-content">
        <Routes>
          <Route path="/" element={isLoggedIn ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={isLoggedIn ? <Navigate to="/home" replace /> : <Login onLogin={handleLogin} />} />
          <Route path="/register" element={isLoggedIn ? <Navigate to="/home" replace /> : <Register />} />
          <Route path="/home" element={isLoggedIn ? <Home userEmail={userEmail} isAdmin={isAdmin} onLogout={handleLogout} token={token} /> : <Navigate to="/login" replace />} />
          <Route path="/bookings" element={isLoggedIn ? <Bookings token={token} /> : <Navigate to="/login" replace />} />
          <Route path="/admin" element={isLoggedIn ? <AdminPanel token={token} /> : <Navigate to="/login" replace />} />
          <Route path="/account" element={isLoggedIn ? <Account token={token} /> : <Navigate to="/login" replace />} />
        </Routes>
      </div>
    </>
  );
}

export default App;