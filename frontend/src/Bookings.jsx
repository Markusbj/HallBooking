import React, { useEffect, useState } from "react";

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

export default function Bookings({ token: propToken }) {
  const token = propToken || localStorage.getItem("token") || "";
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [days, setDays] = useState([]);
  const [colors, setColors] = useState({});
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null); // {date, hour}
  const [hall, setHall] = useState("Hovedsal");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [isAdmin] = useState(localStorage.getItem("isAdmin") === "true");
  const [openDay, setOpenDay] = useState(null); // date string shown in top-left panel

  useEffect(() => { fetchWeek(); /* eslint-disable-next-line */ }, [weekStart]);

  async function fetchDay(dateStr) {
    const res = await fetch(`${API}/bookings/${dateStr}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
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
    setSelected(null);
  }

  function onSlotClick(slot, day) {
    setSelected({ date: day.date, hour: slot.hour, slot });
  }

  async function createBooking() {
    if (!selected) return;
    setCreating(true); setError("");
    const start = new Date(`${selected.date}T${pad(selected.hour)}:00:00`).toISOString();
    const endDate = new Date(start); endDate.setHours(endDate.getHours() + 1);
    const body = { hall: hall || "Hovedsal", start_time: start, end_time: endDate.toISOString() };
    try {
      const res = await fetch(`${API}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        let data = null; try { data = await res.json(); } catch {}
        throw new Error((data && data.detail) ? JSON.stringify(data.detail) : res.statusText);
      }
      await fetchWeek(); setSelected(null);
    } catch (err) {
      console.error(err); setError(err.message || "Kunne ikke opprette booking");
    } finally { setCreating(false); }
  }

  async function deleteBooking(bookingId) {
    if (!isAdmin) { setError("Kun admin kan slette bookings"); return; }
    if (!confirm("Slett denne bookingen?")) return;
    try {
      const res = await fetch(`${API}/bookings/${bookingId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Sletting feilet");
      await fetchWeek(); setSelected(null);
    } catch (err) { setError(err.message || "Kunne ikke slette"); }
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
          <input
            type="week"
            value={weekToInput(weekStart)}
            onChange={(e) => setWeekStart(inputToWeek(e.target.value))}
            className="week-input"
          />
        </div>

        <div className="week-info">
          <h2>Treningshaller</h2>
          <p className="week-range">{isoDate(weekStart)} — {isoDate(weekEnd)}</p>
          <div className="week-details">
            <span className="week-number">Uke {getWeekNumber(weekStart)}</span>
            <span className="year">{weekStart.getFullYear()}</span>
          </div>
        </div>
      </div>

      <div className="bookings-content">
        <div className="calendar-section">
          {loading && <div className="loading-state">Henter treningshaller...</div>}
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
                    const isSelected = selected && selected.date === day.date && selected.hour === slot.hour;
                    return (
                      <button
                        key={slot.hour}
                        className={`time-slot ${booked ? 'booked' : blocked ? 'blocked' : 'available'} ${isSelected ? 'selected' : ''}`}
                        style={blocked ? { 
                          backgroundColor: '#ff4444'
                        } : {}}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSlotClick(slot, day);
                        }}
                        aria-label={`${day.date} ${pad(slot.hour)}:00`}
                        title={booked ? `${slot.booking_ids.length} opptatt` : blocked ? (slot.reason || "Blokkert") : "Ledig"}
                      >
                        <span className="time-text">{pad(slot.hour)}:00</span>
                        {booked && (
                          <span className="booking-count">{slot.booking_ids.length}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="booking-panel">
          <div className="panel-section">
            <h3>Booking</h3>
            {selected ? (
              <div className="selected-time">
                <div className="time-info">
                  <div className="time-date">{new Date(selected.date).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</div>
                  <div className="time-range">{pad(selected.hour)}:00 — {pad((selected.hour+1)%24)}:00</div>
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <p>Velg en tid i kalenderen for å booke</p>
              </div>
            )}
          </div>

          {selected && (
            <div className="panel-section">
              <label className="form-label">Treningshall</label>
              <input 
                value={hall} 
                onChange={(e)=>setHall(e.target.value)} 
                className="form-input"
                placeholder="F.eks. Hovedhallen"
              />
            </div>
          )}

          {selected && selected.slot && selected.slot.booking_ids && selected.slot.booking_ids.length > 0 ? (
            <div className="panel-section">
              <h4>Eksisterende bookinger</h4>
              <div className="booking-list">
                {selected.slot.booking_ids.map(id => (
                  <div key={id} className="booking-item">
                    <span className="booking-id">{id}</span>
                    {isAdmin && (
                      <button 
                        className="delete-btn" 
                        onClick={() => deleteBooking(id)}
                        title="Slett booking"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : selected ? (
            <div className="panel-section">
              <button 
                className="book-btn" 
                onClick={createBooking} 
                disabled={creating || !selected}
              >
                {creating ? "Oppretter..." : "Book treningshall"}
              </button>
            </div>
          ) : null}

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
                <button
                  key={slot.hour}
                  className={`slot-button daypanel ${cls} ${selected && selected.date === openDay && selected.hour === slot.hour ? "selected" : ""}`}
                  style={blocked ? { 
                    backgroundColor: '#ff4444'
                  } : {}}
                  onClick={() => setSelected({ date: openDay, hour: slot.hour, slot })}
                >
                  <div className="slot-hour">{pad(slot.hour)}:00</div>
                  <div className="slot-meta">{booked ? `${slot.booking_ids.length} opptatt` : blocked ? (slot.reason || "Blokkert") : "Ledig"}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}