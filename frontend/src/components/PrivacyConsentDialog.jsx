import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './PrivacyConsentDialog.css';

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function PrivacyConsentDialog({ userEmail, token, onAccepted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAccept = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API}/users/me`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          privacy_accepted: true,
          privacy_accepted_date: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Kunne ikke lagre personvernaksept');
      }

      if (onAccepted) {
        onAccepted();
      }
    } catch (err) {
      setError(err.message || 'En feil oppstod');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="privacy-consent-overlay">
      <div className="privacy-consent-dialog">
        <div className="privacy-consent-header">
          <h2>🔒 Personvernserklæring</h2>
        </div>
        
        <div className="privacy-consent-content">
          <p>
            Velkommen til TG Tromsø! For å kunne bruke tjenesten må du akseptere vår personvernserklæring.
          </p>
          
          <div className="privacy-summary">
            <h3>Kort oppsummering:</h3>
            <ul>
              <li>Vi behandler dine personopplysninger for å levere booking-tjenesten</li>
              <li>Vi lagrer autentiseringstoken og sesjonsdata for sikkerhet</li>
              <li>Dine data slettes når du logger ut (med unntak av booking-historikk)</li>
              <li>Du har rett til innsyn, retting og sletting av dine data</li>
            </ul>
          </div>

          <div className="privacy-links">
            <p>
              <strong>Les hele personvernserklæringen:</strong>{' '}
              <Link to="/personvern" target="_blank" className="privacy-link">
                Åpne personvernserklæring i ny fane
              </Link>
            </p>
          </div>

          {error && (
            <div className="privacy-error">
              ⚠️ {error}
            </div>
          )}

          <div className="privacy-consent-footer">
            <p className="privacy-note">
              Ved å klikke "Aksepter" samtykker du til vår personvernserklæring og behandling av dine personopplysninger i henhold til GDPR.
            </p>
            <div className="privacy-actions">
              <button 
                className="btn btn-primary" 
                onClick={handleAccept}
                disabled={loading}
              >
                {loading ? 'Lagrer...' : 'Aksepter personvernserklæring'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
