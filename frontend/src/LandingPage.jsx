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

export default function LandingPage() {
  const isLoggedIn = !!localStorage.getItem("token");
  const { content, loading, error } = usePageContent("landing");
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);

  useEffect(() => {
    // Fetch featured news items (kurs, seminarer, nyheter)
    fetch(`${API}/api/news?published=true&featured=true&limit=6`)
      .then(res => res.json())
      .then(data => {
        setFeaturedItems(data.items || []);
        setLoadingNews(false);
      })
      .catch(err => {
        console.error("Failed to load news items:", err);
        setLoadingNews(false);
      });
  }, []);
  
  // Fallback content if database content is not available
  const heroTitle = getContentValue(content, "hero_title", "Velkommen til TG Tromsø");
  const heroSubtitle = getContentValue(content, "hero_subtitle", "Booking av hall og kurs til din hund");
  const aboutTitle = getContentValue(content, "about_title", "Om TG Tromsø");
  const aboutText1 = getContentValue(content, "about_text1", 
    "TG Tromsø er din lokale hundetreningsklubb som tilbyr profesjonell opplæring og treningshaller for hunder og deres eiere. Med vårt system kan du enkelt se tilgjengelighet, booke treningshaller og melde deg på kurs.");
  const aboutText2 = getContentValue(content, "about_text2", 
    "Vi fokuserer på positiv hundetrening og skaper et trygt og lærerikt miljø for både hunder og eiere i Tromsø-området.");

  if (loading) {
    return (
      <div className="landing-page">
        <div className="hero-section">
          <div className="hero-content">
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div>Laster innhold...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">{heroTitle}</h1>
          <p className="hero-subtitle">
            {heroSubtitle}
          </p>
          {!isLoggedIn && (
            <div className="hero-actions">
              <Link to="/login" className="btn btn-primary btn-large">
                Logg inn
              </Link>
              <Link to="/register" className="btn btn-secondary btn-large">
                Registrer deg
              </Link>
            </div>
          )}
          {isLoggedIn && (
            <div className="hero-actions">
              <Link to="/oversikt" className="btn btn-primary btn-large">
                Gå til oversikt
              </Link>
              <Link to="/bookings" className="btn btn-secondary btn-large">
                Se treningshall
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Kurs, seminarer og nyheter - flyttet til toppen */}
      <div className="courses-section" style={{ padding: "60px 20px" }}>
        <div className="container">
          <h2 className="section-title">Kurs, seminarer og nyheter</h2>
          <p style={{ textAlign: "center", marginBottom: "40px", maxWidth: "800px", margin: "0 auto 40px" }}>
            Se våre tilbud, kommende kurs og seminarer, samt nyheter fra TG Tromsø.
          </p>
          
          {loadingNews ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <div>Laster kurs og nyheter...</div>
            </div>
          ) : featuredItems.length > 0 ? (
            <div className="features-grid">
              {featuredItems.map((item) => (
                <Link
                  key={item.id}
                  to={`/nyheter/${item.id}`}
                  className="feature-card"
                  style={{ textDecoration: "none", color: "inherit", display: "block" }}
                >
                  {item.image_url && (
                    <div style={{ width: "100%", height: "200px", overflow: "hidden", borderRadius: "8px 8px 0 0", marginBottom: "15px" }}>
                      <img
                        src={normalizeImageUrl(item.image_url)}
                        alt={item.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={() => logImageError(normalizeImageUrl(item.image_url), "landing.featured")}
                      />
                    </div>
                  )}
                  <div className="feature-icon">
                    {item.item_type === "kurs" ? "🎓" : item.item_type === "seminar" ? "📚" : "📰"}
                  </div>
                  <h3>{item.title}</h3>
                  {item.excerpt && <p>{item.excerpt}</p>}
                  {item.event_date && (
                    <p style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>
                      {new Date(item.event_date).toLocaleDateString("no-NO", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p>Ingen kurs eller nyheter publisert ennå.</p>
            </div>
          )}
          
          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <Link to="/nyheter" className="btn btn-primary btn-large">
              Se alle kurs og nyheter
            </Link>
          </div>
        </div>
      </div>

      <div className="info-section">
        <div className="container">
          <h2 className="section-title">{aboutTitle}</h2>
          <div className="info-content">
            <p>
              {aboutText1}
            </p>
            <p>
              {aboutText2}
            </p>
          </div>
        </div>
      </div>

      {/* Ny kunde-registrering - hurtiglink */}
      <div className="registration-section" style={{ padding: "60px 20px", background: "var(--bg-secondary, #f5f5f5)" }}>
        <div className="container">
          <h2 className="section-title">Bli ny kunde</h2>
          <p style={{ textAlign: "center", marginBottom: "30px", maxWidth: "600px", margin: "0 auto 30px" }}>
            Send oss en e-post for å bli registrert som ny kunde. Vi tar kontakt med deg så snart som mulig.
          </p>
          <div style={{ textAlign: "center" }}>
            <Link to="/kontakt?type=ny-kunde" className="btn btn-primary btn-large">
              Send registreringsforespørsel
            </Link>
          </div>
        </div>
      </div>

      {/* Henvendelser - hurtiglinker */}
      <div className="inquiry-section" style={{ padding: "60px 20px", background: "var(--bg-secondary, #f5f5f5)" }}>
        <div className="container">
          <h2 className="section-title">Send oss en henvendelse</h2>
          <p style={{ textAlign: "center", marginBottom: "40px", maxWidth: "600px", margin: "0 auto 40px" }}>
            Har du spørsmål om kurs, seminarer, trening eller trenger hjelp med atferdsproblemer? Velg type henvendelse nedenfor.
          </p>
          <div className="features-grid" style={{ maxWidth: "800px", margin: "0 auto" }}>
            <Link to="/kontakt?type=kurs" className="feature-card" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="feature-icon">🎓</div>
              <h3>Kurs</h3>
              <p>Spørsmål om våre kurs? Send oss en melding!</p>
            </Link>
            <Link to="/kontakt?type=seminar" className="feature-card" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="feature-icon">📚</div>
              <h3>Seminar</h3>
              <p>Interessert i våre seminarer? Ta kontakt!</p>
            </Link>
            <Link to="/kontakt?type=trening" className="feature-card" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="feature-icon">🐕</div>
              <h3>Trening</h3>
              <p>Spørsmål om trening? Vi hjelper deg gjerne!</p>
            </Link>
            <Link to="/kontakt?type=atferd" className="feature-card" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="feature-icon">🆘</div>
              <h3>Hjelp til atferdsproblemer</h3>
              <p>Trenger hjelp med atferdsproblemer? Kontakt oss!</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Presentasjon av instruktører og treningsgruppa */}
      <div className="instructors-preview-section" style={{ padding: "60px 20px" }}>
        <div className="container">
          <h2 className="section-title">Våre instruktører og treningsgruppa</h2>
          <p style={{ textAlign: "center", marginBottom: "40px", maxWidth: "800px", margin: "0 auto 40px" }}>
            Møt vårt erfarne team av instruktører som er dedikert til å hjelpe deg og din hund med å oppnå beste resultater.
          </p>
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <Link to="/instruktorer" className="btn btn-primary btn-large">
              Se alle instruktører
            </Link>
          </div>
          <div className="features-grid" style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div className="feature-card">
              <div className="feature-icon">👩‍🏫</div>
              <h3>Erfarne instruktører</h3>
              <p>Alle våre instruktører har lang erfaring og er sertifisert innen hundetrening.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Treningsgruppa</h3>
              <p>Vi jobber sammen som et team for å gi deg og din hund best mulig opplæring.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📜</div>
              <h3>Sertifisering</h3>
              <p>Alle instruktører er sertifisert gjennom Norsk Kennel Klub (NKK).</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h3>Kontinuerlig opplæring</h3>
              <p>Vi deltar årlig på kurs og konferanser for å holde oss oppdatert.</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="site-footer" aria-label="Bunntekst">
        <div className="footer-inner container">
          <small>© {new Date().getFullYear()} TG Tromsø — Hundetrening</small>
          <div className="social-links">
            <a href="https://www.facebook.com/yourpage" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 12.07C22 6.49 17.52 2 11.94 2S2 6.49 2 12.07c0 4.99 3.66 9.13 8.44 9.93v-7.03H8.03v-2.9h2.41V9.41c0-2.39 1.43-3.71 3.62-3.71 1.05 0 2.15.19 2.15.19v2.37h-1.21c-1.19 0-1.56.74-1.56 1.5v1.8h2.65l-.42 2.9h-2.23v7.03C18.34 21.2 22 17.06 22 12.07z"/>
              </svg>
            </a>

            <a href="https://www.instagram.com/yourhandle" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="#E4405F" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.65.16 4.29.9 4.45 4.45.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.16 3.65-.9 4.29-4.45 4.45-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.65-.16-4.29-.9-4.45-4.45-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.16-3.65.9-4.29 4.45-4.45 1.27-.06 1.65-.07 4.85-.07zm0-2.16c-3.24 0-3.7.01-5.01.07-3.8.17-5.5 1.87-5.67 5.67-.06 1.31-.07 1.77-.07 5.01s.01 3.7.07 5.01c.17 3.8 1.87 5.5 5.67 5.67 1.31.06 1.77.07 5.01.07s3.7-.01 5.01-.07c3.8-.17 5.5-1.87 5.67-5.67.06-1.31.07-1.77.07-5.01s-.01-3.7-.07-5.01c-.17-3.8-1.87-5.5-5.67-5.67-1.31-.06-1.77-.07-5.01-.07zm0 5.84c-2.62 0-4.74 2.12-4.74 4.74s2.12 4.74 4.74 4.74 4.74-2.12 4.74-4.74-2.12-4.74-4.74-4.74zm0 7.81c-1.69 0-3.07-1.38-3.07-3.07s1.38-3.07 3.07-3.07 3.07 1.38 3.07 3.07-1.38 3.07-3.07 3.07zm6.44-8.01c-.61 0-1.11-.5-1.11-1.11s.5-1.11 1.11-1.11 1.11.5 1.11 1.11-.5 1.11-1.11 1.11z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
