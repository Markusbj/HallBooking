import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePageContent, getContentValue } from "./hooks/usePageContent";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function normalizeImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${API}${url}`;
  return `${API}/${url}`;
}

function logImageError(url, context) {
  console.error("[image] failed to load", { context, url });
}

export default function Nyheter() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("alle"); // "alle", "kurs", "seminar", "nyhet"
  const [timeFilter, setTimeFilter] = useState("alle"); // "alle", "kommende", "tidligere"
  const { content } = usePageContent("nyheter");

  useEffect(() => {
    loadItems();
  }, [filter, timeFilter]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "alle") {
        params.append("item_type", filter);
      }
      params.append("published", "true");

      const response = await fetch(`${API}/api/news?${params.toString()}`);
      const data = await response.json();
      
      let filteredItems = data.items || [];
      
      // Filter by time
      const now = new Date();
      if (timeFilter === "kommende") {
        filteredItems = filteredItems.filter(item => {
          if (!item.event_date) return false;
          return new Date(item.event_date) >= now;
        });
      } else if (timeFilter === "tidligere") {
        filteredItems = filteredItems.filter(item => {
          if (!item.event_date) return true; // Items without event_date are considered "tidligere"
          return new Date(item.event_date) < now;
        });
      }
      
      setItems(filteredItems);
    } catch (err) {
      console.error("Failed to load news items:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      kurs: "Kurs",
      seminar: "Seminar",
      nyhet: "Nyhet"
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type) => {
    const icons = {
      kurs: "🎓",
      seminar: "📚",
      nyhet: "📰"
    };
    return icons[type] || "📄";
  };

  const pageTitle = getContentValue(content, "pageTitle", "Kurs, seminarer og nyheter");
  const pageSubtitle = getContentValue(content, "pageSubtitle", "Se alle våre kurs, seminarer og nyheter");

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{pageTitle}</h1>
        <p className="page-subtitle">{pageSubtitle}</p>
      </div>

      <div className="page-content">
        {/* Filters */}
        <div className="news-filters" style={{ marginBottom: "40px", display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Type:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="form-input"
              style={{ minWidth: "150px", width: "100%" }}
            >
              <option value="alle">Alle</option>
              <option value="kurs">Kurs</option>
              <option value="seminar">Seminarer</option>
              <option value="nyhet">Nyheter</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Tid:</label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="form-input"
              style={{ minWidth: "150px", width: "100%" }}
            >
              <option value="alle">Alle</option>
              <option value="kommende">Kommende</option>
              <option value="tidligere">Tidligere</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div>Laster...</div>
          </div>
        ) : items.length > 0 ? (
          <div className="features-grid news-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            {items.map((item) => (
              <Link
                key={item.id}
                to={`/nyheter/${item.id}`}
                className="feature-card"
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                {item.image_url && (
                  <div style={{ width: "100%", height: "200px", overflow: "hidden", borderRadius: "8px 8px 0 0", marginBottom: "15px" }}>
                    <img
                      src={normalizeImageUrl(item.image_url)}
                      alt={item.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={() => logImageError(normalizeImageUrl(item.image_url), "news.list")}
                    />
                  </div>
                )}
                <div className="feature-icon">{getTypeIcon(item.item_type)}</div>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px", textTransform: "uppercase" }}>
                  {getTypeLabel(item.item_type)}
                </div>
                <h3>{item.title}</h3>
                {item.excerpt && <p>{item.excerpt}</p>}
                {item.event_date && (
                  <p style={{ fontSize: "14px", color: "#666", marginTop: "10px", fontWeight: "500" }}>
                    📅 {new Date(item.event_date).toLocaleDateString("no-NO", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                )}
                <div style={{ marginTop: "15px", color: "var(--primary-color, #007bff)", fontWeight: "500" }}>
                  Les mer →
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p>Ingen kurs, seminarer eller nyheter funnet med de valgte filtrene.</p>
          </div>
        )}
      </div>
    </div>
  );
}
