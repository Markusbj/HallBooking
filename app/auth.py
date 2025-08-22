import uuid
import logging
from typing import AsyncGenerator
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from fastapi_users import FastAPIUsers
from fastapi_users import BaseUserManager, UUIDIDMixin
from fastapi_users.authentication import AuthenticationBackend, BearerTransport, JWTStrategy
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase

from .models import User
from .settings import settings
from .database import Base

# Sett opp logging
logger = logging.getLogger(__name__)

# ---- DB (async) ----
ASYNC_DATABASE_URL = settings.DATABASE_URL.replace("sqlite:///", "sqlite+aiosqlite:///")
async_engine = create_async_engine(ASYNC_DATABASE_URL, future=True, echo=False)
async_session_maker = async_sessionmaker(async_engine, expire_on_commit=False)

async def create_db_and_tables():
    logger.info("Creating database tables...")
    try:
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise

async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    logger.debug("Getting async database session")
    async with async_session_maker() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Database session error: {e}")
            raise
        finally:
            logger.debug("Closing async database session")

async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    logger.debug("Getting user database")
    yield SQLAlchemyUserDatabase(session, User)

# ---- UserManager (krav i v12) ----
class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = settings.SECRET
    verification_token_secret = settings.SECRET

    async def on_after_register(self, user: User, request=None):
        logger.info(f"User {user.id} registered successfully")
        print(f"User {user.id} registered")

async def get_user_manager(user_db=Depends(get_user_db)):
    logger.debug("Getting user manager")
    yield UserManager(user_db)

# ---- Auth backend (JWT) ----
# VIKTIG: tokenUrl skal være relativ til root
bearer_transport = BearerTransport(tokenUrl="/jwt/login")

def get_jwt_strategy() -> JWTStrategy:
    logger.debug("Creating JWT strategy")
    return JWTStrategy(secret=settings.SECRET, lifetime_seconds=60 * 60 * 24)

auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, uuid.UUID](
    get_user_manager,     
    [auth_backend],
)

current_active_user = fastapi_users.current_user(active=True)

# Log auth events
logger.info("Auth system initialized successfully")