# GDPR Compliance - HallBooking System

## Juridisk grunnlag for behandling

### 1. Autentisering og sesjonshåndtering

**Juridisk grunnlag:** 
- **Legitimt interesse** (GDPR Artikkel 6(1)(f)) for sikkerhetsformål
- **Nødvendig for å oppfylle en kontrakt** (GDPR Artikkel 6(1)(b)) - brukeren har bedt om å få tilgang til tjenesten

**Hva vi behandler:**
- Autentiseringstoken (JWT) - lagres i localStorage
- Sesjons-ID og aktivitetstidspunkter - lagres i database
- Device info (User-Agent) - lagres i database for sikkerhetsformål

**Formål:**
- Autentisering av brukere
- Beskyttelse mot uautorisert tilgang
- Begrensning av samtidige innlogginger (sikkerhet)

**Lagringsperiode:**
- JWT token: 25 minutter (automatisk utløp)
- Sesjonsdata: Slettes automatisk når token utløper
- Utloggingsdata: Slettes umiddelbart ved utlogging

### 2. Personopplysninger i brukerkonto

**Juridisk grunnlag:**
- **Nødvendig for å oppfylle en kontrakt** (GDPR Artikkel 6(1)(b))
- **Samtykke** (GDPR Artikkel 6(1)(a)) for valgfrie data

**Hva vi behandler:**
- E-postadresse (nødvendig for konto)
- Fullt navn (valgfritt)
- Telefonnummer (valgfritt)
- Admin-rettigheter (systemfunksjonalitet)

**Formål:**
- Levere booking-tjenesten
- Kommunikasjon med brukere
- Identifikasjon av brukere

**Lagringsperiode:**
- Så lenge brukerkontoen eksisterer
- Bruker kan be om sletting når som helst

### 3. Booking-data

**Juridisk grunnlag:**
- **Nødvendig for å oppfylle en kontrakt** (GDPR Artikkel 6(1)(b))

**Hva vi behandler:**
- Bookingdetaljer (hall, tidspunkt)
- Kobling til brukerkonto

**Lagringsperiode:**
- I henhold til norsk bokføringslov (5 år for regnskapsmessige dokumenter)
- Eller til bruker ber om sletting

## Brukerens rettigheter under GDPR

### 1. Rett til innsyn (Artikkel 15)
Brukeren kan be om å se alle personopplysninger vi har om dem.

**Hvordan:** Kontakt via kontaktskjema eller e-post.

### 2. Rett til retting (Artikkel 16)
Brukeren kan be om retting av feilaktige opplysninger.

**Hvordan:** Via kontoinnstillinger eller kontakt oss.

### 3. Rett til sletting (Artikkel 17 - "Right to be forgotten")
Brukeren kan be om sletting av personopplysninger.

**Hvordan:** Kontakt oss via kontaktskjema. Merk: Noen data kan være nødvendig å beholde i henhold til lovpålagt oppbevaring.

### 4. Rett til begrensning av behandling (Artikkel 18)
Brukeren kan be om at behandlingen begrenses.

### 5. Rett til dataportabilitet (Artikkel 20)
Brukeren kan be om å få sine data i et struktureret format.

### 6. Rett til innsigelse (Artikkel 21)
Brukeren kan protestere mot behandling basert på legitimt interesse.

## Cookie-samtykke

### Nødvendige cookies (krever ikke samtykke)
- Autentiseringstoken: Nødvendig for å levere tjenesten
- Sesjonsdata: Nødvendig for sikkerhet

### Valgfrie cookies (krever samtykke)
- Preferanser (mørk modus): Lagres kun hvis brukeren aksepterer

## Sikkerhetstiltak

- Passord hashes med bcrypt (aldri lagret i klartekst)
- JWT tokens med kort utløpstid (25 minutter)
- HTTPS i produksjon
- Begrenset samtidige sesjoner (maks 2 enheter)
- Automatisk utlogging ved inaktivitet (20 minutter)
- Session tracking i database for sikkerhet

## Kontaktinformasjon

For henvendelser relatert til personvern eller GDPR:
- Kontakt: [Legg til kontaktinformasjon]
- E-post: [Legg til e-post]

## Oppdateringer

Denne personvernserklæringen kan oppdateres. Brukere vil bli informert om vesentlige endringer.

Sist oppdatert: [Dato]
