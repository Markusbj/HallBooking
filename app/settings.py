from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    SECRET: str = "CHANGE_ME"  # legg i .env i prod
    # Støtter både SQLite og PostgreSQL
    # SQLite: sqlite:///./dev.db
    # PostgreSQL: postgresql://user:password@localhost/dbname
    # Eller for cloud (Supabase/Neon): postgresql://user:password@host:port/dbname
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./dev.db")

    class Config:
        env_file = ".env"

settings = Settings()