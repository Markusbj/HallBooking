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
# Bruk samme database connection som i database.py
from .database import engine, AsyncSessionLocal

async_engine = engine
async_session_maker = AsyncSessionLocal

async def create_db_and_tables():
    logger.info("Creating database tables...")
    try:
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully")
        
        # Add missing columns to existing tables (migration)
        # This handles adding new columns to the User table without requiring a separate migration script
        from sqlalchemy import text
        async with AsyncSessionLocal() as db:
            try:
                # Check if privacy columns exist in user table
                check_query = text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = :table_name 
                    AND column_name IN ('privacy_accepted', 'privacy_accepted_date')
                """)
                result = await db.execute(check_query, {"table_name": "user"})
                existing_columns = [row[0] for row in result.fetchall()]
                
                # Add privacy_accepted column if missing
                if 'privacy_accepted' not in existing_columns:
                    logger.info("Adding privacy_accepted column to user table...")
                    alter_query1 = text('ALTER TABLE "user" ADD COLUMN privacy_accepted BOOLEAN NOT NULL DEFAULT FALSE')
                    await db.execute(alter_query1)
                    await db.commit()
                    logger.info("✅ Added privacy_accepted column")
                
                # Add privacy_accepted_date column if missing
                if 'privacy_accepted_date' not in existing_columns:
                    logger.info("Adding privacy_accepted_date column to user table...")
                    alter_query2 = text('ALTER TABLE "user" ADD COLUMN privacy_accepted_date TIMESTAMP NULL')
                    await db.execute(alter_query2)
                    await db.commit()
                    logger.info("✅ Added privacy_accepted_date column")
                    
            except Exception as migration_error:
                # Don't fail startup if migration fails (might be permission issues or columns already exist)
                # Log the error but continue
                logger.warning(f"Could not add privacy columns (may already exist): {migration_error}")
                await db.rollback()

            # Migrate bookings table: rename user_id to created_by if needed
            try:
                check_booking_query = text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'bookings'
                """)
                result = await db.execute(check_booking_query)
                booking_columns = {row[0] for row in result.fetchall()}
                
                if 'user_id' in booking_columns and 'created_by' not in booking_columns:
                    logger.info("Migrating bookings table: renaming user_id to created_by...")
                    # Rename column (PostgreSQL syntax)
                    alter_booking_query = text('ALTER TABLE bookings RENAME COLUMN user_id TO created_by')
                    await db.execute(alter_booking_query)
                    await db.commit()
                    logger.info("✅ Migrated bookings.user_id to created_by")
                
                # Add updated_at column if missing
                if 'updated_at' not in booking_columns:
                    logger.info("Adding updated_at column to bookings table...")
                    alter_updated_query = text('ALTER TABLE bookings ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
                    await db.execute(alter_updated_query)
                    await db.commit()
                    logger.info("✅ Added updated_at column to bookings")
                    
            except Exception as booking_migration_error:
                logger.warning(f"Could not migrate bookings table (may already be migrated): {booking_migration_error}")
                await db.rollback()

        # Seed default subscription plans (tilgang1/tilgang2) if missing
        try:
            from sqlalchemy import select
            from .models import SubscriptionPlan

            async with AsyncSessionLocal() as db:
                existing = await db.execute(select(SubscriptionPlan.code))
                existing_codes = {row[0] for row in existing.fetchall()}

                defaults = [
                    SubscriptionPlan(
                        code="tilgang1",
                        name="Tilgang 1 (1 år)",
                        duration_months=12,
                        default_hours_per_week=2,
                        is_active=True,
                    ),
                    SubscriptionPlan(
                        code="tilgang2",
                        name="Tilgang 2 (6 måneder)",
                        duration_months=6,
                        default_hours_per_week=2,
                        is_active=True,
                    ),
                ]

                to_add = [p for p in defaults if p.code not in existing_codes]
                if to_add:
                    logger.info(f"Seeding subscription plans: {[p.code for p in to_add]}")
                    db.add_all(to_add)
                    await db.commit()
                    logger.info("✅ Seeded subscription plans")
        except Exception as seed_error:
            logger.warning(f"Could not seed subscription plans: {seed_error}")
                
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
bearer_transport = BearerTransport(tokenUrl="/auth/jwt/login")

def get_jwt_strategy() -> JWTStrategy:
    logger.debug("Creating JWT strategy")
    # JWT token expires after 25 minutes for inactivity timeout
    # Frontend will track inactivity and logout before this expires
    return JWTStrategy(secret=settings.SECRET, lifetime_seconds=60 * 25)

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