# Admin-konto oppsett for TG Tromsø

## Opprettet admin-konto

Du har nå en admin-konto med følgende detaljer:
- **E-post**: `admin@tgtromso.no`
- **Passord**: `admin123`
- **Status**: Administrator med full tilgang til CMS

## Hvordan logge inn som admin

1. Gå til frontend-applikasjonen (http://localhost:5173)
2. Klikk "Logg inn" i navigasjonen
3. Skriv inn:
   - E-post: `admin@tgtromso.no`
   - Passord: `admin123`
4. Klikk "Logg inn"

## Tilgang til admin-panelet

Etter innlogging vil du se:
- "Admin" i navigasjonsmenyen (kun for administratorer)
- Klikk på "Admin" for å åpne admin-panelet
- Velg "Sideinnhold"-fanen for å redigere innhold

## Admin-funksjoner

### Sideinnhold-redigering
- **Rediger eksisterende innhold**: Klikk "Rediger" ved siden av innholdet
- **Legg til nytt innhold**: Klikk "Legg til nytt innhold"
- **Støttede sider**: landing, kontakt, om-oss, instruktorer
- **Innholdstyper**: tekst, HTML, markdown

### Sikkerhet
- Kun administratorer kan redigere innhold
- Alle endringer logges med bruker-ID
- Endringer lagres umiddelbart

## Opprette flere admin-kontoer

### Metode 1: Ny admin-konto
```bash
cd /home/markus/dev/bookingsystem
pipenv run python create_admin.py
```

### Metode 2: Gjør eksisterende bruker til admin
```bash
cd /home/markus/dev/bookingsystem
pipenv run python promote_to_admin.py
```

### Metode 3: Se alle brukere
```bash
cd /home/markus/dev/bookingsystem
pipenv run python list_users.py
```

## Feilsøking

### Kan ikke logge inn
1. Sjekk at e-post og passord er riktig
2. Sjekk at brukeren har admin-rettigheter
3. Sjekk at backend-serveren kjører

### Ser ikke admin-menyen
1. Sjekk at du er logget inn
2. Sjekk at brukeren har `is_superuser = True`
3. Logg ut og inn igjen

### Kan ikke redigere innhold
1. Sjekk at du er logget inn som admin
2. Sjekk at backend-serveren kjører
3. Sjekk nettverkskonsollen for feil

## Endre admin-passord

For å endre passordet, bruk promote-scriptet eller opprett en ny admin-konto.

## Sikkerhetstips

1. **Endre standardpassordet** etter første innlogging
2. **Bruk sterke passord** for admin-kontoer
3. **Begrens antall admin-kontoer** til nødvendige brukere
4. **Logg ut** når du er ferdig med admin-oppgaver

## Support

Hvis du har problemer med admin-tilgang, sjekk:
1. At alle avhengigheter er installert
2. At databasen kjører
3. At backend-serveren kjører
4. Nettverkskonsollen for feilmeldinger
