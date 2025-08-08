from sqlalchemy import Column, Integer, String, DateTime
from .database import Base
import uuid
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTableUUID

class User(SQLAlchemyBaseUserTableUUID, Base):
    # Arver id, email, hashed_password, is_active, is_superuser, is_verified
    # Legg til egne felter om du vil:
    full_name: Mapped[str | None] = mapped_column(String(length=255), nullable=True)





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