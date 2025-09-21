import React from "react";
import { Link } from "react-router-dom";
import { usePageContent, getContentValue } from "./hooks/usePageContent";

export default function LandingPage() {
  const isLoggedIn = !!localStorage.getItem("token");
  const { content, loading, error } = usePageContent("landing");
  
  // Fallback content if database content is not available
  const heroTitle = getContentValue(content, "hero_title", "Velkommen til TG Tromsø");
  const heroSubtitle = getContentValue(content, "hero_subtitle", "Booking av hall og kurs til din hund");
  const featuresTitle = getContentValue(content, "features_title", "Funksjoner");
  const aboutTitle = getContentValue(content, "about_title", "Om TG Tromsø");
  const aboutText1 = getContentValue(content, "about_text1", 
    "TG Tromsø er din lokale hundetreningsklubb som tilbyr profesjonell opplæring og treningshaller for hunder og deres eiere. Med vårt system kan du enkelt se tilgjengelighet, booke treningshaller og melde deg på kurs.");
  const aboutText2 = getContentValue(content, "about_text2", 
    "Vi fokuserer på positiv hundetrening og skaper et trygt og lærerikt miljø for både hunder og eiere i Tromsø-området.");
  const ctaTitle = getContentValue(content, "cta_title", "Kom i gang i dag");
  const ctaText = getContentValue(content, "cta_text", "Registrer deg for å få tilgang til alle funksjonene i TG Tromsø");

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
                Se treningshaller
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="features-section">
        <div className="container">
          <h2 className="section-title">{featuresTitle}</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Enkel booking</h3>
              <p>Book treningshaller raskt og enkelt med vår intuitive kalender</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🐕</div>
              <h3>Hundetrening</h3>
              <p>Utforsk vårt brede utvalg av hundetreningskurs og opplæring</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Oversikt</h3>
              <p>Få oversikt over alle bookinger og tilgjengelighet for treningshaller</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">ℹ️</div>
              <h3>Om oss</h3>
              <p>Lær mer om TG Tromsø og vår erfaring med hundetrening</p>
            </div>
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

      <div className="cta-section">
        <div className="container">
          <h2 className="section-title">{ctaTitle}</h2>
          <p className="cta-text">
            {ctaText}
          </p>
          {!isLoggedIn && (
            <div className="cta-actions">
              <Link to="/register" className="btn btn-primary btn-large">
                Registrer deg nå
              </Link>
              <Link to="/login" className="btn btn-ghost btn-large">
                Har du allerede en konto? Logg inn
              </Link>
            </div>
          )}
          {isLoggedIn && (
            <div className="cta-actions">
              <Link to="/oversikt" className="btn btn-primary btn-large">
                Se dine bookinger
              </Link>
              <Link to="/bookings" className="btn btn-ghost btn-large">
                Book treningshall
              </Link>
            </div>
          )}
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
