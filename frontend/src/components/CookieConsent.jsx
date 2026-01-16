import React, { useState, useEffect } from 'react';
import './CookieConsent.css';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Show banner if no consent has been given
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowBanner(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    
    // Clear non-essential data when user rejects cookies
    localStorage.removeItem('dark_mode');
    localStorage.removeItem('contact_email');
    localStorage.removeItem('contact_phone');
    
    // Important: If user is logged in and rejects cookies, they should be logged out
    // since session tracking requires cookie/localStorage consent
    const isLoggedIn = !!localStorage.getItem('token');
    if (isLoggedIn) {
      // Inform user that logout is required
      if (window.confirm(
        'Du er for øyeblikket innlogget. For å respektere ditt valg om å avvise cookies, må vi logge deg ut. ' +
        'Du kan fortsatt bruke tjenesten uten å være innlogget. Vil du fortsette med utlogging?'
      )) {
        // Clear all authentication data
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('isAdmin');
        // Reload page to reflect logout state
        window.location.href = '/';
      } else {
        // User cancelled - keep current state but don't close banner
        // They can choose to accept cookies instead
        return;
      }
    }
    
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="cookie-consent-banner">
      <div className="cookie-consent-content">
        <div className="cookie-consent-text">
          <h3>🍪 Informasjonskapsler og lokal lagring</h3>
          <p>
            Vi bruker lokalt lagret data (localStorage) for å:
          </p>
          <ul>
            <li>Lagre din innloggingsstatus og autentiseringstoken (nødvendig for innlogging)</li>
            <li>Spore aktive sesjoner for sikkerhet (maks 2 enheter samtidig)</li>
            <li>Lagre dine preferanser (valgfritt, som mørk modus)</li>
          </ul>
          <div style={{ 
            background: '#fff3cd', 
            padding: '12px', 
            borderRadius: '8px', 
            marginTop: '12px',
            border: '1px solid #ffc107',
            fontSize: '13px'
          }}>
            <strong>⚠️ Hvis du avviser cookies:</strong>
            <ul style={{ margin: '8px 0 0 20px' }}>
              <li>Du kan fortsatt bruke tjenesten, men må være utlogget</li>
              <li>Dine preferanser (som mørk modus) lagres ikke mellom sesjoner</li>
              <li>Session tracking deaktiveres (ingen begrensning på samtidige enheter)</li>
            </ul>
          </div>
          <p style={{ fontSize: '13px', marginTop: '12px', color: '#666' }}>
            <strong>Juridisk grunnlag:</strong> Autentiseringstoken er nødvendig for å levere tjenesten (GDPR Art. 6(1)(b)). 
            Sesjonstracking skjer for sikkerhetsformål (legitimt interesse, GDPR Art. 6(1)(f)). 
            Ved å akseptere samtykker du til lagring av valgfrie preferanser.{' '}
            <a href="/kontakt" onClick={(e) => { e.preventDefault(); setShowDetails(!showDetails); }}>
              Les mer om vår personvernpolitikk og dine rettigheter
            </a>
          </p>
          
          {showDetails && (
            <div className="cookie-details" style={{ marginTop: '15px', padding: '15px', background: '#f5f5f5', borderRadius: '8px', fontSize: '13px' }}>
              <h4>Hva vi lagrer:</h4>
              <ul>
                <li><strong>Autentiseringstoken:</strong> Nødvendig for å holde deg innlogget (utløper etter 25 minutter)</li>
                <li><strong>Sesjonsdata:</strong> For å sikre at du kun er innlogget på maks 2 enheter samtidig</li>
                <li><strong>Preferanser:</strong> Som mørk modus og kontaktopplysninger (hvis du velger å lagre dem)</li>
              </ul>
              <p style={{ marginTop: '10px' }}>
                <strong>Dine rettigheter:</strong> Du har rett til å be om innsyn, retting eller sletting av dine personopplysninger. 
                Kontakt oss via kontaktskjemaet hvis du har spørsmål.
              </p>
            </div>
          )}
        </div>
        
        <div className="cookie-consent-actions">
          <button 
            className="btn btn-primary" 
            onClick={handleAccept}
            style={{ minWidth: '120px' }}
          >
            Aksepter
          </button>
          <button 
            className="btn btn-outline" 
            onClick={handleReject}
            style={{ minWidth: '120px' }}
          >
            Avvis
          </button>
        </div>
      </div>
    </div>
  );
}
