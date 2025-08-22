import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoImage from "./assets/logo.png";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchUserInfo = async (token) => {
    try {
      console.log("Fetching user info with token:", token);
      const res = await fetch("http://localhost:8000/users/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("User info response status:", res.status);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const user = await res.json();
      console.log("User data:", user);
      return user.is_superuser || user.role === "admin";
    } catch (err) {
      console.error("Error fetching user info:", err);
      throw err;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      console.log("Attempting login for:", email);
      
      // Step 1: Login
      const res = await fetch("http://localhost:8000/auth/jwt/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: email, password }),
      });
      
      console.log("Login response status:", res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Login failed:", errorData);
        throw new Error(errorData.detail || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log("Login response data:", data);
      
      if (!data.access_token) {
        throw new Error("Ingen access token mottatt fra server");
      }
      
      const accessToken = data.access_token;
      console.log("Got access token, fetching user info...");
      
      // Step 2: Get user info
      const isAdmin = await fetchUserInfo(accessToken);
      console.log("User is admin:", isAdmin);
      
      // Step 3: Call onLogin
      console.log("Calling onLogin...");
      onLogin(email, isAdmin, accessToken);
      
      // Step 4: Navigate
      console.log("Navigating to /home...");
      navigate("/home");
      
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
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
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Passord</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
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