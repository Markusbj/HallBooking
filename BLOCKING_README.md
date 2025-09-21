# Blokkering-funksjonalitet for TG Tromsø

Dette systemet gir administratorer mulighet til å blokkere hele dager, spesifikke tidspunkter, eller ukentlige dager for booking.

## Funksjoner

### Blokkeringstyper

1. **Hele dag(er)** - Blokkerer hele dager i et datoområde
2. **Tidspunkt** - Blokkerer spesifikke timer på dager
3. **Ukedag** - Blokkerer en bestemt ukedag i et datoområde

### For Administratorer
- **Opprett blokkeringer**: Blokker dager/timer for ferier, vedlikehold, etc.
- **Slett blokkeringer**: Fjern blokkeringer når de ikke lenger trengs
- **Se alle blokkeringer**: Oversikt over alle aktive blokkeringer
- **Årsak**: Legg til beskrivelse av hvorfor tiden er blokkert

### For Brukere
- **Blokkerte tider vises rødt** i kalenderen
- **Kan ikke booke** blokkerte tider
- **Får feilmelding** hvis de prøver å booke blokkerte tider

## Hvordan bruke blokkering-systemet

### 1. Tilgang til blokkering-administrasjon
1. Logg inn som administrator
2. Gå til "Admin" i navigasjonsmenyen
3. Klikk på "Blokkeringer"-fanen

### 2. Opprette ny blokkering
1. Klikk "Legg til blokkering"
2. Velg blokkeringstype:
   - **Hele dag(er)**: For ferier, helligdager, etc.
   - **Tidspunkt**: For vedlikehold, møter, etc.
   - **Ukedag**: For faste stengingsdager
3. Fyll ut datoer og tidspunkter
4. Legg til årsak (valgfritt)
5. Klikk "Opprett"

### 3. Slette blokkering
1. Finn blokkeringen i listen
2. Klikk "Slett" ved siden av blokkeringen
3. Bekreft sletting

## Eksempler på bruk

### Ferie
- **Type**: Hele dag(er)
- **Datoer**: 2024-12-23 til 2024-12-26
- **Årsak**: Juleferie

### Vedlikehold
- **Type**: Tidspunkt
- **Datoer**: 2024-11-15 til 2024-11-15
- **Tid**: 14:00 til 16:00
- **Årsak**: Vedlikehold av hall

### Stengt på søndager
- **Type**: Ukedag
- **Datoer**: 2024-01-01 til 2024-12-31
- **Ukedag**: Søndag
- **Årsak**: Stengt på søndager

## Tekniske detaljer

### Database
- **Tabell**: `blocked_time`
- **Felter**: id, block_type, start_date, end_date, start_time, end_time, day_of_week, reason, is_active, created_at, created_by

### API Endepunkter
- `GET /api/blocked-times`: Hent alle blokkeringer (admin only)
- `POST /api/blocked-times`: Opprett ny blokkering (admin only)
- `PUT /api/blocked-times/{id}`: Oppdater blokkering (admin only)
- `DELETE /api/blocked-times/{id}`: Slett blokkering (admin only)

### Blokkering-logikk
- Sjekkes ved hver booking-forespørsel
- Blokkerte tider vises rødt i kalenderen
- Brukere får feilmelding ved booking av blokkerte tider

## Sikkerhet

- Kun administratorer kan opprette/slette blokkeringer
- Alle blokkeringer logges med bruker-ID
- Blokkeringer kan deaktiveres uten å slettes

## Feilsøking

### Blokkering vises ikke
1. Sjekk at blokkeringen er aktiv (`is_active = true`)
2. Sjekk at datoene er riktige
3. Sjekk at backend-serveren kjører
4. Sjekk nettverkskonsollen for feil

### Kan ikke opprette blokkering
1. Sjekk at du er logget inn som administrator
2. Sjekk at alle påkrevde felt er fylt ut
3. Sjekk at startdato er før sluttdato
4. Sjekk nettverkskonsollen for feil

### Blokkering fungerer ikke
1. Sjekk at blokkering-logikken kjører
2. Sjekk at databasen er oppdatert
3. Sjekk at booking-endepunktet sjekker blokkeringer

## Utvidelse

For å legge til nye blokkeringstyper:

1. Oppdater `block_type` enum i databasen
2. Legg til logikk i `is_time_blocked` funksjonen
3. Oppdater frontend for å håndtere ny type
4. Legg til validering i API-endepunktene

## Support

For spørsmål eller problemer, kontakt systemadministratoren.
