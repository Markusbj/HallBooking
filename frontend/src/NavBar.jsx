import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "./assets/logo.png";

export default function NavBar() {
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("dark_mode") === "true");
  const userEmail = localStorage.getItem("userEmail") || "";
  const ref = useRef(null);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("dark_mode", darkMode ? "true" : "false");
  }, [darkMode]);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    function onScroll() {
      if (window.scrollY > 20) document.documentElement.classList.add("nav-collapsed");
      else document.documentElement.classList.remove("nav-collapsed");
    }
    // initial set
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (loc.pathname === "/login" || loc.pathname === "/register") return null;

  function handleSave() { /* ...existing save logic if present... */ }
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("isAdmin");
    window.location.href = "/login";
  }

  return (
    <nav className="app-navbar" role="navigation" aria-label="Hovednavigasjon">
      <div className="app-navbar-inner">
        <div className="nav-left">
          <Link to="/home" className="nav-link">Hjem</Link>
          <Link to="/bookings" className="nav-link">Booking</Link>
          <Link to="/admin" className="nav-link">Admin</Link>
        </div>

        <div className="nav-brand">
          <Link to="/home" className="nav-brand-link">
            {logo ? <img src={logo} alt="HallBooking" className="nav-logo" /> : null}
            <span className="nav-brand-text">HallBooking</span>
          </Link>
        </div>

        <div className="nav-right">
          <div className="nav-user" ref={ref}>
            <button
              className="nav-user-btn"
              onClick={() => setOpen((s) => !s)}
              aria-haspopup="true"
              aria-expanded={open}
              title={userEmail || "Konto"}
            >
              <span className="nav-user-avatar">
                {userEmail ? userEmail.charAt(0).toUpperCase() : "H"}
              </span>
              <span className="nav-user-name">{userEmail ? userEmail : "Min konto"}</span>
            </button>

            <div className={`nav-dropdown ${open ? "open" : ""}`} role="menu" aria-hidden={!open}>
              {/* ...dropdown content (settings, dark mode, contact info, logout)... */}
              <div className="dropdown-section" style={{ borderTop: "1px solid rgba(0,0,0,0.04)", marginTop: 8, paddingTop: 8 }}>
                <button className="btn btn-ghost" onClick={handleLogout}>Logg ut</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}