import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function pad(num) {
  return String(num).padStart(2, "0");
}
function isoDate(d) {
  return d.toISOString().slice(0, 10);
}
function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  // Calculate days to subtract to get to Monday
  const daysToSubtract = day === 0 ? 6 : day - 1; // Sunday=6, Monday=0, Tuesday=1, etc.
  d.setDate(d.getDate() - daysToSubtract);
  d.setHours(0,0,0,0);
  return d;
}
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0,0,0,0);
  return d;
}
function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  return Math.ceil((((date - yearStart) / 86400000) + 1)/7);
}
function weekToInput(d) {
  const y = d.getFullYear();
  const w = pad(getWeekNumber(d));
  return `${y}-W${w}`;
}
function inputToWeek(v) {
  // v format YYYY-Www
  const [y, w] = v.split("-W");
  const target = new Date(Date.UTC(Number(y), 0, 1 + (Number(w)-1)*7));
  // shift to Monday of that ISO week
  return startOfWeek(target);
}

export default function PublicBookings() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [days, setDays] = useState([]);
  const [colors, setColors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openDay, setOpenDay] = useState(null); // date string shown in top-left panel
  const [showWeekSelector, setShowWeekSelector] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [dropdownRef, setDropdownRef] = useState(null);

  useEffect(() => { fetchWeek(); /* eslint-disable-next-line */ }, [weekStart]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (showWeekSelector && 
          !event.target.closest('.week-selector-container') && 
          !event.target.closest('[data-week-dropdown]')) {
        setShowWeekSelector(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showWeekSelector]);

  async function fetchDay(dateStr) {
    const res = await fetch(`${API}/bookings/${dateStr}`);
    if (!res.ok) throw new Error(`Kunne ikke hente ${dateStr}`);
    return res.json();
  }

  async function fetchWeek() {
    setLoading(true); setError("");
    try {
      const promises = []; const daysArr = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        const dateStr = isoDate(d);
        promises.push(fetchDay(dateStr));
        daysArr.push({ date: dateStr, dateObj: d });
      }
      const results = await Promise.all(promises);
      const combined = daysArr.map((day, idx) => ({
        date: day.date,
        dateObj: day.dateObj,
        slots: results[idx].slots || [],
      }));
      setDays(combined);
      if (results[0] && results[0].colors) setColors(results[0].colors);
    } catch (err) {
      console.error(err); setError(err.message || "Feil ved henting");
    } finally { setLoading(false); }
  }

  function prevWeek() {
    const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(startOfWeek(d)); setOpenDay(null);
  }
  function nextWeek() {
    const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(startOfWeek(d)); setOpenDay(null);
  }

  function onDayHeaderClick(date) {
    setOpenDay(openDay === date ? null : date);
  }

  function generateWeekOptions() {
    const options = [];
    const currentDate = new Date();
    const currentWeek = startOfWeek(currentDate);
    
    // Generate weeks from current week to 6 months in the future
    for (let i = 0; i <= 24; i++) {
      const weekDate = new Date(currentWeek);
      weekDate.setDate(weekDate.getDate() + (i * 7));
      
      const weekNumber = getWeekNumber(weekDate);
      const year = weekDate.getFullYear();
      const isCurrent = weekDate.getTime() === currentWeek.getTime();
      
      options.push({
        date: weekDate,
        weekNumber,
        year,
        isCurrent,
        label: `Uke ${weekNumber} i ${year}`
      });
    }
    
    // Sort so current week appears first, then future weeks in chronological order
    return options.sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return a.date - b.date;
    });
  }

  function selectWeek(weekDate) {
    setWeekStart(startOfWeek(weekDate));
    setShowWeekSelector(false);
  }

  function toggleWeekSelector(event) {
    if (!showWeekSelector) {
      const buttonRect = event.currentTarget.getBoundingClientRect();
      
      // Simple positioning - always below the button
      const finalPosition = {
        top: buttonRect.bottom + 8,
        left: buttonRect.left,
        width: Math.max(buttonRect.width, 250) // Ensure minimum width
      };
      
      setDropdownPosition(finalPosition);
    }
    setShowWeekSelector(!showWeekSelector);
  }

  const weekEnd = new Date(weekStart); 
  weekEnd.setDate(weekEnd.getDate() + 6); // Sunday

  return (
    <div className="bookings-container">
      <div className="bookings-header">
        <div className="week-navigation">
          <button className="nav-btn" onClick={prevWeek} title="Forrige uke">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
          <button className="nav-btn" onClick={nextWeek} title="Neste uke">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>
          <button className="today-btn" onClick={() => setWeekStart(startOfWeek(new Date()))} title="Gå til denne uken">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            I dag
          </button>
          <div className="week-selector-container">
            <button 
              className="week-details-btn"
              onClick={toggleWeekSelector}
              title="Velg uke"
            >
              <span className="week-number">Uke {getWeekNumber(weekStart)}</span>
              <span className="year">i {weekStart.getFullYear()}</span>
              <svg className="calendar-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
              </svg>
              <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </button>
            
            {showWeekSelector && createPortal(
              <div 
                ref={setDropdownRef}
                data-week-dropdown
                style={{
                  position: 'fixed',
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                  width: `${dropdownPosition.width}px`,
                  height: '300px',
                  backgroundColor: 'white',
                  border: '3px solid #3b82f6',
                  borderRadius: '12px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
                  zIndex: 999999,
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: '#f8fafc'
                }}>
                  <span style={{ fontWeight: '600', color: '#1f2937' }}>Velg uke</span>
                  <button 
                    onClick={() => setShowWeekSelector(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      background: 'none',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: '#6b7280'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                </div>
                <div style={{
                  maxHeight: '240px',
                  overflowY: 'auto',
                  padding: '8px 0'
                }}>
                  {generateWeekOptions().map((option, index) => (
                    <button
                      key={index}
                      className={`week-option ${option.isCurrent ? 'current' : ''}`}
                      onClick={() => selectWeek(option.date)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        padding: '12px 20px',
                        background: option.isCurrent ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: option.isCurrent ? 'white' : '#1f2937',
                        fontSize: '14px',
                        textAlign: 'left'
                      }}
                    >
                      <span style={{ fontWeight: '500' }}>{option.label}</span>
                      {option.isCurrent && (
                        <span style={{
                          fontSize: '12px',
                          background: 'rgba(255, 255, 255, 0.2)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: '600'
                        }}>Nåværende</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>

        <div className="week-info">
          <h2>Treningshall</h2>
          <p className="week-range">{isoDate(weekStart)} — {isoDate(weekEnd)}</p>
          <div className="week-details">
            <span className="week-number">Uke {getWeekNumber(weekStart)}</span>
            <span className="year">{weekStart.getFullYear()}</span>
          </div>
        </div>
      </div>

      <div className="bookings-content">
        <div className="calendar-section">
          {loading && <div className="loading-state">Henter treningshall...</div>}
          {error && <div className="error-msg">{error}</div>}

          <div className="calendar-grid" onClick={() => onDayHeaderClick(weekStart.toISOString().slice(0, 10))}>
            {days.map((day) => (
              <div className="day-card" key={day.date}>
                <div className="day-header">
                  <div className="day-name">{new Date(day.date).toLocaleDateString(undefined, { weekday: "long" })}</div>
                  <div className="day-date">{new Date(day.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</div>
                </div>

                <div className="time-slots">
                  {day.slots.map((slot) => {
                    const booked = slot.status === "booked" && slot.booking_ids && slot.booking_ids.length > 0;
                    const blocked = slot.status === "blocked";
                    return (
                      <div
                        key={slot.hour}
                        className={`time-slot ${booked ? 'booked' : blocked ? 'blocked' : 'available'}`}
                        style={blocked ? { 
                          backgroundColor: '#ff4444'
                        } : {}}
                        aria-label={`${day.date} ${pad(slot.hour)}:00`}
                        title={booked ? `${slot.booking_ids.length} opptatt` : blocked ? (slot.reason || "Blokkert") : "Ledig"}
                      >
                        <span className="time-text">{pad(slot.hour)}:00</span>
                        {booked && (
                          <span className="booking-count">{slot.booking_ids.length}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="booking-panel">
          <div className="panel-section">
            <h3>Informasjon</h3>
            <div className="info-card">
              <p>Dette er en offentlig visning av tilgjengelige treningshaller.</p>
              <p>For å booke treningshall må du logge inn.</p>
            </div>
          </div>

          <div className="panel-section">
            <h4>Status</h4>
            <div className="legend">
              <div className="legend-item">
                <div className="legend-color available"></div>
                <span>Ledig</span>
              </div>
              <div className="legend-item">
                <div className="legend-color booked"></div>
                <span>Opptatt</span>
              </div>
              <div className="legend-item">
                <div className="legend-color blocked"></div>
                <span>Blokkert</span>
              </div>
            </div>
          </div>

          <div className="panel-section">
            <div className="cta-card">
              <h4>Vil du booke treningshall?</h4>
              <p>Logg inn for å få tilgang til booking-funksjoner.</p>
              <div className="cta-buttons">
                <a href="/login" className="btn btn-primary">Logg inn</a>
                <a href="/register" className="btn btn-secondary">Registrer</a>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Top-left expanded day panel */}
      {openDay && (
        <div className="day-panel">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <strong>{new Date(openDay).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "short", day: "numeric" })}</strong>
            <button className="submit-btn" onClick={() => setOpenDay(null)}>Lukk</button>
          </div>
          <div className="day-panel-slots">
            {(days.find(d => d.date === openDay)?.slots || []).map(slot => {
              const booked = slot.status === "booked" && slot.booking_ids && slot.booking_ids.length > 0;
              const blocked = slot.status === "blocked";
              const cls = booked ? "booked" : blocked ? "blocked" : "empty";
              return (
                <div
                  key={slot.hour}
                  className={`slot-button daypanel ${cls}`}
                >
                  <div className="slot-hour">{pad(slot.hour)}:00</div>
                  <div className="slot-meta">{booked ? `${slot.booking_ids.length} opptatt` : blocked ? "Blokkert" : "Ledig"}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
