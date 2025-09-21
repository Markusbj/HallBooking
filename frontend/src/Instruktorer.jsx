import React from "react";
import { usePageContent, getContentValue } from "./hooks/usePageContent";

export default function Instruktorer() {
  const { content, loading, error } = usePageContent("instruktorer");

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
  const instructors = [
    {
      name: "Lisbeth Drotz",
      title: "Instruktør",
      experience: "15 år",
      specialties: ["Grunnleggende lydighet", "Spor", ],
      description: "Lisbeth har deltat.",
      image: "👩‍🏫"
    },
    {
      name: "Erik Hansen",
      title: "Seniorinstruktør",
      experience: "12 år",
      specialties: ["Avansert trening", "Konkurranse", "Privat trening"],
      description: "Erik har konkurrert på nasjonalt nivå og hjelper hundeeiere med avansert trening og konkurranseforberedelse.",
      image: "👨‍🏫"
    },
    {
      name: "Maria Larsen",
      title: "Instruktør",
      experience: "8 år",
      specialties: ["Valp-trening", "Atferdsproblemer", "Familiehund"],
      description: "Maria er spesialisert på valp-trening og hjelper familier med å bygge gode grunnlag for livslang læring.",
      image: "👩‍🎓"
    },
    {
      name: "Lars Andersen",
      title: "Instruktør",
      experience: "6 år",
      specialties: ["Rally", "Obedience", "Gruppetrening"],
      description: "Lars er vår rally-ekspert og leder våre gruppetreninger. Han har stor erfaring med å jobbe med mange hunder samtidig.",
      image: "👨‍🎓"
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{getContentValue(content, "pageTitle", "Våre instruktører")}</h1>
        <p className="page-subtitle">{getContentValue(content, "pageSubtitle", "Møt vårt erfarne team av hundetreningsinstruktører")}</p>
      </div>

      <div className="page-content">
        <section className="content-section">
          <h2>{getContentValue(content, "instructorsTitle", "Vårt team")}</h2>
          <p dangerouslySetInnerHTML={{ __html: getContentValue(content, "instructorsDescription", "Våre instruktører har alle lang erfaring og er sertifisert innen hundetrening. Vi jobber kontinuerlig med å oppdatere vår kunnskap og følge de nyeste treningsmetodene.") }}></p>
        </section>

        <div className="instructors-grid">
          {instructors.map((instructor, index) => (
            <div key={index} className="instructor-card">
              <div className="instructor-image">
                <span className="instructor-emoji">{instructor.image}</span>
              </div>
              <div className="instructor-info">
                <h3>{instructor.name}</h3>
                <p className="instructor-title">{instructor.title}</p>
                <p className="instructor-experience">Erfaring: {instructor.experience}</p>
                <p className="instructor-description">{instructor.description}</p>
                <div className="instructor-specialties">
                  <h4>Spesialiteter:</h4>
                  <div className="specialties-tags">
                    {instructor.specialties.map((specialty, idx) => (
                      <span key={idx} className="specialty-tag">{specialty}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <section className="content-section">
          <h2>Våre kvalifikasjoner</h2>
          <div className="qualifications">
            <div className="qualification-item">
              <h3>Norsk Kennel Klub (NKK) sertifisering</h3>
              <p>Alle våre instruktører er sertifisert gjennom NKK</p>
            </div>
            <div className="qualification-item">
              <h3>Kontinuerlig opplæring</h3>
              <p>Vi deltar årlig på kurs og konferanser for å holde oss oppdatert</p>
            </div>
            <div className="qualification-item">
              <h3>Praktisk erfaring</h3>
              <p>Minst 5 års praktisk erfaring med hundetrening</p>
            </div>
            <div className="qualification-item">
              <h3>Førstehjelp for hunder</h3>
              <p>Alle instruktører er utdannet i førstehjelp for hunder</p>
            </div>
          </div>
        </section>

        <section className="content-section">
          <h2>Bli med i teamet</h2>
          <p>
            Vi ser alltid etter nye, engasjerte instruktører som deler våre verdier. 
            Hvis du har erfaring med hundetrening og ønsker å jobbe med oss, 
            ta gjerne kontakt!
          </p>
          <div className="cta-section">
            <a href="/kontakt" className="btn btn-primary">Kontakt oss</a>
          </div>
        </section>
      </div>
    </div>
  );
}
