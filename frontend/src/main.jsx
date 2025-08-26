import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
//import "./App.css";
import "./styles/global.css"; // <-- sørg for global styles lastes
import "./components/NavBar.css";
import "./components/Home.css";
import "./components/Bookings.css";


createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);