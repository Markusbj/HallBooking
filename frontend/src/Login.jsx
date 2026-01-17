import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  function base64UrlEncode(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  async function sha256(plain) {
    const data = new TextEncoder().encode(plain);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return base64UrlEncode(hash);
  }

  function generateCodeVerifier(length = 64) {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    const random = new Uint8Array(length);
    crypto.getRandomValues(random);
    return Array.from(random, (x) => charset[x % charset.length]).join("");
  }

  async function authorizePkce(codeChallenge) {
    const url = `${API}/auth/authorize`;
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);
    formData.append("code_challenge", codeChallenge);
    formData.append("code_challenge_method", "S256");
    formData.append("response_mode", "json");

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, status: res.status, message: data.detail || data.message || null };
    }
    return { ok: true, data };
  }

  async function exchangeToken(code, codeVerifier) {
    const url = `${API}/auth/token`;
    const formData = new URLSearchParams();
    formData.append("grant_type", "authorization_code");
    formData.append("code", code);
    formData.append("code_verifier", codeVerifier);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, status: res.status, message: data.detail || data.message || null };
    }
    const token = data.access_token || data.token || data.accessToken || data.access;
    return { ok: true, data, token };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await sha256(codeVerifier);
      const authResult = await authorizePkce(codeChallenge);
      if (!authResult.ok) {
        const msg = authResult.message || "Innlogging mislyktes. Sjekk at e-post og passord er riktig.";
        setError(msg);
        return;
      }

      const tokenResult = await exchangeToken(authResult.data.code, codeVerifier);
      if (!tokenResult.ok || !tokenResult.token) {
        const msg = tokenResult.message || "Kunne ikke hente token etter innlogging.";
        setError(msg);
        return;
      }


      // Fetch user info after successful login
      try {
        const userRes = await fetch(`${API}/users/me`, {
          credentials: "include",
        });
        if (userRes.ok) {
          const userData = await userRes.json();

          // Register session on backend ONLY if user has accepted cookies
          // Session tracking requires consent under GDPR
              const cookieConsent = localStorage.getItem('cookieConsent');
          if (cookieConsent === 'accepted') {
            try {
              await fetch(`${API}/api/auth/register-session`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                    credentials: "include",
              });
            } catch (err) {
              // Don't fail login if session registration fails
              console.warn('Failed to register session:', err);
            }
          }

              if (onLogin) {
                onLogin(userData.email, userData.is_superuser);
              }
        } else {
          // Fallback if user info fetch fails
              if (onLogin) onLogin(email, false);
        }
      } catch (err) {
        // Fallback if user info fetch fails
            if (onLogin) onLogin(email, false);
      }

      navigate("/home", { replace: true });
      return;
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
            <div className="password-input-container">
              <input
                className="auth-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Skjul passord" : "Vis passord"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                )}
              </button>
            </div>
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