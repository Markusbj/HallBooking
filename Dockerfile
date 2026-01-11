# Dockerfile for HallBooking Backend
# Dette gjør det enklere å deploye på mange plattformer

FROM python:3.12-slim

# Sett arbeidsmappe
WORKDIR /app

# Installer system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Kopier dependency filer
COPY Pipfile Pipfile.lock ./

# Installer pipenv og dependencies
RUN pip install pipenv && \
    pipenv install --deploy --system

# Kopier resten av applikasjonen
COPY . .

# Eksponer port
EXPOSE 8000

# Start kommando
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
