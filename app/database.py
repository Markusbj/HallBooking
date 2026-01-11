import os
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from .settings import settings

def get_database_url():
    """
    Henter DATABASE_URL fra settings og konverterer til async URL hvis nødvendig.
    Støtter både SQLite og PostgreSQL.
    """
    db_url = settings.DATABASE_URL
    
    # Hvis det er en PostgreSQL URL, konverter til asyncpg format
    if db_url.startswith("postgresql://"):
        # Konverter postgresql:// til postgresql+asyncpg://
        db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif db_url.startswith("postgres://"):
        # Konverter postgres:// til postgresql+asyncpg://
        db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif db_url.startswith("sqlite:///"):
        # Konverter sqlite:/// til sqlite+aiosqlite:///
        db_url = db_url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
    elif not db_url.startswith(("sqlite+aiosqlite://", "postgresql+asyncpg://")):
        # Fallback til SQLite hvis ingen spesifikk URL er gitt
        DB_FILE = os.getenv("SQLITE_FILE", "dev.db")
        db_url = f"sqlite+aiosqlite:///{DB_FILE}"
    
    return db_url

DATABASE_URL = get_database_url()

# async engine for runtime
engine = create_async_engine(DATABASE_URL, echo=False, future=True)

# async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine, expire_on_commit=False
)

# expose a sync engine for create_all convenience (kun for SQLite)
# For PostgreSQL bruker vi async engine direkte
try:
    if DATABASE_URL.startswith("sqlite"):
        sync_engine = engine.sync_engine
    else:
        # For PostgreSQL, lag en sync engine fra sync URL
        # Konverter fra asyncpg til psycopg2
        sync_url = settings.DATABASE_URL
        if sync_url.startswith("postgresql+asyncpg://"):
            sync_url = sync_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
        elif sync_url.startswith("postgresql://"):
            sync_url = sync_url.replace("postgresql://", "postgresql+psycopg2://", 1)
        from sqlalchemy import create_engine as _create_engine
        sync_engine = _create_engine(sync_url, future=True)
except AttributeError:
    # fallback (shouldn't normally be needed with modern SQLAlchemy)
    from sqlalchemy import create_engine as _create_engine
    if DATABASE_URL.startswith("sqlite"):
        sync_engine = _create_engine(DATABASE_URL.replace("+aiosqlite", ""), future=True)
    else:
        sync_url = settings.DATABASE_URL
        if sync_url.startswith("postgresql+asyncpg://"):
            sync_url = sync_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
        elif sync_url.startswith("postgresql://"):
            sync_url = sync_url.replace("postgresql://", "postgresql+psycopg2://", 1)
        sync_engine = _create_engine(sync_url, future=True)

# Base for models
Base = declarative_base()

# Import all models to ensure they are registered
from . import models

# dependency for path operations that need a DB session
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session