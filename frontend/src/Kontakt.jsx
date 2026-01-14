import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { usePageContent, getContentValue } from "./hooks/usePageContent";

export default function Kontakt() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { content, loading, error } = usePageContent("kontakt");
  const [formType, setFormType] = useState(searchParams.get("type") || "");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);

  // Map URL query params to form subjects
  useEffect(() => {
    const urlType = searchParams.get("type");
    if (urlType) {
      const typeMap = {
        "ny-kunde": "Ny kunde-registrering",
        "kurs": "Kurs",
        "seminar": "Seminar",
        "trening": "Trening",
        "atferd": "Hjelp til atferdsproblemer"
      };
      if (typeMap[urlType]) {
        setFormType(urlType);
        setFormData(prev => ({ ...prev, subject: typeMap[urlType] }));
      }
    }
  }, [searchParams]);

  // Fallback content if database content is not available
  const pageTitle = getContentValue(content, "page_title", "Kontakt oss");
  const pageSubtitle = getContentValue(content, "page_subtitle", "Vi hjelper deg gjerne med spørsmål om hundetrening");
  const contactTitle = getContentValue(content, "contact_title", "Kontaktinformasjon");
  const addressTitle = getContentValue(content, "address_title", "📍 Adresse");
  const addressText = getContentValue(content, "address_text", "TG Tromsø hundehall<br />Strandgata 59, 3. etasje<br />9008 Tromsø");
  const phoneTitle = getContentValue(content, "phone_title", "📞 Telefon");
  const phoneText = getContentValue(content, "phone_text", "+47 77 64 45 55<br /><small>Åpent: Man-Fre 08:00-20:00, Lør 09:00-16:00</small>");
  const emailTitle = getContentValue(content, "email_title", "📧 E-post");
  const emailText = getContentValue(content, "email_text", "tgnrk@gmail.com");
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

  const handleFormTypeChange = (type) => {
    setFormType(type);
    setSearchParams(type ? { type } : {});
    const typeMap = {
      "ny-kunde": "Ny kunde-registrering",
      "kurs": "Kurs",
      "seminar": "Seminar",
      "trening": "Trening",
      "atferd": "Hjelp til atferdsproblemer",
      "booking": "Booking av hall",
      "annet": "Annet"
    };
    setFormData(prev => ({ 
      ...prev, 
      subject: typeMap[type] || "" 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
    
    // For ny kunde-registrering, add default message if empty
    let messageToSend = formData.message;
    if (formData.subject === "Ny kunde-registrering" && !formData.message) {
      messageToSend = `Ønsker å bli registrert som ny kunde.\nNavn: ${formData.name}\nE-post: ${formData.email}\nTelefon: ${formData.phone || "Ikke oppgitt"}`;
    }
    
    try {
      const response = await fetch(`${API}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          message: messageToSend
        })
      });
      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
        setFormType("");
        setSearchParams({});
      } else {
        alert("Kunne ikke sende melding. Prøv igjen senere.");
      }
    } catch (err) {
      alert("Kunne ikke sende melding. Prøv igjen senere.");
    }
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
            
            {/* Form type selector */}
            <div style={{ marginBottom: "30px" }}>
              <label htmlFor="form-type-selector" style={{ display: "block", marginBottom: "10px", fontWeight: "500" }}>
                Velg type henvendelse:
              </label>
              <div className="form-type-selector" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => handleFormTypeChange("ny-kunde")}
                  className={`btn ${formType === "ny-kunde" ? "btn-primary" : "btn-ghost"}`}
                  style={{ fontSize: "14px", padding: "10px" }}
                >
                  Ny kunde
                </button>
                <button
                  type="button"
                  onClick={() => handleFormTypeChange("kurs")}
                  className={`btn ${formType === "kurs" ? "btn-primary" : "btn-ghost"}`}
                  style={{ fontSize: "14px", padding: "10px" }}
                >
                  Kurs
                </button>
                <button
                  type="button"
                  onClick={() => handleFormTypeChange("seminar")}
                  className={`btn ${formType === "seminar" ? "btn-primary" : "btn-ghost"}`}
                  style={{ fontSize: "14px", padding: "10px" }}
                >
                  Seminar
                </button>
                <button
                  type="button"
                  onClick={() => handleFormTypeChange("trening")}
                  className={`btn ${formType === "trening" ? "btn-primary" : "btn-ghost"}`}
                  style={{ fontSize: "14px", padding: "10px" }}
                >
                  Trening
                </button>
                <button
                  type="button"
                  onClick={() => handleFormTypeChange("atferd")}
                  className={`btn ${formType === "atferd" ? "btn-primary" : "btn-ghost"}`}
                  style={{ fontSize: "14px", padding: "10px" }}
                >
                  Atferd
                </button>
                <button
                  type="button"
                  onClick={() => handleFormTypeChange("booking")}
                  className={`btn ${formType === "booking" ? "btn-primary" : "btn-ghost"}`}
                  style={{ fontSize: "14px", padding: "10px" }}
                >
                  Booking
                </button>
                <button
                  type="button"
                  onClick={() => handleFormTypeChange("annet")}
                  className={`btn ${formType === "annet" ? "btn-primary" : "btn-ghost"}`}
                  style={{ fontSize: "14px", padding: "10px" }}
                >
                  Annet
                </button>
              </div>
            </div>

            {submitted ? (
              <div style={{ padding: "20px", background: "#d4edda", borderRadius: "8px", textAlign: "center" }}>
                <p style={{ color: "#155724", margin: 0 }}>Takk for din henvendelse! Vi kommer tilbake til deg snart.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
                    setFormType("");
                  }}
                  className="btn btn-primary"
                  style={{ marginTop: "15px" }}
                >
                  Send ny melding
                </button>
              </div>
            ) : (
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
                    onChange={(e) => {
                      handleChange(e);
                      // Update form type based on subject selection
                      const subjectToType = {
                        "Ny kunde-registrering": "ny-kunde",
                        "Kurs": "kurs",
                        "Seminar": "seminar",
                        "Trening": "trening",
                        "Hjelp til atferdsproblemer": "atferd",
                        "Booking av hall": "booking",
                        "Annet": "annet"
                      };
                      const newType = subjectToType[e.target.value] || "";
                      setFormType(newType);
                      setSearchParams(newType ? { type: newType } : {});
                    }}
                    required
                    className="form-input"
                  >
                    <option value="">Velg emne</option>
                    <option value="Ny kunde-registrering">Ny kunde-registrering</option>
                    <option value="Kurs">Kurs</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Trening">Trening</option>
                    <option value="Hjelp til atferdsproblemer">Hjelp til atferdsproblemer</option>
                    <option value="Booking av hall">Booking av hall</option>
                    <option value="Annet">Annet</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="message">
                    Melding {formData.subject === "Ny kunde-registrering" ? "(valgfritt)" : "*"}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required={formData.subject !== "Ny kunde-registrering"}
                    rows="5"
                    className="form-input"
                    placeholder={
                      formData.subject === "Ny kunde-registrering"
                        ? "Beskriv eventuelt hvorfor du ønsker å bli kunde..."
                        : "Beskriv ditt spørsmål eller behov..."
                    }
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary">
                  Send melding
                </button>
              </form>
            )}
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
