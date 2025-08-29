import os
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

# lokal sqlite-fil (relativ til prosjektrot)
DB_FILE = os.getenv("SQLITE_FILE", "dev.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{DB_FILE}")

# async engine for runtime
engine = create_async_engine(DATABASE_URL, echo=False, future=True)

# async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine, expire_on_commit=False
)

# expose a sync engine for create_all convenience
# SQLAlchemy 2.0 offers engine.sync_engine; if not available we can create one:
try:
    sync_engine = engine.sync_engine
except AttributeError:
    # fallback (shouldn't normally be needed with modern SQLAlchemy)
    from sqlalchemy import create_engine as _create_engine
    sync_engine = _create_engine(DATABASE_URL.replace("+aiosqlite", ""), future=True)

# Base for models
Base = declarative_base()

# dependency for path operations that need a DB session
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session