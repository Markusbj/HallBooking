from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from .database import Base
from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTableUUID
from sqlalchemy.dialects.postgresql import UUID
import uuid

class User(SQLAlchemyBaseUserTableUUID, Base):
    """
    Inherit the standard fastapi-users SQLAlchemy UUID user table.
    Keep only custom/profile fields here.
    """
    __tablename__ = "users"

    # custom profile fields
    full_name: Mapped[str | None] = mapped_column(String(length=255), nullable=True)
    name = Column(String, nullable=True)
    phone = Column(String, nullable=True)

    # relationship to bookings
    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    hall = Column(String, index=True, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)

    user = relationship("User", back_populates="bookings")