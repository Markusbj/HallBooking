import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  function formatErrorResponse(data, statusText) {
    if (!data) return statusText || "Login failed";
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data)) {
      return data
        .map((err) =>
          err.msg ? `${(err.loc || []).join(".")}: ${err.msg}` : JSON.stringify(err)
        )
        .join("; ");
    }
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((err) => (err.msg ? `${(err.loc || []).join(".")}: ${err.msg}` : JSON.stringify(err)))
        .join("; ");
    }
    return JSON.stringify(data);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    // send as application/x-www-form-urlencoded because fastapi-users expects form fields
    const body = new URLSearchParams();
    body.append("username", email);
    body.append("password", password);

    try {
      const res = await fetch(`${API}/jwt/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (!res.ok) {
        let data = null;
        try { data = await res.json(); } catch {}
        throw new Error(formatErrorResponse(data, res.statusText));
      }

      const data = await res.json();
      const token = data.access_token || data.token || data.accessToken || "";

      // optionally fetch user info to determine admin flag
      let isAdmin = false;
      if (token) {
        try {
          const meRes = await fetch(`${API}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            isAdmin = Boolean(meData.is_superuser || meData.is_admin || false);
          }
        } catch {}
      }

      if (onLogin) onLogin(email, isAdmin, token);
      else {
        localStorage.setItem("token", token);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("isAdmin", isAdmin ? "true" : "false");
      }

      navigate("/home", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    }
  }

  return (
    <div className="center-container">
      <div className="auth-box">
        <h2>Logg inn</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>E-post</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>
          <div className="form-group">
            <label>Passord</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button className="submit-btn" type="submit">Logg inn</button>
        </form>
        <p style={{ marginTop: 12 }}>
          Ikke registrert? <Link to="/register">Opprett konto</Link>
        </p>
      </div>
    </div>
  );
}