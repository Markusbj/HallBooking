import React, { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function Account() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({ email: "", name: "", phone: "" });
  const token = localStorage.getItem("token") || "";

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API}/users/me/profile`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) throw new Error(await res.text().catch(()=>res.statusText));
        const data = await res.json();
        setProfile({ email: data.email || "", name: data.name || "", phone: data.phone || "" });
      } catch (err) {
        setError(err.message || "Kunne ikke hente profil");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API}/users/me/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name: profile.name, phone: profile.phone }),
      });
      if (!res.ok) throw new Error(await res.text().catch(()=>res.statusText));
      const data = await res.json();
      // optionally persist email change if server allows
      if (data.user && data.user.email) localStorage.setItem("userEmail", data.user.email);
      setProfile(p => ({ ...p, ...((data.user) || {}) }));
    } catch (err) {
      setError(err.message || "Feil ved lagring");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="home-container">
      <main className="content" role="main">
        <section className="card">
          <h2>Kontoinnstillinger</h2>
          {loading ? <div>Henter profil…</div> : null}
          {error ? <div className="error-msg">{error}</div> : null}

          {!loading && (
            <div>
              <div className="form-group">
                <label>E-post</label>
                <input value={profile.email} readOnly />
              </div>

              <div className="form-group">
                <label>Navn</label>
                <input value={profile.name} onChange={(e)=>setProfile({...profile, name: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Telefon</label>
                <input value={profile.phone} onChange={(e)=>setProfile({...profile, phone: e.target.value})} />
              </div>

              <div style={{ display:"flex", gap:8 }}>
                <button className="btn" onClick={save} disabled={saving}>{saving ? "Lagrer..." : "Lagre endringer"}</button>
                <button className="btn btn-ghost" onClick={() => { setProfile({ email: profile.email, name: localStorage.getItem("contact_name")||"", phone: localStorage.getItem("contact_phone")||"" }); }}>Tilbakestill</button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}