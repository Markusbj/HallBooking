import React, { useState } from "react";

export default function Kontakt() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Her kan du legge til logikk for å sende e-post
    alert("Takk for din henvendelse! Vi kommer tilbake til deg snart.");
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Kontakt oss</h1>
        <p className="page-subtitle">Vi hjelper deg gjerne med spørsmål om hundetrening</p>
      </div>

      <div className="page-content">
        <div className="contact-grid">
          <div className="contact-info">
            <h2>Kontaktinformasjon</h2>
            
            <div className="contact-item">
              <h3>📍 Adresse</h3>
              <p>
                TG Tromsø Hundetrening<br />
                Hundegata 123<br />
                9008 Tromsø
              </p>
            </div>

            <div className="contact-item">
              <h3>📞 Telefon</h3>
              <p>
                <a href="tel:+4777644555">+47 77 64 45 55</a><br />
                <small>Åpent: Man-Fre 08:00-20:00, Lør 09:00-16:00</small>
              </p>
            </div>

            <div className="contact-item">
              <h3>📧 E-post</h3>
              <p>
                <a href="mailto:post@tgtromso.no">post@tgtromso.no</a><br />
                <a href="mailto:trening@tgtromso.no">trening@tgtromso.no</a>
              </p>
            </div>

            <div className="contact-item">
              <h3>🕒 Åpningstider</h3>
              <div className="opening-hours">
                <div className="hours-row">
                  <span>Mandag - Fredag:</span>
                  <span>08:00 - 20:00</span>
                </div>
                <div className="hours-row">
                  <span>Lørdag:</span>
                  <span>09:00 - 16:00</span>
                </div>
                <div className="hours-row">
                  <span>Søndag:</span>
                  <span>Stengt</span>
                </div>
              </div>
            </div>

            <div className="contact-item">
              <h3>🌐 Sosiale medier</h3>
              <div className="social-links">
                <a href="https://www.facebook.com/tgtromso" target="_blank" rel="noopener noreferrer">
                  Facebook
                </a>
                <a href="https://www.instagram.com/tgtromso" target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
              </div>
            </div>
          </div>

          <div className="contact-form-section">
            <h2>Send oss en melding</h2>
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <label htmlFor="name">Navn *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">E-post *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Telefon</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Emne *</label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="form-input"
                >
                  <option value="">Velg emne</option>
                  <option value="trening">Generell trening</option>
                  <option value="valp">Valp-trening</option>
                  <option value="agility">Agility</option>
                  <option value="atferd">Atferdsproblemer</option>
                  <option value="booking">Booking av hall</option>
                  <option value="annet">Annet</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="message">Melding *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  className="form-input"
                  placeholder="Beskriv ditt spørsmål eller behov..."
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary">
                Send melding
              </button>
            </form>
          </div>
        </div>

        <section className="content-section">
          <h2>Hvordan finner du oss?</h2>
          <p>
            Vi ligger sentralt i Tromsø med lett tilgang både med bil og kollektivtransport. 
            Det er gratis parkering rett utenfor inngangen, og bussholdeplassen "Hundegata" 
            er bare 2 minutter gange unna.
          </p>
          <div className="map-placeholder">
            <div className="map-content">
              <h3>📍 Kart</h3>
              <p>Hundegata 123, 9008 Tromsø</p>
              <p><small>Klikk for å åpne i Google Maps</small></p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
