import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Home from "./Home";
import Oversikt from "./Oversikt";
import Bookings from "./Bookings";
import PublicBookings from "./PublicBookings";
import LandingPage from "./LandingPage";
import AdminPanel from "./AdminPanel";
import NavBar from "./NavBar";
import Account from "./Account";
import OmOss from "./OmOss";
import Instruktorer from "./Instruktorer";
import Kontakt from "./Kontakt";
import Nyheter from "./Nyheter";
import NyhetDetail from "./NyhetDetail";
import CookieConsent from "./components/CookieConsent";
import PrivacyConsentDialog from "./components/PrivacyConsentDialog";
import Personvern from "./Personvern";
import "./styles/global.css";
import "./components/NavBar.css";
import "./components/Home.css";
import "./components/Bookings.css";
import "./components/LandingPage.css";
import "./components/Pages.css";
import { useInactivityLogout } from "./hooks/useInactivityLogout";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(true); // Default to true to avoid showing dialog if not logged in
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { setIsLoggedIn(false); return; }

    // Verifiser token mot backend
    fetch(`${API}/users/me`, {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("invalid token");
        return res.json();
      })
      .then(async (user) => {
        setIsLoggedIn(true);
        setToken(t);
        setUserEmail(user.email || "");
        setIsAdmin(Boolean(user.is_superuser || user.is_admin));
        
        // Check if user has accepted privacy policy
        const hasAcceptedPrivacy = user.privacy_accepted === true;
        setPrivacyAccepted(hasAcceptedPrivacy);
        
        // Show privacy dialog if user hasn't accepted yet
        if (!hasAcceptedPrivacy) {
          setShowPrivacyDialog(true);
        }
        
        // Update session activity on backend
        try {
          await fetch(`${API}/api/auth/update-session`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${t}` },
          });
        } catch (err) {
          // Don't fail if session update fails, just log it
          console.warn('Failed to update session activity:', err);
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("isAdmin");
        setIsLoggedIn(false);
        setToken("");
      });
  }, []);

  const handleLogin = (email, admin, tok) => {
    // GDPR: Authentication tokens are considered "strictly necessary" cookies
    // under GDPR Article 5(3) ePrivacy Directive, but we still need to:
    // 1. Inform users about what we store
    // 2. Only use data for the stated purpose (authentication)
    // 3. Respect user's right to delete their data
    
    // Store authentication data (necessary for service delivery)
    localStorage.setItem("token", tok);
    localStorage.setItem("userEmail", email || "");
    localStorage.setItem("isAdmin", admin ? "true" : "false");
    setIsLoggedIn(true); 
    setUserEmail(email || ""); 
    setIsAdmin(Boolean(admin)); 
    setToken(tok);
    
    // Check privacy acceptance status
    fetch(`${API}/users/me`, {
      headers: { Authorization: `Bearer ${tok}` },
    })
      .then(res => res.json())
      .then(user => {
        const hasAcceptedPrivacy = user.privacy_accepted === true;
        setPrivacyAccepted(hasAcceptedPrivacy);
        if (!hasAcceptedPrivacy) {
          setShowPrivacyDialog(true);
        }
      })
      .catch(() => {
        // If we can't check, assume not accepted to be safe
        setPrivacyAccepted(false);
        setShowPrivacyDialog(true);
      });
    
    // Note: Session tracking on backend happens automatically via API calls
    // This is covered under "legitimate interest" for security purposes
    // as long as we inform users (which we do via cookie consent banner)
  };

  const handlePrivacyAccepted = () => {
    setPrivacyAccepted(true);
    setShowPrivacyDialog(false);
  };

  const handleLogout = () => {
    // Delete session on backend
    const currentToken = localStorage.getItem("token");
    if (currentToken) {
      fetch(`${API}/api/auth/sessions`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${currentToken}` },
      })
      .then(res => res.json())
      .then(data => {
        // Try to delete the current session (best effort, don't wait)
        if (data.sessions && data.sessions.length > 0) {
          const currentSession = data.sessions[0];
          fetch(`${API}/api/auth/sessions/${currentSession.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${currentToken}` },
          }).catch(() => {}); // Ignore errors on logout
        }
      })
      .catch(() => {}); // Ignore errors
    }
    
    localStorage.removeItem("token"); 
    localStorage.removeItem("userEmail"); 
    localStorage.removeItem("isAdmin");
    setIsLoggedIn(false); 
    setUserEmail(""); 
    setIsAdmin(false); 
    setToken("");
    window.location.href = "/";
  };

  // Setup inactivity logout (20 minutes of inactivity)
  useInactivityLogout(handleLogout, 20);

  return (
    <>
      <NavBar />
      <CookieConsent />
      {showPrivacyDialog && isLoggedIn && !privacyAccepted && (
        <PrivacyConsentDialog 
          userEmail={userEmail} 
          token={token} 
          onAccepted={handlePrivacyAccepted}
        />
      )}
      <div className="app-content">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={isLoggedIn ? <Navigate to="/oversikt" replace /> : <Login onLogin={handleLogin} />} />
          <Route path="/register" element={isLoggedIn ? <Navigate to="/oversikt" replace /> : <Register />} />
          <Route path="/oversikt" element={isLoggedIn ? <Oversikt userEmail={userEmail} isAdmin={isAdmin} onLogout={handleLogout} token={token} /> : <Navigate to="/login" replace />} />
          <Route path="/home" element={isLoggedIn ? <Home userEmail={userEmail} isAdmin={isAdmin} onLogout={handleLogout} token={token} /> : <Navigate to="/login" replace />} />
          <Route path="/bookings" element={isLoggedIn ? <Bookings token={token} /> : <PublicBookings />} />
          <Route path="/om-oss" element={<OmOss />} />
          <Route path="/instruktorer" element={<Instruktorer />} />
          <Route path="/kontakt" element={<Kontakt />} />
          <Route path="/nyheter" element={<Nyheter />} />
          <Route path="/nyheter/:id" element={<NyhetDetail />} />
          <Route path="/personvern" element={<Personvern />} />
          <Route path="/admin" element={isLoggedIn && isAdmin ? <AdminPanel token={token} /> : <Navigate to="/" replace />} />
          <Route path="/account" element={isLoggedIn ? <Account token={token} /> : <Navigate to="/login" replace />} />
        </Routes>
      </div>
    </>
  );
}

export default App;