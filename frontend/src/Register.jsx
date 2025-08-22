import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoImage from "./assets/logo.png";

// Velg én:
 const API_BASE = "http://127.0.0.1:8000";
// const API_BASE = "/api";

// Samme helper som i Login – importer evt. fra egen fil
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

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await apiFetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      await res.json().catch(() => ({})); // noen backends returnerer ikke noe her
      setSuccess("Registrering vellykket! Du kan nå logge inn.");

      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.message || "Uventet feil under registrering.");
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

      <h2>Registrer ny bruker</h2>
      <form onSubmit={handleRegister}>
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
            name="new-password"
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        {error && <div className="error-msg">{error}</div>}
        {success && <div className="success-msg">{success}</div>}
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? "Registrerer..." : "Registrer"}
        </button>
      </form>

      <div className="auth-links">
        <a href="/login" onClick={e => { e.preventDefault(); navigate("/login"); }}>
          Allerede bruker? Logg inn her
        </a>
      </div>
    </div>
  );
}

export default Register;
