# Deployment Guide - HallBooking

Denne guiden forklarer hvordan du hoster HallBooking-applikasjonen på nett. Du trenger hosting for både **backend** (FastAPI) og **frontend** (React).

## Oversikt

- **Backend**: FastAPI Python-applikasjon (trenger Python hosting)
- **Frontend**: React-applikasjon bygget med Vite (kan hostes som statiske filer)
- **Database**: PostgreSQL (bruk Supabase/Neon som vi allerede har satt opp)

## Gratis Hosting Alternativer

### 🎯 Anbefalt: Railway (Enklest - Alt i ett)

**Railway** er perfekt for dette prosjektet fordi:
- ✅ Gratis tier: $5 kreditt per måned (nok for små prosjekter)
- ✅ Automatisk deployment fra GitHub
- ✅ Støtter både Python og statiske filer
- ✅ Enkel oppsett
- ✅ Innebygd PostgreSQL (eller bruk Supabase)

**URL**: https://railway.app

#### Oppsett på Railway:

1. **Backend**:
   - Opprett konto på Railway
   - Klikk "New Project" → "Deploy from GitHub repo"
   - Velg ditt HallBooking repository
   - Railway vil automatisk oppdage at det er en Python-app
   - Legg til environment variables:
     ```
     DATABASE_URL=postgresql://... (fra Supabase)
     SECRET=din-hemmelige-nøkkel
     ENVIRONMENT=production
     ALLOWED_ORIGINS=https://din-frontend-url.railway.app
     ```
   - Railway vil automatisk deploye når du pusher til GitHub

2. **Frontend**:
   - I samme Railway-prosjekt, klikk "New" → "Static Site"
   - Velg `frontend` mappen
   - Legg til build command: `npm install && npm run build`
   - Output directory: `dist`
   - Legg til environment variable:
     ```
     VITE_API_URL=https://din-backend-url.railway.app
     ```

---

### Alternativ 1: Render (Gratis tier)

**Render** tilbyr:
- ✅ Gratis tier for backend (spinner ned etter 15 min inaktivitet)
- ✅ Gratis tier for statiske sider
- ✅ Automatisk SSL

**URL**: https://render.com

#### Backend på Render:

1. Opprett konto på Render
2. Klikk "New" → "Web Service"
3. Koble til GitHub repository
4. Settings:
   - **Build Command**: `pip install -r requirements.txt` (eller `pipenv install`)
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**:
     ```
     DATABASE_URL=postgresql://... (fra Supabase)
     SECRET=din-hemmelige-nøkkel
     ENVIRONMENT=production
     ALLOWED_ORIGINS=https://din-frontend-url.onrender.com
     ```

#### Frontend på Render:

1. Klikk "New" → "Static Site"
2. Koble til GitHub repository
3. Settings:
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Environment Variables**:
     ```
     VITE_API_URL=https://din-backend-url.onrender.com
     ```

---

### Alternativ 2: Vercel (Frontend) + Railway/Render (Backend)

**Vercel** er best for frontend:
- ✅ Perfekt for React/Vite
- ✅ Automatisk deployment
- ✅ Gratis tier med god ytelse
- ✅ CDN globalt

**URL**: https://vercel.com

#### Frontend på Vercel:

1. Opprett konto på Vercel
2. Klikk "Add New" → "Project"
3. Importer GitHub repository
4. Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     ```
     VITE_API_URL=https://din-backend-url.railway.app
     ```

#### Backend på Railway/Render:

Følg instruksjonene over for backend.

---

### Alternativ 3: Fly.io (Backend) + Netlify (Frontend)

**Fly.io**:
- ✅ Gratis tier: 3 shared-cpu VMs
- ✅ God for Python-apps
- ✅ Globalt distributert

**Netlify**:
- ✅ Perfekt for statiske sider
- ✅ Gratis tier
- ✅ Automatisk SSL

---

## Steg-for-steg: Full Deployment (Railway)

### 1. Forberedelser

```bash
# Sørg for at alt fungerer lokalt
cd frontend
npm install
npm run build

cd ..
pipenv install
```

### 2. Opprett Supabase Database

1. Gå til https://supabase.com
2. Opprett prosjekt
3. Kopier connection string fra Settings → Database
4. Lagre den - du trenger den senere

### 3. Deploy Backend på Railway

1. Gå til https://railway.app
2. Klikk "New Project" → "Deploy from GitHub repo"
3. Velg ditt HallBooking repository
4. Railway vil automatisk oppdage Python
5. Legg til environment variables:
   ```
   DATABASE_URL=postgresql://postgres:[PASSORD]@db.[ID].supabase.co:5432/postgres
   SECRET=din-super-hemmelige-nøkkel-minst-32-tegn
   ENVIRONMENT=production
   ```
6. Railway vil gi deg en URL (f.eks. `https://hallbooking-production.up.railway.app`)
7. Kopier denne URL-en - du trenger den for frontend

### 4. Deploy Frontend på Railway

1. I samme Railway-prosjekt, klikk "New" → "Static Site"
2. Velg `frontend` mappen
3. Settings:
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     ```
     VITE_API_URL=https://din-backend-url.railway.app
     ```
4. Railway vil gi deg en URL for frontend

### 5. Oppdater CORS i Backend

Gå tilbake til backend-settings i Railway og oppdater:
```
ALLOWED_ORIGINS=https://din-frontend-url.railway.app
```

### 6. Test

1. Gå til frontend URL-en
2. Test at du kan logge inn
3. Test at bookinger fungerer

---

## Environment Variables

### Backend (.env eller Railway/Render settings)

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/dbname

# Security
SECRET=din-super-hemmelige-nøkkel-minst-32-tegn

# Environment
ENVIRONMENT=production

# CORS (kommaseparert liste)
ALLOWED_ORIGINS=https://din-frontend-url.com,https://www.din-frontend-url.com
```

### Frontend (Vite environment variables)

```bash
# API URL
VITE_API_URL=https://din-backend-url.com
```

**Merk**: Vite krever `VITE_` prefix for environment variables!

---

## Oppdatere CORS for Produksjon

CORS er allerede konfigurert i `app/main.py` til å støtte environment variables.

I produksjon, sett:
```bash
ALLOWED_ORIGINS=https://din-frontend-url.com
ENVIRONMENT=production
```

---

## Docker Deployment

Prosjektet inkluderer en `Dockerfile` for enklere deployment. Dockerfile bruker `requirements.txt` for dependencies.

### Bygge Docker Image

```bash
# Bygg image
docker build -t hallbooking-backend .

# Kjør container
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://... \
  -e SECRET=din-hemmelige-nøkkel \
  -e ENVIRONMENT=production \
  -e ALLOWED_ORIGINS=https://din-frontend-url.com \
  hallbooking-backend
```

### Deploy med Docker

Mange hosting-plattformer støtter Docker:
- **Railway**: Automatisk detekterer Dockerfile
- **Render**: Støtter Docker deployment
- **Fly.io**: Perfekt for Docker
- **Google Cloud Run**: Støtter Docker
- **AWS ECS/Fargate**: Støtter Docker

## Tips og Best Practices

1. **Aldri commit `.env` filer** - bruk environment variables i hosting-plattformen
2. **Bruk sterk SECRET** - minst 32 tegn, tilfeldig generert
3. **Test lokalt først** - sørg for at alt fungerer før deployment
4. **Monitor logs** - Railway/Render gir deg tilgang til logs
5. **Backup database** - Supabase har automatisk backup, men vurder ekstra backup
6. **SSL/HTTPS** - Alle moderne hosting-plattformer gir automatisk SSL
7. **Docker**: Bruk `requirements.txt` for dependencies i Docker (ikke Pipfile.lock)

---

## Troubleshooting

### Backend starter ikke
- Sjekk at `DATABASE_URL` er riktig
- Sjekk at alle dependencies er installert
- Sjekk logs i hosting-plattformen

### Frontend kan ikke koble til backend
- Sjekk at `VITE_API_URL` er riktig
- Sjekk at `ALLOWED_ORIGINS` inkluderer frontend URL
- Sjekk CORS settings i backend

### Database connection feiler
- Verifiser connection string fra Supabase
- Sjekk at database er oppe og kjører
- Sjekk at IP ikke er blokkert (Supabase har IP whitelist)

---

## Kostnader

### Gratis Tier (nok for små prosjekter):
- **Railway**: $5 kreditt/måned (gratis)
- **Render**: Gratis (spinner ned etter inaktivitet)
- **Vercel**: Gratis (god tier)
- **Supabase**: Gratis (500 MB database)

### Betalt (hvis du vokser):
- **Railway**: Starter på $5/måned
- **Render**: Starter på $7/måned
- **Supabase**: Starter på $25/måned

---

## Neste Steg

1. Velg en hosting-plattform (anbefalt: Railway)
2. Deploy backend først
3. Deploy frontend
4. Test alt grundig
5. Oppdater CORS settings
6. Sett opp custom domain (valgfritt)

Lykke til! 🚀
