import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoImage from "./assets/logo.png";

// Velg én:
 const API_BASE = "http://127.0.0.1:8000";
//const API_BASE = "/api";

// Felles fetch med timeout + bedre feiltekster
async function apiFetch(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) {
      let msg = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const data = await res.json();
        if (Array.isArray(data.detail)) msg = data.detail.map(d => d.msg).join("; ");
        else if (data.detail) msg = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
      } catch {}
      throw new Error(msg);
    }
    return res;
  } catch (err) {
    if (err.name === "AbortError") throw new Error("Tidsavbrudd mot API (sjekk URL/CORS).");
    if (err instanceof TypeError) throw new Error("Nettverksfeil (mulig CORS/Mixed Content/feil URL).");
    throw err;
  } finally {
    clearTimeout(id);
  }
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchUserInfo = async (token) => {
    const res = await apiFetch(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = await res.json();
    return user.is_superuser || user.role === "admin";
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1) Login
      const res = await apiFetch(`${API_BASE}/jwt/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: email, password }),
      });
      const data = await res.json();
      if (!data.access_token) throw new Error("Ingen access token mottatt fra server");

      // 2) Hent brukerinfo
      const isAdmin = await fetchUserInfo(data.access_token);

      // 3) Lagring + navigasjon
      onLogin(email, isAdmin, data.access_token);
      navigate("/home");
    } catch (err) {
      setError(err.message || "Uventet feil under innlogging.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-box">
      <div className="logo">
        <img src={logoImage} alt="HallBooking Logo" />
      </div>
      <div className="logo-subtitle">Administrasjonssystem</div>

      <h2>Logg inn</h2>
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label>E-post</label>
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label>Passord</label>
          <input
            type="password"
            name="current-password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        {error && <div className="error-msg">{error}</div>}
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? "Logger inn..." : "Logg inn"}
        </button>
      </form>

      <div className="auth-links">
        <a href="/register" onClick={e => { e.preventDefault(); navigate("/register"); }}>
          Har du ikke bruker? Registrer deg her
        </a>
      </div>
    </div>
  );
}

export default Login;