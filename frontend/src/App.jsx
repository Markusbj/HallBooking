import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Home from "./Home";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState("");

  const handleLogin = (email, admin, token) => {
    setIsLoggedIn(true);
    setUserEmail(email);
    setIsAdmin(admin);
    setToken(token);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail("");
    setIsAdmin(false);
    setToken("");
  };

  return (
    <div className="center-container">
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              isLoggedIn ? <Navigate to="/home" /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/login"
            element={
              isLoggedIn ? (
                <Navigate to="/home" />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/register"
            element={
              isLoggedIn ? (
                <Navigate to="/home" />
              ) : (
                <Register />
              )
            }
          />
          <Route
            path="/home"
            element={
              isLoggedIn ? (
                <Home
                  userEmail={userEmail}
                  isAdmin={isAdmin}
                  onLogout={handleLogout}
                  token={token}
                />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;