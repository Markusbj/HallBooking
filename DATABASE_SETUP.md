# Database Setup Guide

Prosjektet støtter nå både SQLite (for utvikling) og PostgreSQL (for produksjon).

## Gratis Database Alternativer

### 1. **Supabase** (Anbefalt - Enklest)
- **Gratis tier**: 500 MB database, 2 GB bandwidth
- **URL**: https://supabase.com
- **Hvordan**:
  1. Opprett konto på Supabase
  2. Klikk "New Project"
  3. Velg region (nærmest Norge)
  4. Gå til Settings → Database
  5. Kopier "Connection string" (URI format)
  6. Legg den i `.env` filen som `DATABASE_URL`

### 2. **Neon**
- **Gratis tier**: 3 GB database, 10 GB bandwidth
- **URL**: https://neon.tech
- **Hvordan**:
  1. Opprett konto på Neon
  2. Klikk "Create Project"
  3. Velg region
  4. Kopier connection string
  5. Legg den i `.env` filen

### 3. **Railway**
- **Gratis tier**: $5 kreditt per måned
- **URL**: https://railway.app
- **Hvordan**:
  1. Opprett konto på Railway
  2. Klikk "New Project" → "Database" → "PostgreSQL"
  3. Kopier connection string
  4. Legg den i `.env` filen

### 4. **Render**
- **Gratis tier**: 90 dager gratis, deretter $7/måned
- **URL**: https://render.com
- **Hvordan**:
  1. Opprett konto på Render
  2. Klikk "New" → "PostgreSQL"
  3. Kopier "Internal Database URL"
  4. Legg den i `.env` filen

## Lokal PostgreSQL (Alternativ)

Hvis du vil kjøre PostgreSQL lokalt:

```bash
# Installer PostgreSQL (Ubuntu/Debian)
sudo apt-get install postgresql postgresql-contrib

# Opprett database
sudo -u postgres psql
CREATE DATABASE hallbooking;
CREATE USER hallbooking_user WITH PASSWORD 'ditt_passord';
GRANT ALL PRIVILEGES ON DATABASE hallbooking TO hallbooking_user;
\q

# Connection string:
DATABASE_URL=postgresql://hallbooking_user:ditt_passord@localhost:5432/hallbooking
```

## Konfigurasjon

1. **Opprett `.env` fil** i prosjektroten:

```bash
# For SQLite (utvikling)
DATABASE_URL=sqlite:///./dev.db

# For PostgreSQL (produksjon)
# DATABASE_URL=postgresql://user:password@host:port/dbname

# Secret key
SECRET=din-super-hemmelige-nøkkel
```

2. **Installer avhengigheter**:

```bash
pipenv install
# eller
pip install -r requirements.txt
```

3. **Database migrasjoner**:

Tabellene opprettes automatisk når applikasjonen starter. Du kan også kjøre:

```bash
python update_db.py
```

## Eksempel Connection Strings

### Supabase
```
postgresql://postgres:[DITT-PASSORD]@db.[PROSJEKT-ID].supabase.co:5432/postgres
```

### Neon
```
postgresql://brukernavn:passord@ep-xxx.region.aws.neon.tech/dbname
```

### Railway
```
postgresql://postgres:passord@containers-us-west-xxx.railway.app:5432/railway
```

## Tips

- **Utvikling**: Bruk SQLite (`sqlite:///./dev.db`) for rask utvikling
- **Produksjon**: Bruk PostgreSQL (Supabase/Neon) for bedre ytelse og funksjonalitet
- **Sikkerhet**: Aldri commit `.env` filen til git!
- **Backup**: Gratis tier på Supabase/Neon inkluderer automatisk backup
