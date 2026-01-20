import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "./api";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function Home(props) {
  const { userEmail, isAdmin, onLogout } = props;
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMyBookings();
    // eslint-disable-next-line
  }, []);

  async function fetchMyBookings() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`${API}/users/me/bookings`);
      if (!res.ok) throw new Error(await res.text().catch(()=>res.statusText));
      const data = await res.json();
      setMyBookings(data.bookings || []);
    } catch (err) {
      setError(err.message || "Feil ved henting");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="home-container">
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

          <ul className="upcoming" style={{ marginTop: 12 }}>
            {myBookings
              .map(b => ({ ...b, start: b.start_time ? new Date(b.start_time) : null, end: b.end_time ? new Date(b.end_time) : null }))
              .sort((a,b) => (a.start && b.start) ? a.start - b.start : 0)
              .map(b => (
                <li key={b.id}>
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

      <footer className="site-footer" aria-label="Bunntekst">
        <div className="footer-inner container">
          <div className="footer-content">
            <div className="footer-contact">
              <h4>Kontaktinfo</h4>
              <p>TG Tromsø Norsk Rottweilerklubb</p>
              <p>
                <a href="mailto:tgtnrk@gmail.com">tgtnrk@gmail.com</a>
              </p>
              <p>Organisasjonsnummer: 935584566</p>
            </div>
            <div className="footer-copyright">
              <small>© {new Date().getFullYear()} TG Tromsø — Hundetrening</small>
            </div>
            <div className="social-links">
              <a href="https://www.facebook.com/tgtromso" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 12.07C22 6.49 17.52 2 11.94 2S2 6.49 2 12.07c0 4.99 3.66 9.13 8.44 9.93v-7.03H8.03v-2.9h2.41V9.41c0-2.39 1.43-3.71 3.62-3.71 1.05 0 2.15.19 2.15.19v2.37h-1.21c-1.19 0-1.56.74-1.56 1.5v1.8h2.65l-.42 2.9h-2.23v7.03C18.34 21.2 22 17.06 22 12.07z"/>
                </svg>
              </a>

              <a href="https://www.instagram.com/tgtromso" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#E4405F" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 6.2A3.8 3.8 0 1 0 15.8 12 3.8 3.8 0 0 0 12 8.2zm6.4-.7a1.12 1.12 0 1 0 1.12 1.12A1.12 1.12 0 0 0 18.4 7.5zM12 9.5A2.5 2.5 0 1 1 9.5 12 2.5 2.5 0 0 1 12 9.5z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}