import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoImage from "./assets/logo.png";
const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
      // if registration returns token, save and update profile
      const data = await res.json().catch(() => ({}));
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("userEmail", email);
        // update profile
        await fetch(`${API}/users/me/profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.access_token}` },
          body: JSON.stringify({ name, phone }),
        }).catch(() => null);
      }
      navigate("/login");
    } catch (err) {
      setError(err.message || "Feil ved registrering");
    }
  }

  return (
    <div className="auth-box">
      <div className="logo">
        <img src={logoImage} alt="HallBooking Logo" />
      </div>
      <div className="logo-subtitle">Administrasjonssystem</div>

      <h2>Registrer ny bruker</h2>
      <form onSubmit={submit}>
        <div className="form-group">
          <label>E-post</label>
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label>Passord</label>
          <input
            type="password"
            name="new-password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label>Navn</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Telefon</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" type="submit">
            Registrer
          </button>
        </div>
        {error && <div className="error-msg">{error}</div>}
      </form>

      <div className="auth-links">
        <a href="/login" onClick={(e) => { e.preventDefault(); navigate("/login"); }}>
          Allerede bruker? Logg inn her
        </a>
      </div>
    </div>
  );
}
