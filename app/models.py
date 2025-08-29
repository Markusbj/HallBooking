from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base
from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTableUUID
from sqlalchemy.dialects.postgresql import UUID

class User(SQLAlchemyBaseUserTableUUID, Base):
    __tablename__ = "users"

    # restore full_name to match existing DB schema
    full_name = Column(String, nullable=True)

    # keep only profile fields that actually exist in your DB
    name = Column(String, nullable=True)
    phone = Column(String, nullable=True)

    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    hall = Column(String, index=True, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)

    user = relationship("User", back_populates="bookings")