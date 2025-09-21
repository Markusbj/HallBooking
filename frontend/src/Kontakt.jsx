import React, { useState } from "react";
import { usePageContent, getContentValue } from "./hooks/usePageContent";

export default function Kontakt() {
  const { content, loading, error } = usePageContent("kontakt");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

  // Fallback content if database content is not available
  const pageTitle = getContentValue(content, "page_title", "Kontakt oss");
  const pageSubtitle = getContentValue(content, "page_subtitle", "Vi hjelper deg gjerne med spørsmål om hundetrening");
  const contactTitle = getContentValue(content, "contact_title", "Kontaktinformasjon");
  const addressTitle = getContentValue(content, "address_title", "📍 Adresse");
  const addressText = getContentValue(content, "address_text", "TG Tromsø hundehall<br />Strandgata 59, 3. etasje<br />9008 Tromsø");
  const phoneTitle = getContentValue(content, "phone_title", "📞 Telefon");
  const phoneText = getContentValue(content, "phone_text", "+47 77 64 45 55<br /><small>Åpent: Man-Fre 08:00-20:00, Lør 09:00-16:00</small>");
  const emailTitle = getContentValue(content, "email_title", "📧 E-post");
  const emailText = getContentValue(content, "email_text", "post@tgtromso.no<br />trening@tgtromso.no");
  const hoursTitle = getContentValue(content, "hours_title", "🕒 Åpningstider");
  const socialTitle = getContentValue(content, "social_title", "🌐 Sosiale medier");
  const formTitle = getContentValue(content, "form_title", "Send oss en melding");
  const mapTitle = getContentValue(content, "map_title", "Hvordan finner du oss?");
  const mapText = getContentValue(content, "map_text", "Vi ligger sentralt i Tromsø med lett tilgang både med bil og kollektivtransport. Det er gratis parkering rett utenfor inngangen, og bussholdeplassen \"Strandgata\" er bare 2 minutter gange unna.");
  const locationTitle = getContentValue(content, "location_title", "📍 Vår lokasjon");
  const locationText = getContentValue(content, "location_text", "TG Tromsø hundehall<br />Strandgata 59, 3. etasje<br />9008 Tromsø");

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div>Laster innhold...</div>
          </div>
        </div>
      </div>
    );
  }

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
        <h1>{pageTitle}</h1>
        <p className="page-subtitle">{pageSubtitle}</p>
      </div>

      <div className="page-content">
        <div className="contact-grid">
          <div className="contact-info">
            <h2>{contactTitle}</h2>
            
            <div className="contact-item">
              <h3>{addressTitle}</h3>
              <p dangerouslySetInnerHTML={{ __html: addressText }}></p>
            </div>

            <div className="contact-item">
              <h3>{phoneTitle}</h3>
              <p dangerouslySetInnerHTML={{ __html: phoneText }}></p>
            </div>

            <div className="contact-item">
              <h3>{emailTitle}</h3>
              <p dangerouslySetInnerHTML={{ __html: emailText }}></p>
            </div>

            <div className="contact-item">
              <h3>{hoursTitle}</h3>
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
              <h3>{socialTitle}</h3>
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
            <h2>{formTitle}</h2>
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
          <h2>{mapTitle}</h2>
          <p>
            {mapText}
          </p>
          
          <div className="map-container">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1390.123456789!2d18.9553!3d69.6492!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x45c4c4c4c4c4c4c4%3A0x1234567890abcdef!2sStrandgata%2059%2C%209008%20Troms%C3%B8!5e0!3m2!1sno!2sno!4v1234567890!5m2!1sno!2sno"
              width="100%"
              height="400"
              style={{ border: 0, borderRadius: '12px' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="TG Tromsø lokasjon - Strandgata 59, 3. etasje"
            ></iframe>
            
            <div className="map-info">
              <h3>{locationTitle}</h3>
              <p dangerouslySetInnerHTML={{ __html: locationText }}></p>
              <a 
                href="https://www.google.com/maps/search/?api=1&query=Strandgata+59,+9008+Tromsø" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Åpne i Google Maps
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
