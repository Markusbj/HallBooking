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
  const day = (d.getDay() + 6) % 7; // Mon=0..Sun=6
  d.setDate(d.getDate() - day);
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

  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="submit-btn" onClick={prevWeek}>←</button>
          <button className="submit-btn" onClick={nextWeek}>→</button>
          <input
            type="week"
            value={weekToInput(weekStart)}
            onChange={(e) => setWeekStart(inputToWeek(e.target.value))}
            style={{ padding: 8, borderRadius: 8, border: "1px solid rgba(0,0,0,0.06)" }}
          />
        </div>

        <div style={{ fontWeight: 700 }}>
          Uke: {isoDate(weekStart)} — {isoDate(weekEnd)}
        </div>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading && <div>Henter uke...</div>}
          {error && <div className="error-msg">{error}</div>}

          <div className="calendar-week">
            {days.map((day) => (
              <div className="day-column" key={day.date}>
                <div className="day-header clickable" onClick={() => onDayHeaderClick(day.date)}>
                  <div style={{ fontWeight: 700 }}>{new Date(day.date).toLocaleDateString(undefined, { weekday: "short" })}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{day.date}</div>
                </div>

                <div className="day-slots-compact">
                  {day.slots.map((slot) => {
                    const booked = slot.status === "booked" && slot.booking_ids && slot.booking_ids.length > 0;
                    const blocked = slot.status === "blocked";
                    const cls = booked ? "booked" : blocked ? "blocked" : "empty";
                    return (
                      <button
                        key={slot.hour}
                        className={`slot-button compact ${cls} ${selected && selected.date === day.date && selected.hour === slot.hour ? "selected" : ""}`}
                        onClick={() => onSlotClick(slot, day)}
                        aria-label={`${day.date} ${pad(slot.hour)}:00`}
                        title={booked ? `${slot.booking_ids.length} opptatt` : blocked ? "Blokkert" : "Ledig"}
                      >
                        <div className="slot-hour">{pad(slot.hour)}:00</div>
                      </button>
                    );
                  })}
                </div>

                {/* Expanded day panel (opens at top-left) is handled outside */}
              </div>
            ))}
          </div>
        </div>

        <aside className="side-panel" style={{ width: 360, flexShrink: 0 }}>
          <div className="selected-info">
            <h4>Valgt time</h4>
            {selected ? (
              <>
                <div style={{ marginBottom: 8 }}><strong>Dato:</strong> {selected.date}</div>
                <div style={{ marginBottom: 8 }}><strong>Tid:</strong> {pad(selected.hour)}:00 — {pad((selected.hour+1)%24)}:00</div>
              </>
            ) : (
              <div>Velg en tid i kalenderen</div>
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={{ display: "block", marginBottom: 6 }}>Sal</label>
            <input value={hall} onChange={(e)=>setHall(e.target.value)} style={{ padding: 8, width: "100%", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginTop: 12 }}>
            {selected && selected.slot && selected.slot.booking_ids && selected.slot.booking_ids.length > 0 ? (
              <div>
                <div style={{ marginBottom: 8 }}>Bookinger i denne timen:</div>
                <ul>
                  {selected.slot.booking_ids.map(id => (
                    <li key={id} style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <span style={{fontSize:13}}>{id}</span>
                      {isAdmin && <button className="submit-btn" style={{ padding: "6px 8px", marginLeft: 8, background:"#E74C3C" }} onClick={() => deleteBooking(id)}>Slett</button>}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div>
                <button className="submit-btn" onClick={createBooking} disabled={creating || !selected}>
                  {creating ? "Oppretter..." : "Opprett booking (1t)"}
                </button>
              </div>
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <h4>Fargeforklaring</h4>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:8 }}>
              <div style={{ width:16, height:16, background:"#7A8B6F", borderRadius:4 }}></div><div>Grå - Blokkert (Kun admin)</div>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:6 }}>
              <div style={{ width:16, height:16, background:"#2ecc71", borderRadius:4 }}></div><div>Grønn - Ledig</div>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:6 }}>
              <div style={{ width:16, height:16, background:"#e74c3c", borderRadius:4 }}></div><div>Rød - Opptatt</div>
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
                  onClick={() => setSelected({ date: openDay, hour: slot.hour, slot })}
                >
                  <div className="slot-hour">{pad(slot.hour)}:00</div>
                  <div className="slot-meta">{booked ? `${slot.booking_ids.length} opptatt` : blocked ? "Blokkert" : "Ledig"}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}