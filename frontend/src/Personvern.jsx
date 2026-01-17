import React from 'react';
import { usePageContent, getContentValue } from './hooks/usePageContent';

export default function Personvern() {
  const { content, loading } = usePageContent('personvern');
  const pageTitle = getContentValue(content, "pageTitle", "Personvernserklæring");
  const pageSubtitle = getContentValue(content, "pageSubtitle", "Informasjon om hvordan vi behandler dine personopplysninger");
  const policyContent = getContentValue(content, "policyContent", "");

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{pageTitle}</h1>
        <p className="page-subtitle">{pageSubtitle}</p>
      </div>

      <div className="page-content">
        {loading ? (
          <div>Laster...</div>
        ) : policyContent ? (
          <div className="content-section">
            <div dangerouslySetInnerHTML={{ __html: policyContent }} />
          </div>
        ) : (
          <div className="privacy-policy-default">
            <section>
              <h2>1. Innsamling av personopplysninger</h2>
              <p>
                TG Tromsø behandler følgende personopplysninger om deg:
              </p>
              <ul>
                <li><strong>E-postadresse:</strong> Brukes for autentisering og kommunikasjon</li>
                <li><strong>Fullt navn:</strong> Valgfritt felt for identifikasjon</li>
                <li><strong>Telefonnummer:</strong> Valgfritt felt for kommunikasjon</li>
                <li><strong>Booking-informasjon:</strong> Hall, tidspunkt og kobling til din brukerkonto</li>
                <li><strong>Sesjonsdata:</strong> For sikkerhet og å begrense samtidige innlogginger</li>
              </ul>
            </section>

            <section>
              <h2>2. Formål med behandlingen</h2>
              <p>Vi behandler personopplysningene dine for følgende formål:</p>
              <ul>
                <li>Å levere booking-tjenesten for treningshaller</li>
                <li>Å autentisere deg og sikre tilgang til tjenesten</li>
                <li>Å beskytte mot uautorisert tilgang (sesjonshåndtering)</li>
                <li>Å kommunisere med deg om bookinger og viktig informasjon</li>
                <li>Å overholde lovpålagte krav (f.eks. bokføringsloven)</li>
              </ul>
            </section>

            <section>
              <h2>3. Juridisk grunnlag for behandlingen</h2>
              <p>
                Vi behandler personopplysningene dine basert på følgende juridiske grunnlag:
              </p>
              <ul>
                <li><strong>Oppfylle en kontrakt (GDPR Art. 6(1)(b)):</strong> For å levere booking-tjenesten du har bedt om</li>
                <li><strong>Legitimt interesse (GDPR Art. 6(1)(f)):</strong> For sesjonstracking og sikkerhetstiltak</li>
                <li><strong>Lovpålagt plikt:</strong> For oppbevaring av booking-data i henhold til norsk bokføringslov</li>
              </ul>
            </section>

            <section>
              <h2>4. Hvor lenge lagrer vi dataene dine?</h2>
              <ul>
                <li><strong>Autentiseringstoken:</strong> 25 minutter (automatisk utløp)</li>
                <li><strong>Sesjonsdata:</strong> Slettes når token utløper eller ved utlogging</li>
                <li><strong>Booking-data:</strong> I henhold til norsk bokføringslov (5 år) eller til du ber om sletting</li>
                <li><strong>Brukerkonto:</strong> Så lenge kontoen eksisterer, eller til du ber om sletting</li>
              </ul>
            </section>

            <section>
              <h2>5. Dine rettigheter</h2>
              <p>Under GDPR har du følgende rettigheter:</p>
              <ul>
                <li><strong>Rett til innsyn (Art. 15):</strong> Du kan be om å se alle personopplysninger vi har om deg</li>
                <li><strong>Rett til retting (Art. 16):</strong> Du kan be om retting av feilaktige opplysninger</li>
                <li><strong>Rett til sletting (Art. 17):</strong> Du kan be om sletting av dine personopplysninger</li>
                <li><strong>Rett til begrensning (Art. 18):</strong> Du kan be om at behandlingen begrenses</li>
                <li><strong>Rett til dataportabilitet (Art. 20):</strong> Du kan be om å få dine data i et struktureret format</li>
                <li><strong>Rett til innsigelse (Art. 21):</strong> Du kan protestere mot behandling basert på legitimt interesse</li>
              </ul>
              <p>
                For å utøve disse rettighetene, vennligst kontakt oss via kontaktskjemaet på{' '}
                <a href="/kontakt">kontaktsiden</a>.
              </p>
            </section>

            <section>
              <h2>6. Sikkerhetstiltak</h2>
              <p>Vi har implementert følgende sikkerhetstiltak:</p>
              <ul>
                <li>Passord hashes med bcrypt (aldri lagret i klartekst)</li>
                <li>JWT tokens med kort utløpstid (25 minutter)</li>
                <li>HTTPS i produksjon for kryptert kommunikasjon</li>
                <li>Begrenset samtidige sesjoner (maks 2 enheter)</li>
                <li>Automatisk utlogging ved inaktivitet (20 minutter)</li>
                <li>Session tracking i database for sikkerhet</li>
              </ul>
            </section>

            <section>
              <h2>7. Informasjonskapsler og lokal lagring</h2>
              <p>
                Vi bruker localStorage for å lagre:
              </p>
              <ul>
                <li><strong>Autentiseringstoken:</strong> Nødvendig for å holde deg innlogget (utløper etter 25 minutter)</li>
                <li><strong>Sesjonsdata:</strong> For å sikre at du kun er innlogget på maks 2 enheter samtidig</li>
                <li><strong>Preferanser:</strong> Som mørk modus (valgfritt, lagres kun hvis du aksepterer)</li>
              </ul>
              <p>
                Disse dataene lagres lokalt på din enhet og sendes ikke til tredjeparter.
              </p>
            </section>

            <section>
              <h2>8. Deling av personopplysninger</h2>
              <p>
                Vi deler ikke dine personopplysninger med tredjeparter, bortsett fra:
              </p>
              <ul>
                <li>Hvis vi er lovpålagt til å dele informasjon</li>
                <li>Hvis det er nødvendig for å levere tjenesten (f.eks. hosting-leverandører)</li>
              </ul>
            </section>

            <section>
              <h2>9. Kontaktinformasjon</h2>
              <p>
                Hvis du har spørsmål om vår behandling av personopplysninger, eller ønsker å utøve dine rettigheter, kan du kontakte oss:
              </p>
              <ul>
                <li>Via kontaktskjemaet på <a href="/kontakt">kontaktsiden</a></li>
                <li>Via e-post (se kontaktsiden for oppdatert informasjon)</li>
              </ul>
            </section>

            <section>
              <h2>10. Endringer i personvernserklæringen</h2>
              <p>
                Vi kan oppdatere denne personvernserklæringen fra tid til annen. Vesentlige endringer vil bli kommunisert til deg via e-post eller melding i tjenesten.
              </p>
              <p>
                <strong>Sist oppdatert:</strong> {new Date().toLocaleDateString('no-NO')}
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
