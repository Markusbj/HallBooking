from pydantic import BaseModel, model_validator
from datetime import datetime
from fastapi_users import schemas
from typing import Optional
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

    @model_validator(mode="after")
    def check_interval(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time må være etter start_time")
        return self