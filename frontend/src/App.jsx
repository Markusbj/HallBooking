import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Home from "./Home";
import Oversikt from "./Oversikt";
import Bookings from "./Bookings";
import PublicBookings from "./PublicBookings";
import LandingPage from "./LandingPage";
import AdminPanel from "./AdminPanel";
import NavBar from "./NavBar";
import Account from "./Account";
import OmOss from "./OmOss";
import Instruktorer from "./Instruktorer";
import Kontakt from "./Kontakt";
import Nyheter from "./Nyheter";
import NyhetDetail from "./NyhetDetail";
import "./styles/global.css";
import "./components/NavBar.css";
import "./components/Home.css";
import "./components/Bookings.css";
import "./components/LandingPage.css";
import "./components/Pages.css";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { setIsLoggedIn(false); return; }

    // Verifiser token mot backend
    fetch(`${API}/users/me`, {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("invalid token");
        return res.json();
      })
      .then((user) => {
        setIsLoggedIn(true);
        setToken(t);
        setUserEmail(user.email || "");
        setIsAdmin(Boolean(user.is_superuser || user.is_admin));
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("isAdmin");
        setIsLoggedIn(false);
        setToken("");
      });
  }, []);

  const handleLogin = (email, admin, tok) => {
    localStorage.setItem("token", tok);
    localStorage.setItem("userEmail", email || "");
    localStorage.setItem("isAdmin", admin ? "true" : "false");
    setIsLoggedIn(true); 
    setUserEmail(email || ""); 
    setIsAdmin(Boolean(admin)); 
    setToken(tok);
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); localStorage.removeItem("userEmail"); localStorage.removeItem("isAdmin");
    setIsLoggedIn(false); setUserEmail(""); setIsAdmin(false); setToken("");
    window.location.href = "/";
  };

  return (
    <>
      <NavBar />
      <div className="app-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={isLoggedIn ? <Navigate to="/oversikt" replace /> : <Login onLogin={handleLogin} />} />
          <Route path="/register" element={isLoggedIn ? <Navigate to="/oversikt" replace /> : <Register />} />
          <Route path="/oversikt" element={isLoggedIn ? <Oversikt userEmail={userEmail} isAdmin={isAdmin} onLogout={handleLogout} token={token} /> : <Navigate to="/login" replace />} />
          <Route path="/home" element={isLoggedIn ? <Home userEmail={userEmail} isAdmin={isAdmin} onLogout={handleLogout} token={token} /> : <Navigate to="/login" replace />} />
          <Route path="/bookings" element={isLoggedIn ? <Bookings token={token} /> : <PublicBookings />} />
          <Route path="/om-oss" element={<OmOss />} />
          <Route path="/instruktorer" element={<Instruktorer />} />
          <Route path="/kontakt" element={<Kontakt />} />
          <Route path="/nyheter" element={<Nyheter />} />
          <Route path="/nyheter/:id" element={<NyhetDetail />} />
          <Route path="/admin" element={isLoggedIn && isAdmin ? <AdminPanel token={token} /> : <Navigate to="/" replace />} />
          <Route path="/account" element={isLoggedIn ? <Account token={token} /> : <Navigate to="/login" replace />} />
        </Routes>
      </div>
    </>
  );
}

export default App;