from pydantic import BaseModel, model_validator
from datetime import datetime, time
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

    @model_validator(mode="after")
    def check_times_within_allowed_window(self):
        start: datetime = self.start_time
        end: datetime = self.end_time

        if start is None or end is None:
            raise ValueError("start_time and end_time are required")

        # must be same calendar day
        if start.date() != end.date():
            raise ValueError("Booking must start and end on the same day")

        if start >= end:
            raise ValueError("start_time must be before end_time")

        # allowed window: 17:00 .. 24:00 (midnight)
        earliest = time(17, 0, 0)
        latest = time(23, 59, 59, 999999)

        # Convert to naive time objects for comparison
        s_time = start.time() if start.tzinfo is None else start.astimezone().time()
        e_time = end.time() if end.tzinfo is None else end.astimezone().time()

        if s_time < earliest:
            raise ValueError("Bookings may not start before 17:00")
        if e_time > latest:
            raise ValueError("Bookings may not end after 24:00 (midnight)")

        return self

class PageContentCreate(BaseModel):
    page_name: str
    section_name: str
    content: str
    content_type: str = "text"

class PageContentUpdate(BaseModel):
    content: str
    content_type: str = "text"

class PageContentRead(BaseModel):
    id: str
    page_name: str
    section_name: str
    content: str
    content_type: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None

    class Config:
        from_attributes = True

class BlockedTimeCreate(BaseModel):
    block_type: str  # "day", "weekly", "hour"
    start_date: datetime
    end_date: datetime
    hour: Optional[int] = None  # Hour to block (0-23) for single hour blocks
    day_of_week: Optional[int] = None  # 0=Monday, 6=Sunday
    reason: Optional[str] = None

class BlockedTimeUpdate(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    reason: Optional[str] = None
    is_active: Optional[bool] = None

class BlockedTimeRead(BaseModel):
    id: str
    block_type: str
    start_date: datetime
    end_date: datetime
    hour: Optional[int] = None
    day_of_week: Optional[int] = None
    reason: Optional[str] = None
    is_active: bool
    created_at: datetime
    created_by: Optional[str] = None

    class Config:
        from_attributes = True

class NewsItemCreate(BaseModel):
    title: str
    content: str
    excerpt: Optional[str] = None
    item_type: str  # "kurs", "seminar", "nyhet"
    event_date: Optional[datetime] = None
    published: bool = False
    featured: bool = False
    image_url: Optional[str] = None

class NewsItemUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    item_type: Optional[str] = None
    event_date: Optional[datetime] = None
    published: Optional[bool] = None
    featured: Optional[bool] = None
    image_url: Optional[str] = None

class NewsItemRead(BaseModel):
    id: str
    title: str
    content: str
    excerpt: Optional[str] = None
    item_type: str
    event_date: Optional[datetime] = None
    published: bool
    featured: bool
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None

    class Config:
        from_attributes = True