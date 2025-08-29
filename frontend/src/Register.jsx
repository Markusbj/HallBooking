import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function Register({ onRegistered }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passordene matcher ikke");
      return;
    }
    if (password.length < 8) {
      setError("Passord må være minst 8 tegn");
      return;
    }

    setLoading(true);
    try {
      // Hvis backend bruker en annen register-path, oppdater denne til riktig path fra /docs
      const registerPath = `${API}/auth/register`;
      const res = await fetch(registerPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.detail || data.message || `Server returnerte ${res.status}`;
        throw new Error(msg);
      }

      if (onRegistered) onRegistered(data);
      navigate("/login"); // bruk react-router navigasjon
    } catch (err) {
      setError(err.message || "Registrering feilet");
      console.error("Register error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-viewport">
      <div className="auth-card">
        <h2 className="auth-title">Opprett konto</h2>

        <form onSubmit={handleSubmit} className="auth-form" aria-label="register form">
          <label className="auth-label">
            Navn
            <input className="auth-input" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
          </label>

          <label className="auth-label">
            E-post
            <input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>

          <label className="auth-label">
            Passord
            <input className="auth-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
          </label>

          <label className="auth-label">
            Bekreft passord
            <input className="auth-input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} autoComplete="new-password" />
          </label>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Oppretter konto…" : "Opprett konto"}
          </button>
        </form>

        <div className="auth-help center">
          <span>Allerede registrert?</span>
          <button className="link-btn" onClick={() => navigate("/login")}>Logg inn</button>
        </div>
      </div>
    </div>
  );
}
