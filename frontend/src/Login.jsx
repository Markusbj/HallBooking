import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loginPaths = [
    "/auth/jwt/login", // Correct FastAPI Users endpoint
    "/jwt/login",
    "/auth/login",
    "/auth/token",
    "/token",
    "/login"
  ];

  async function tryLogin(path) {
    const url = `${API}${path}`;
    try {
      // Create form data for FastAPI Users authentication
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // non-OK -> return object indicating failure but include message
        return { ok: false, status: res.status, message: data.detail || data.message || null };
      }
      // success - normalize token property names
      const token = data.access_token || data.token || data.accessToken || data.access;
      return { ok: true, data, token };
    } catch (e) {
      return { ok: false, error: e };
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let result;
      for (const p of loginPaths) {
        result = await tryLogin(p);
        if (result.ok) {
          const token = result.token;
          if (!token) {
            // some backends return user object on login endpoint expecting form data; skip
            continue;
          }
          localStorage.setItem("token", token);
          
          // Fetch user info after successful login
          try {
            const userRes = await fetch(`${API}/users/me`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (userRes.ok) {
              const userData = await userRes.json();
              if (onLogin) {
                onLogin(userData.email, userData.is_superuser, token);
              }
            } else {
              // Fallback if user info fetch fails
              if (onLogin) onLogin(email, false, token);
            }
          } catch (err) {
            // Fallback if user info fetch fails
            if (onLogin) onLogin(email, false, token);
          }
          
          navigate("/home", { replace: true });
          return;
        }
        // if 404 or 405, try next; if other error with message, capture for feedback
      }

      // If we get here, no path succeeded
      const msg = result && (result.message || (result.error && result.error.message)) ? (result.message || result.error.message) : "Innlogging mislyktes — sjekk backend-ruter";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-viewport">
      <div className="auth-card">
        <h2 className="auth-title">Logg inn</h2>

        <form onSubmit={handleSubmit} className="auth-form" aria-label="login form">
          <label className="auth-label">
            E-post
            <input
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="auth-label">
            Passord
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Logger inn…" : "Logg inn"}
          </button>
        </form>

        <div className="auth-help center">
          <button className="link-btn" onClick={() => (window.location.href = "/forgot-password")}>
            Glemt passord?
          </button>
          <span className="sep">•</span>
          <button className="link-btn" onClick={() => (window.location.href = "/register")}>
            Har du ikke bruker? Registrer
          </button>
        </div>
      </div>
    </div>
  );
}