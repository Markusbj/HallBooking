import React from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "./assets/logo.png"; // valgfri - legg logo.png i frontend/src/assets eller fjern import

export default function NavBar() {
  const loc = useLocation();
  if (loc.pathname === "/login" || loc.pathname === "/register") return null;

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
            {/** Hvis du har logo, vis den; ellers vis tekst */}
            {logo ? <img src={logo} alt="HallBooking" className="nav-logo" /> : null}
            <span className="nav-brand-text">HallBooking</span>
          </Link>
        </div>

        <div className="nav-right">
          {/* Placeholder for future user controls */}
        </div>
      </div>
    </nav>
  );
}