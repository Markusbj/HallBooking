from sqlalchemy import Column, Integer, String, DateTime, Text
from .database import Base
import uuid
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTableUUID
from datetime import datetime

class User(SQLAlchemyBaseUserTableUUID, Base):
    # Arver id, email, hashed_password, is_active, is_superuser, is_verified
    # Legg til egne felter om du vil:
    
    full_name: Mapped[str | None] = mapped_column(String(length=255), nullable=True)

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