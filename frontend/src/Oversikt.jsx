import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function Oversikt(props) {
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
      const res = await fetch(`${API}/users/me/bookings`, {
        credentials: "include",
      });
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
    <div className="oversikt-container">
      <div className="oversikt-header">
        <div className="welcome-section">
          <h1>Velkommen tilbake!</h1>
          <p className="welcome-subtitle">Hei {userEmail}, her er din oversikt over bookinger og tilgjengelige funksjoner.</p>
        </div>
        
        <div className="quick-actions">
          <Link to="/bookings" className="action-card primary">
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
              </svg>
            </div>
            <div className="action-content">
              <h3>Book treningshall</h3>
              <p>Se tilgjengelige tider og book din økt</p>
            </div>
          </Link>
          
          {isAdmin && (
            <Link to="/admin" className="action-card secondary">
              <div className="action-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div className="action-content">
                <h3>Admin-panel</h3>
                <p>Administrer systemet og se statistikk</p>
              </div>
            </Link>
          )}
          
          <Link to="/account" className="action-card ghost">
            <div className="action-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <div className="action-content">
              <h3>Kontoinnstillinger</h3>
              <p>Oppdater din profil og innstillinger</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="oversikt-content">
        <div className="bookings-section">
          <div className="section-header">
            <h2>Dine kommende bookinger</h2>
            <div className="booking-count">
              {loading ? "..." : myBookings.length} {myBookings.length === 1 ? "booking" : "bookinger"}
            </div>
          </div>
          
          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Henter dine bookinger...</p>
            </div>
          )}
          
          {error && (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
              <button onClick={fetchMyBookings} className="btn btn-outline">Prøv igjen</button>
            </div>
          )}
          
          {!loading && !error && myBookings.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>Ingen kommende bookinger</h3>
              <p>Du har ingen kommende bookinger. Klikk på "Book treningshall" for å opprette en ny booking.</p>
              <Link to="/bookings" className="btn btn-primary">Book treningshall</Link>
            </div>
          )}
          
          {!loading && !error && myBookings.length > 0 && (
            <div className="bookings-grid">
              {myBookings
                .map(b => ({ ...b, start: b.start_time ? new Date(b.start_time) : null, end: b.end_time ? new Date(b.end_time) : null }))
                .sort((a,b) => (a.start && b.start) ? a.start - b.start : 0)
                .map(b => (
                  <div key={b.id} className="booking-card">
                    <div className="booking-header">
                      <h4>{b.hall || "Ukjent sal"}</h4>
                      <span className="booking-status upcoming">Kommende</span>
                    </div>
                    <div className="booking-details">
                      <div className="booking-time">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                        </svg>
                        <span>
                          {b.start ? b.start.toLocaleDateString('no-NO', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long' 
                          }) : b.start_time}
                        </span>
                      </div>
                      <div className="booking-duration">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <span>
                          {b.start ? b.start.toLocaleTimeString('no-NO', {hour: '2-digit', minute: '2-digit'}) : b.start_time} - {b.end ? b.end.toLocaleTimeString('no-NO', {hour: '2-digit', minute: '2-digit'}) : b.end_time}
                        </span>
                      </div>
                    </div>
                    <div className="booking-actions">
                      <Link to="/bookings" className="btn btn-outline btn-sm">Vis i kalender</Link>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
