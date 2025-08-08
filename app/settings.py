from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET: str = "CHANGE_ME"  # legg i .env i prod
    DATABASE_URL: str = "sqlite:///./test.db"  # bytt til Postgres senere

    class Config:
        env_file = ".env"

settings = Settings()