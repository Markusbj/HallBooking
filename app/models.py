from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from .database import Base
import uuid
from sqlalchemy.orm import Mapped, mapped_column
from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTableUUID
from datetime import datetime

class User(SQLAlchemyBaseUserTableUUID, Base):
    # Arver id, email, hashed_password, is_active, is_superuser, is_verified
    # Legg til egne felter om du vil:
    
    full_name: Mapped[str | None] = mapped_column(String(length=255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(length=20), nullable=True)
    privacy_accepted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)  # GDPR privacy policy acceptance
    privacy_accepted_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)  # When privacy was accepted

class PageContent(Base):
    __tablename__ = "page_content"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    page_name: Mapped[str] = mapped_column(String(100), index=True)  # e.g., "landing", "kontakt", "om-oss"
    section_name: Mapped[str] = mapped_column(String(100), index=True)  # e.g., "hero_title", "contact_address"
    content: Mapped[str] = mapped_column(Text)  # HTML or plain text content
    content_type: Mapped[str] = mapped_column(String(20), default="text")  # "text", "html", "markdown"
    created_at: Mapped[DateTime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[DateTime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    created_by: Mapped[str] = mapped_column(String, nullable=True)  # user_id who created/updated
    
    # Unique constraint on page_name + section_name combination
    __table_args__ = (
        {"extend_existing": True},
    )

class BlockedTime(Base):
    __tablename__ = "blocked_time"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    block_type: Mapped[str] = mapped_column(String(20))  # "day", "weekly", "hour"
    start_date: Mapped[datetime] = mapped_column(DateTime)  # Start date
    end_date: Mapped[datetime] = mapped_column(DateTime)  # End date
    hour: Mapped[int] = mapped_column(Integer, nullable=True)  # Hour to block (0-23) for single hour blocks
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=True)  # 0=Monday, 6=Sunday for weekly blocks
    reason: Mapped[str] = mapped_column(String(255), nullable=True)  # Reason for blocking
    is_active: Mapped[bool] = mapped_column(default=True)  # Can be temporarily disabled
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    created_by: Mapped[str] = mapped_column(String, nullable=True)  # user_id who created the block

class NewsItem(Base):
    __tablename__ = "news_items"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255))  # Title of the news/course/seminar
    content: Mapped[str] = mapped_column(Text)  # Full content (HTML or markdown)
    excerpt: Mapped[str] = mapped_column(String(500), nullable=True)  # Short description for preview
    item_type: Mapped[str] = mapped_column(String(20))  # "kurs", "seminar", "nyhet"
    event_date: Mapped[datetime] = mapped_column(DateTime, nullable=True)  # When the course/seminar takes place
    published: Mapped[bool] = mapped_column(default=False)  # Whether it's published and visible
    featured: Mapped[bool] = mapped_column(default=False)  # Whether to show on front page
    image_url: Mapped[str] = mapped_column(String(500), nullable=True)  # Optional image URL
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    created_by: Mapped[str] = mapped_column(String, nullable=True)  # user_id who created it

class UserSession(Base):
    __tablename__ = "user_sessions"
    
    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, index=True, nullable=False)  # Reference to User.id
    session_token: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)  # JWT token (or hash)
    device_info: Mapped[str] = mapped_column(String(500), nullable=True)  # Browser/device info
    last_activity: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)  # When session expires

class AuthorizationCode(Base):
    __tablename__ = "authorization_codes"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, index=True, nullable=False)  # Reference to User.id
    code_hash: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    code_challenge: Mapped[str] = mapped_column(String, nullable=False)
    code_challenge_method: Mapped[str] = mapped_column(String(10), nullable=False, default="S256")
    redirect_uri: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime, default=datetime.now)
    expires_at: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    used_at: Mapped[DateTime | None] = mapped_column(DateTime, nullable=True)

# --- Booking + Abonnement (rettigheter) ---
class Booking(Base):
    """
    Persistente bookinger.
    NB: Vi lagrer `created_by` som string (UUID-str) for å fungere likt på SQLite/PostgreSQL.
    """
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    hall: Mapped[str] = mapped_column(String(255))
    start_time: Mapped[datetime] = mapped_column(DateTime, index=True)
    end_time: Mapped[datetime] = mapped_column(DateTime, index=True)
    created_by: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)


class SubscriptionPlan(Base):
    """
    Abonnement-planer (tilgang1/tilgang2).
    """
    __tablename__ = "subscription_plans"

    code: Mapped[str] = mapped_column(String(50), primary_key=True)  # e.g. "tilgang1"
    name: Mapped[str] = mapped_column(String(255))
    duration_months: Mapped[int] = mapped_column(Integer)  # 12, 6, ...
    default_hours_per_week: Mapped[int] = mapped_column(Integer, default=2)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)


class UserSubscription(Base):
    """
    Brukerens aktive abonnement (kan også brukes som historikk hvis man setter is_active=False).
    """
    __tablename__ = "user_subscriptions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)  # UUID-str
    plan_code: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    hours_per_week: Mapped[int] = mapped_column(Integer, default=2)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)




# class User(Base):
#     __tablename__ = "users"
#     id = Column(Integer, primary_key=True, index=True)
#     username = Column(String, unique=True, index=True)
#     hashed_password = Column(String)

# class Booking(Base):
#     __tablename__ = "bookings"
#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, index=True)
#     hall = Column(String)
#     start_time = Column(DateTime)
#     end_time = Column(DateTime)