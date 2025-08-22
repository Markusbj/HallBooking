import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoImage from "./assets/logo.png";

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
    
    console.log("🚀 Starting registration for:", email);
    
    try {
      console.log("�� Sending request to /register...");
      
      const res = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      console.log("📥 Response received:", res.status, res.statusText);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("❌ Registration failed:", errorData);
        throw new Error(errorData.detail || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const result = await res.json();
      console.log("✅ Registration successful:", result);
      
      setSuccess("Registrering vellykket! Du kan nå logge inn.");
      
      setTimeout(() => {
        console.log("🔄 Navigating to login...");
        navigate("/login");
      }, 1500);
      
    } catch (err) {
      console.error("�� Registration error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      console.log("🏁 Registration process finished");
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