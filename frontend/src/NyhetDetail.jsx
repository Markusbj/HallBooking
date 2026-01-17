import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function normalizeImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${API}${url}`;
  return `${API}/${url}`;
}

function normalizeContentImages(html) {
  if (!html) return html;
  return html.replace(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi, (match, src) => {
    const normalized = normalizeImageUrl(src);
    return match.replace(src, normalized);
  });
}

export default function NyhetDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/news/${id}`);
      if (response.ok) {
        const data = await response.json();
        setItem(data);
      }
    } catch (err) {
      console.error("Failed to load news item:", err);
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

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div>Laster...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Ikke funnet</h1>
          <p className="page-subtitle">Kurset eller nyheten ble ikke funnet.</p>
          <Link to="/nyheter" className="btn btn-primary">
            Tilbake til oversikt
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ marginBottom: "20px" }}>
          <Link to="/nyheter" style={{ color: "var(--primary-color, #007bff)", textDecoration: "none" }}>
            ← Tilbake til oversikt
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          <span style={{ fontSize: "24px" }}>{getTypeIcon(item.item_type)}</span>
          <span style={{ fontSize: "14px", color: "#666", textTransform: "uppercase" }}>
            {getTypeLabel(item.item_type)}
          </span>
        </div>
        <h1>{item.title}</h1>
        {item.event_date && (
          <p style={{ fontSize: "18px", color: "#666", marginTop: "10px" }}>
            📅 {new Date(item.event_date).toLocaleDateString("no-NO", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </p>
        )}
      </div>

      <div className="page-content">
        {item.image_url && (
          <div style={{ marginBottom: "30px", borderRadius: "12px", overflow: "hidden" }}>
            <img
              src={normalizeImageUrl(item.image_url)}
              alt={item.title}
              style={{ width: "100%", maxHeight: "500px", objectFit: "cover" }}
            />
          </div>
        )}

        <div
          className="content-section news-content"
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            lineHeight: "1.8",
            fontSize: "18px"
          }}
          dangerouslySetInnerHTML={{ __html: normalizeContentImages(item.content) }}
        />

        <div style={{ marginTop: "40px", textAlign: "center" }}>
          <Link to="/nyheter" className="btn btn-primary">
            Se alle kurs og nyheter
          </Link>
        </div>
      </div>
    </div>
  );
}
