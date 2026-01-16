import React, { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function Account() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState({ 
    email: "", 
    full_name: "", 
    phone: "",
    is_superuser: false,
    is_verified: false,
    is_active: true
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const token = localStorage.getItem("token") || "";

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API}/users/me`, { 
          headers: token ? { Authorization: `Bearer ${token}` } : {} 
        });
        if (!res.ok) throw new Error(await res.text().catch(()=>res.statusText));
        const data = await res.json();
        setProfile({ 
          email: data.email || "", 
          full_name: data.full_name || "", 
          phone: data.phone || "",
          is_superuser: data.is_superuser || false,
          is_verified: data.is_verified || false,
          is_active: data.is_active || true
        });
      } catch (err) {
        setError(err.message || "Kunne ikke hente profil");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  async function save() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`${API}/users/me`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json", 
          ...(token ? { Authorization: `Bearer ${token}` } : {}) 
        },
        body: JSON.stringify({ 
          full_name: profile.full_name, 
          phone: profile.phone 
        }),
      });
      if (!res.ok) throw new Error(await res.text().catch(()=>res.statusText));
      const data = await res.json();
      setProfile(p => ({ ...p, ...data }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || "Feil ved lagring");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setProfile(prev => ({
      ...prev,
      full_name: "",
      phone: ""
    }));
  }

  async function changePassword(e) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("Nye passord matcher ikke");
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setPasswordError("Nytt passord må være minst 8 tegn");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch(`${API}/users/me/change-password`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          ...(token ? { Authorization: `Bearer ${token}` } : {}) 
        },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Kunne ikke endre passord' }));
        throw new Error(errorData.detail || 'Kunne ikke endre passord');
      }
      
      setPasswordSuccess(true);
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: ""
      });
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (err) {
      setPasswordError(err.message || "Feil ved passordendring");
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="account-container">
      <div className="account-header">
        <h1 className="account-title">Kontoinnstillinger</h1>
        <p className="account-subtitle">Administrer din profil og kontoinnstillinger</p>
      </div>

      <div className="account-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Henter profilinformasjon...</p>
          </div>
        ) : (
          <div className="account-sections">
            {/* Profile Information Section */}
            <section className="account-section">
              <div className="section-header">
                <h2 className="section-title">
                  <span className="section-icon">👤</span>
                  Profilinformasjon
                </h2>
                <p className="section-description">Oppdater din personlige informasjon</p>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">E-postadresse</label>
                  <div className="form-field">
                    <input 
                      type="email" 
                      value={profile.email} 
                      readOnly 
                      className="form-input readonly"
                    />
                    <span className="field-note">E-postadressen kan ikke endres</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Fullt navn</label>
                  <input 
                    type="text" 
                    value={profile.full_name} 
                    onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                    className="form-input"
                    placeholder="Skriv inn ditt fulle navn"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Telefonnummer</label>
                  <input 
                    type="tel" 
                    value={profile.phone} 
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    className="form-input"
                    placeholder="Skriv inn ditt telefonnummer"
                  />
                </div>
              </div>
            </section>

            {/* Account Status Section */}
            <section className="account-section">
              <div className="section-header">
                <h2 className="section-title">
                  <span className="section-icon">🔒</span>
                  Kontostatus
                </h2>
                <p className="section-description">Din kontos nåværende status</p>
              </div>
              
              <div className="status-grid">
                <div className="status-item">
                  <div className="status-label">Kontotype</div>
                  <div className={`status-value ${profile.is_superuser ? 'admin' : 'user'}`}>
                    {profile.is_superuser ? 'Administrator' : 'Standard bruker'}
                  </div>
                </div>
                
                <div className="status-item">
                  <div className="status-label">E-post bekreftet</div>
                  <div className={`status-value ${profile.is_verified ? 'verified' : 'unverified'}`}>
                    {profile.is_verified ? 'Ja' : 'Nei'}
                  </div>
                </div>
                
                <div className="status-item">
                  <div className="status-label">Konto aktiv</div>
                  <div className={`status-value ${profile.is_active ? 'active' : 'inactive'}`}>
                    {profile.is_active ? 'Ja' : 'Nei'}
                  </div>
                </div>
              </div>
            </section>

            {/* Change Password Section */}
            <section className="account-section">
              <div className="section-header">
                <h2 className="section-title">
                  <span className="section-icon">🔐</span>
                  Endre passord
                </h2>
                <p className="section-description">Oppdater ditt passord</p>
              </div>
              
              <form onSubmit={changePassword} className="form-grid">
                <div className="form-group">
                  <label className="form-label">Nåværende passord</label>
                  <input 
                    type="password" 
                    value={passwordForm.current_password} 
                    onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                    className="form-input"
                    required
                    placeholder="Skriv inn ditt nåværende passord"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nytt passord</label>
                  <input 
                    type="password" 
                    value={passwordForm.new_password} 
                    onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                    className="form-input"
                    required
                    minLength={8}
                    placeholder="Minst 8 tegn"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Bekreft nytt passord</label>
                  <input 
                    type="password" 
                    value={passwordForm.confirm_password} 
                    onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                    className="form-input"
                    required
                    minLength={8}
                    placeholder="Bekreft det nye passordet"
                  />
                </div>

                {passwordError && (
                  <div className="alert alert-error" style={{ gridColumn: '1 / -1' }}>
                    <span className="alert-icon">⚠️</span>
                    <span className="alert-message">{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="alert alert-success" style={{ gridColumn: '1 / -1' }}>
                    <span className="alert-icon">✅</span>
                    <span className="alert-message">Passord endret vellykket!</span>
                  </div>
                )}

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={changingPassword}
                  >
                    {changingPassword ? (
                      <>
                        <span className="btn-spinner"></span>
                        Endrer passord...
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">🔐</span>
                        Endre passord
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            {/* Actions Section */}
            <section className="account-section">
              <div className="section-header">
                <h2 className="section-title">
                  <span className="section-icon">⚙️</span>
                  Handlinger
                </h2>
                <p className="section-description">Administrer din konto</p>
              </div>
              
              <div className="action-buttons">
                <button 
                  className="btn btn-primary" 
                  onClick={save} 
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="btn-spinner"></span>
                      Lagrer...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">💾</span>
                      Lagre endringer
                    </>
                  )}
                </button>
                
                <button 
                  className="btn btn-outline" 
                  onClick={resetForm}
                  disabled={saving}
                >
                  <span className="btn-icon">🔄</span>
                  Tilbakestill
                </button>
              </div>
            </section>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span className="alert-message">{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            <span className="alert-message">Profil oppdatert vellykket!</span>
          </div>
        )}
      </div>
    </div>
  );
}