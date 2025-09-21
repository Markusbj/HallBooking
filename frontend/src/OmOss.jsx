import React from "react";

export default function OmOss() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Om TG Tromsø</h1>
        <p className="page-subtitle">Din lokale hundetrening-klubb i Tromsø</p>
      </div>

      <div className="page-content">
        <section className="content-section">
          <h2>Vår historie</h2>
          <p>
            TG Tromsø ble etablert i 2010 med mål om å tilby kvalitetshundetrening 
            til alle hundeeiere i Tromsø-området. Vi har vokst fra en liten gruppe 
            entusiaster til å bli en av byens ledende hundetrening-klubber.
          </p>
          <p>
            Vår klubb er basert på positive treningsmetoder og fokus på både hundens 
            og eierens trivsel. Vi tror på at god trening skaper sterke bånd mellom 
            hund og eier.
          </p>
        </section>

        <section className="content-section">
          <h2>Våre verdier</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">🐕</div>
              <h3>Hundens velferd</h3>
              <p>Vi setter hundens fysiske og mentale velferd i sentrum for all trening.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🤝</div>
              <h3>Samarbeid</h3>
              <p>Vi bygger sterke bånd mellom hund og eier gjennom positiv trening.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">📚</div>
              <h3>Kunnskap</h3>
              <p>Vi deler kunnskap og erfaring for å hjelpe alle hundeeiere.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🏆</div>
              <h3>Kvalitet</h3>
              <p>Vi leverer høy kvalitet i all vår trening og instruksjon.</p>
            </div>
          </div>
        </section>

        <section className="content-section">
          <h2>Hva vi tilbyr</h2>
          <div className="services-list">
            <div className="service-item">
              <h3>Grunnleggende lydighet</h3>
              <p>Lær grunnleggende kommandoer og oppførsel med din hund.</p>
            </div>
            <div className="service-item">
              <h3>Avansert trening</h3>
              <p>Spesialisert trening for konkurranse og prestasjon.</p>
            </div>
            <div className="service-item">
              <h3>Hundesport</h3>
              <p>Agility, rally og andre spennende hundesporter.</p>
            </div>
            <div className="service-item">
              <h3>Privat trening</h3>
              <p>Personlig oppfølging for spesifikke behov.</p>
            </div>
          </div>
        </section>

        <section className="content-section">
          <h2>Våre fasiliteter</h2>
          <p>
            Vi har moderne treningshaller med alt nødvendig utstyr for kvalitetstrening. 
            Våre lokaler er tilpasset både nybegynnere og erfarne hundeeiere.
          </p>
          <ul className="facilities-list">
            <li>Moderne treningshall med 400m²</li>
            <li>Agility-utstyr og hindrebaner</li>
            <li>Oppvarmede lokaler året rundt</li>
            <li>Parkering rett utenfor inngangen</li>
            <li>Kafé og samlingsområde</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
