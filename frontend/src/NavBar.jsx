import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "./assets/logo.png";

export default function NavBar() {
  const loc = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [contactEmail, setContactEmail] = useState(localStorage.getItem("contact_email") || "");
  const [contactPhone, setContactPhone] = useState(localStorage.getItem("contact_phone") || "");
  const [darkMode, setDarkMode] = useState(localStorage.getItem("dark_mode") === "true");
  const [userInfo, setUserInfo] = useState({
    email: localStorage.getItem("userEmail") || "",
    full_name: localStorage.getItem("userFullName") || "",
    is_superuser: localStorage.getItem("isAdmin") === "true"
  });
  const isLoggedIn = !!localStorage.getItem("token");
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const ref = useRef(null);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("dark_mode", darkMode ? "true" : "false");
  }, [darkMode]);

  // Load user info when logged in
  useEffect(() => {
    if (isLoggedIn) {
      const token = localStorage.getItem("token");
      const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      
      fetch(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setUserInfo({
          email: data.email || "",
          full_name: data.full_name || "",
          is_superuser: data.is_superuser || false
        });
        localStorage.setItem("userFullName", data.full_name || "");
      })
      .catch(err => console.error("Failed to load user info:", err));
    }
  }, [isLoggedIn]);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // NavBar is now available on all pages including login and register

  function handleSave() {
    localStorage.setItem("contact_email", contactEmail);
    localStorage.setItem("contact_phone", contactPhone);
    if (contactEmail) localStorage.setItem("userEmail", contactEmail);
    setOpen(false);
  }

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
          <Link to="/" className="nav-link">Hjem</Link>
          <Link to="/bookings" className="nav-link">Treningshaller</Link>
          <Link to="/om-oss" className="nav-link">Om oss</Link>
          <Link to="/instruktorer" className="nav-link">Instruktører</Link>
          <Link to="/kontakt" className="nav-link">Kontakt</Link>
          {isLoggedIn && (
            <Link to="/oversikt" className="nav-link">Oversikt</Link>
          )}
          {isLoggedIn && isAdmin && (
            <Link to="/admin" className="nav-link">Admin</Link>
          )}
        </div>

        <div 
          className="nav-brand-link" 
          title="Gå til hjem-siden"
          onClick={() => navigate("/")}
        >
          {logo ? <img src={logo} alt="TG Tromsø" className="nav-logo" /> : null}
          <span className="nav-brand-text">TG Tromsø</span>
        </div>

        <div className="nav-right">
          {isLoggedIn ? (
            <div className="nav-user" ref={ref}>
              <button
                className="nav-user-btn"
                onClick={() => setOpen((s) => !s)}
                aria-haspopup="true"
                aria-expanded={open}
                title={userInfo.full_name || userInfo.email || "Konto"}
              >
                <span className="nav-user-avatar">
                  {userInfo.full_name ? userInfo.full_name.charAt(0).toUpperCase() : 
                   userInfo.email ? userInfo.email.charAt(0).toUpperCase() : "H"}
                </span>
                <span className="nav-user-name">
                  {userInfo.full_name || userInfo.email || "Min konto"}
                </span>
              </button>

              <div className={`nav-dropdown ${open ? "open" : ""}`} role="menu" aria-hidden={!open}>
                <div className="dropdown-section">
                  <div className="dropdown-title">Konto</div>
                  <div className="dropdown-row">
                    <label className="row-label">Navn</label>
                    <div className="row-value">{userInfo.full_name || "Ikke satt"}</div>
                  </div>
                  <div className="dropdown-row">
                    <label className="row-label">E-post</label>
                    <div className="row-value">{userInfo.email || "Ulogget"}</div>
                  </div>
                  <div className="dropdown-row">
                    <label className="row-label">Kontotype</label>
                    <div className="row-value">
                      <span className={`user-type ${userInfo.is_superuser ? 'admin' : 'user'}`}>
                        {userInfo.is_superuser ? 'Administrator' : 'Standard bruker'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="dropdown-section">
                  <div className="dropdown-title">Innstillinger</div>

                  <div className="dropdown-row">
                    <label className="row-label">Dark mode</label>
                    <div className="row-value">
                      <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} aria-label="Dark mode" />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button className="submit-btn" onClick={handleSave}>Lagre</button>
                    <button className="btn btn-ghost" onClick={() => { setContactEmail(localStorage.getItem("contact_email") || ""); setContactPhone(localStorage.getItem("contact_phone") || ""); setDarkMode(localStorage.getItem("dark_mode") === "true"); }}>
                      Avbryt
                    </button>
                  </div>
                </div>

                <div className="dropdown-section" style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button className="btn" onClick={() => { setOpen(false); navigate("/account"); }}>Kontoinnstillinger</button>
                  <button className="btn btn-ghost" onClick={handleLogout}>Logg ut</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="btn btn-ghost">Logg inn</Link>
              <Link to="/register" className="btn btn-primary">Registrer</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}