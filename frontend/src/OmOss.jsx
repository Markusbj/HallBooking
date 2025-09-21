import React from "react";
import { usePageContent, getContentValue } from "./hooks/usePageContent";

export default function OmOss() {
  const { content, loading, error } = usePageContent("om-oss");

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Laster...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Feil ved lasting av innhold</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{getContentValue(content, "pageTitle", "Om TG Tromsø")}</h1>
        <p className="page-subtitle">{getContentValue(content, "pageSubtitle", "Din lokale hundetrening-klubb i Tromsø")}</p>
      </div>

      <div className="page-content">
        <section className="content-section">
          <h2>{getContentValue(content, "aboutTitle", "Vår historie")}</h2>
          <div dangerouslySetInnerHTML={{ __html: getContentValue(content, "aboutText1", "TG Tromsø ble etablert i 2010 med mål om å tilby kvalitetshundetrening til alle hundeeiere i Tromsø-området. Vi har vokst fra en liten gruppe entusiaster til å bli en av byens ledende hundetrening-klubber.") }}></div>
          <div dangerouslySetInnerHTML={{ __html: getContentValue(content, "aboutText2", "Vår klubb er basert på positive treningsmetoder og fokus på både hundens og eierens trivsel. Vi tror på at god trening skaper sterke bånd mellom hund og eier.") }}></div>
        </section>

        <section className="content-section">
          <h2>{getContentValue(content, "historyTitle", "Vår historie")}</h2>
          <div dangerouslySetInnerHTML={{ __html: getContentValue(content, "historyText", "TG Tromsø ble etablert i 2010 med mål om å tilby kvalitetshundetrening til alle hundeeiere i Tromsø-området. Vi har vokst fra en liten gruppe entusiaster til å bli en av byens ledende hundetrening-klubber.") }}></div>
        </section>

        <section className="content-section">
          <h2>{getContentValue(content, "missionTitle", "Vår misjon")}</h2>
          <div dangerouslySetInnerHTML={{ __html: getContentValue(content, "missionText", "Vår klubb er basert på positive treningsmetoder og fokus på både hundens og eierens trivsel. Vi tror på at god trening skaper sterke bånd mellom hund og eier.") }}></div>
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
