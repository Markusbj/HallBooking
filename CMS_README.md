# CMS (Content Management System) for TG Tromsø

Dette systemet gir administratorer mulighet til å redigere innhold på alle sidene uten å måtte endre kode.

## Funksjoner

### For Administratorer
- **Rediger sideinnhold**: Endre tekster, titler og beskrivelser på alle sider
- **Legg til nytt innhold**: Opprett nye seksjoner med innhold
- **Dynamisk seksjonsvalg**: Seksjonslisten oppdateres automatisk basert på valgt side
- **Beskrivende etiketter**: Alle seksjoner har klare, forståelige navn
- **Støtte for HTML**: Bruk HTML-formatering for rikere innhold
- **Versjonshåndtering**: Se hvem som endret hva og når

### For Besøkende
- **Dynamisk innhold**: Alle sider laster innhold fra databasen
- **Fallback-innhold**: Hvis database ikke er tilgjengelig, vises standardinnhold
- **Rask lasting**: Innhold caches for bedre ytelse

## Hvordan bruke CMS

### 1. Tilgang til Admin Panel
1. Logg inn som administrator
2. Gå til "Admin" i navigasjonsmenyen
3. Klikk på "Sideinnhold"-fanen

### 2. Redigere eksisterende innhold
1. Finn siden du vil redigere (nå med beskrivende navn som "Forside", "Kontakt oss")
2. Finn seksjonen du vil redigere (nå med beskrivende navn som "Hovedtittel" i stedet for "hero_title")
3. Les beskrivelsen under navnet for å forstå hva seksjonen gjør
4. Klikk "Rediger" ved siden av innholdet du vil endre
5. Endre teksten i modal-vinduet
6. Velg innholdstype (tekst, HTML, markdown)
7. Klikk "Lagre"

### 3. Legge til nytt innhold
1. Klikk "Legg til nytt innhold"
2. Velg side fra dropdown-menyen (Forside, Kontakt oss, Om oss, Instruktører, Kurs & Nyheter, Personvern)
3. **Seksjonslisten oppdateres automatisk** basert på valgt side
4. Velg seksjon fra dropdown-menyen med beskrivende navn:
   - **Forside**: Hovedtittel, Undertekst, Tittel for funksjoner, etc.
   - **Kontakt oss**: Sidetittel, Adresse og beskrivelse, Telefonnummer, etc.
   - **Instruktører**: Sidetittel, Tittel for instruktører, Beskrivelse av instruktører
   - **Om oss**: Sidetittel, Tittel for "Om oss", Historietekst, Misjonstekst, etc.
5. Skriv inn innholdet
6. Velg innholdstype
7. Klikk "Opprett"

## Struktur for Sideinnhold

### Sider som støttes
- **landing**: Forsiden (Landingssiden)
- **kontakt**: Kontakt oss-siden
- **om-oss**: Om oss-siden
- **instruktorer**: Instruktører-siden
- **nyheter**: Kurs & Nyheter-siden
- **personvern**: Personvern-siden

**Alle sidene kan nå redigeres via CMS-systemet!**

### Eksisterende seksjoner

#### Landing Page
- `hero_title`: Hovedtittel
- `hero_subtitle`: Undertittel
- `features_title`: Tittel for funksjoner-seksjon
- `about_title`: Tittel for om oss-seksjon
- `about_text1`: Første avsnitt om oss
- `about_text2`: Andre avsnitt om oss
- `cta_title`: Call-to-action tittel
- `cta_text`: Call-to-action tekst

#### Kontakt Page
- `page_title`: Sidetittel
- `page_subtitle`: Sideundertittel
- `contact_title`: Kontaktinformasjon tittel
- `address_title`: Adresse tittel
- `address_text`: Adresse tekst (HTML)
- `phone_title`: Telefon tittel
- `phone_text`: Telefon tekst (HTML)
- `email_title`: E-post tittel
- `email_text`: E-post tekst (HTML)
- `hours_title`: Åpningstider tittel
- `social_title`: Sosiale medier tittel
- `form_title`: Skjema tittel
- `map_title`: Kart tittel
- `map_text`: Kart beskrivelse
- `location_title`: Lokasjon tittel
- `location_text`: Lokasjon tekst (HTML)

#### Instruktører Page
- `pageTitle`: Sidetittel
- `pageSubtitle`: Undertekst på siden
- `instructorsTitle`: Tittel for instruktører
- `instructorsDescription`: Beskrivelse av instruktørene
- `instructorsList`: Instruktørliste (JSON med navn, bilde, m.m.)
- `instructor1ImageUrl`: Bilde-URL for første instruktør
- `instructor2ImageUrl`: Bilde-URL for andre instruktør

#### Om oss Page
- `pageTitle`: Sidetittel
- `pageSubtitle`: Undertekst på siden
- `aboutTitle`: Tittel for "Om oss"
- `aboutText1`: Første avsnitt "Om oss"
- `aboutText2`: Andre avsnitt "Om oss"
- `historyTitle`: Tittel for historie
- `historyText`: Historietekst
- `missionTitle`: Tittel for misjon
- `missionText`: Misjonstekst

#### Kurs & Nyheter Page
- `pageTitle`: Sidetittel
- `pageSubtitle`: Undertekst på siden

#### Personvern Page
- `pageTitle`: Sidetittel
- `pageSubtitle`: Undertekst på siden
- `policyContent`: Personverninnhold (HTML/Markdown)

## Tekniske detaljer

### Database
- **Tabell**: `page_content`
- **Felter**: id, page_name, section_name, content, content_type, created_at, updated_at, created_by

### API Endepunkter
- `GET /api/page-content/{page_name}`: Hent innhold for en side
- `GET /api/page-content`: Hent alt innhold (admin only)
- `POST /api/page-content`: Opprett nytt innhold (admin only)
- `PUT /api/page-content/{content_id}`: Oppdater innhold (admin only)
- `DELETE /api/page-content/{content_id}`: Slett innhold (admin only)

### Frontend Hook
```javascript
import { usePageContent, getContentValue } from './hooks/usePageContent';

// Hent alt innhold for en side
const { content, loading, error } = usePageContent("landing");

// Hent spesifikt innhold
const title = getContentValue(content, "hero_title", "Fallback tekst");
```

## Initialisering

For å sette opp standardinnhold i databasen:

```bash
python init_content.py
```

Dette scriptet vil:
1. Opprette standardinnhold for alle sider
2. Sjekke om innhold allerede eksisterer
3. Hoppe over eksisterende innhold
4. Vise fremdrift i terminalen

## Sikkerhet

- Kun administratorer kan redigere innhold
- Alle endringer logges med bruker-ID
- HTML-innhold sanitizes for sikkerhet
- API-endepunkter krever autentisering

## Feilsøking

### Innhold vises ikke
1. Sjekk at databasen kjører
2. Sjekk at `init_content.py` er kjørt
3. Sjekk nettverkskonsollen for feil
4. Sjekk at brukeren har admin-rettigheter

### Endringer lagres ikke
1. Sjekk at du er logget inn som administrator
2. Sjekk nettverkskonsollen for API-feil
3. Sjekk at innholdstypen er riktig valgt

### Performance-problemer
1. Innhold caches automatisk
2. Bruk tekst i stedet for HTML når mulig
3. Begrens mengden HTML-innhold

## Utvidelse

For å legge til støtte for nye sider:

1. Legg til side i `usePageContent` hook
2. Oppdater `AdminPanel.jsx` med ny side
3. Legg til standardinnhold i `init_content.py`
4. Oppdater komponenten til å bruke dynamisk innhold

## Support

For spørsmål eller problemer, kontakt systemadministratoren.
