import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function Home({ userEmail, isAdmin, onLogout, token: propToken }) {
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = propToken || localStorage.getItem("token") || "";

  useEffect(() => {
    fetchMyBookings();
    // eslint-disable-next-line
  }, []);

  async function fetchMyBookings() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/users/me/bookings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(txt || "Kunne ikke hente bookings");
      }
      const data = await res.json();
      setMyBookings(data.bookings || []);
    } catch (err) {
      setError(err.message || "Feil ved henting");
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    if (onLogout) onLogout();
    else {
      localStorage.removeItem("token");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("isAdmin");
      window.location.href = "/login";
    }
  };

  return (
    <div className="home-container">
      <header className="site-header" aria-hidden="false">
        <div style={{ flex: 1 }}></div>
        <div className="user-info" style={{ gap: 12 }}>
          <div className="user-email">{userEmail || "Gjest"}</div>
          <button className="btn-logout" onClick={handleLogout}>Logg ut</button>
        </div>
      </header>

      <main className="content" role="main">
        <section className="card">
          <h2>Velkommen</h2>
          <p className="lead">Du er nå logget inn. Velg en handling under for å komme i gang.</p>

          <div className="actions">
            <Link to="/bookings" className="btn btn-primary">Gå til booking</Link>
            {isAdmin && <Link to="/admin" className="btn btn-secondary">Admin-panel</Link>}
            <a className="btn btn-ghost" href="#" onClick={(e)=>e.preventDefault()}>Hjelp / Dokumentasjon</a>
          </div>
        </section>

        <section className="card small">
          <h3>Dagens status</h3>
          <p>Her finner du en rask oversikt over bookinger og tilgjengelighet.</p>
        </section>

        <section className="card" style={{ marginTop: 12 }}>
          <h3>Dine kommende bookinger</h3>
          {loading && <div>Henter dine bookinger…</div>}
          {error && <div className="error-msg">{error}</div>}
          {!loading && myBookings.length === 0 && <div>Du har ingen kommende bookinger.</div>}

          <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
            {myBookings
              .map(b => ({
                ...b,
                start: b.start_time ? new Date(b.start_time) : null,
                end: b.end_time ? new Date(b.end_time) : null,
              }))
              .sort((a,b) => (a.start && b.start) ? a.start - b.start : 0)
              .map(b => (
                <li key={b.id} style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{b.hall || "Ukjent sal"}</div>
                    <div style={{ color: "var(--muted)", fontSize: 13 }}>
                      {b.start ? b.start.toLocaleString() : b.start_time} — {b.end ? b.end.toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"}) : b.end_time}
                    </div>
                  </div>
                  <div>
                    <Link to="/bookings" className="btn btn-ghost" style={{ padding: "6px 10px" }}>Vis i kalender</Link>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      </main>

      <footer className="site-footer">
        <small>© {new Date().getFullYear()} HallBooking — Tromsø</small>
      </footer>
    </div>
  );
}