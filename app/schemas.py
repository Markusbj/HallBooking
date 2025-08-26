from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional
from fastapi_users import schemas
import uuid

class UserRead(schemas.BaseUser[uuid.UUID]):
    full_name: Optional[str] = None

class UserCreate(schemas.BaseUserCreate):
    full_name: Optional[str] = None

class UserUpdate(schemas.BaseUserUpdate):
    full_name: Optional[str] = None


class BookingCreate(BaseModel):
    hall: str
    start_time: datetime
    end_time: datetime

    @field_validator("end_time")
    @classmethod
    def check_interval(cls, v, info):
        start = info.data.get("start_time")
        if start and v <= start:
            raise ValueError("end_time må være etter start_time")
        return v