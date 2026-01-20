from pydantic import BaseModel, model_validator
from datetime import datetime, time, timezone
from typing import Optional
from fastapi_users import schemas
import uuid

class UserRead(schemas.BaseUser[uuid.UUID]):
    full_name: Optional[str] = None
    privacy_accepted: Optional[bool] = None
    privacy_accepted_date: Optional[datetime] = None

class UserCreate(schemas.BaseUserCreate):
    full_name: Optional[str] = None

class UserUpdate(schemas.BaseUserUpdate):
    full_name: Optional[str] = None
    privacy_accepted: Optional[bool] = None
    privacy_accepted_date: Optional[datetime] = None


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

        # Cannot book in the past (compare using same tz-awareness as start_time)
        now = datetime.now(start.tzinfo) if start.tzinfo else datetime.now()
        if start < now:
            raise ValueError("Kan ikke booke i fortid")

        if start >= end:
            raise ValueError("start_time must be before end_time")

        # Convert to local times for comparison (supports tz-aware inputs)
        s_local = start if start.tzinfo is None else start.astimezone()
        e_local = end if end.tzinfo is None else end.astimezone()

        s_time = s_local.time()
        e_time = e_local.time()

        earliest_start = time(17, 0, 0)
        latest_start = time(23, 0, 0)

        if s_time < earliest_start:
            raise ValueError("Bookings may not start before 17:00")
        if s_time > latest_start:
            raise ValueError("Bookings may not start after 23:00")

        # End time must be <= 24:00. Note: 24:00 is represented as 00:00 next day.
        if s_local.date() == e_local.date():
            # Same day: end must be before midnight and after start
            if e_time <= s_time:
                raise ValueError("end_time must be after start_time")
            if e_time > time(23, 59, 59, 999999):
                raise ValueError("Bookings may not end after 24:00 (midnight)")
        else:
            # Allow exactly midnight next day
            from datetime import timedelta as _td
            if not (e_time == time(0, 0, 0) and e_local.date() == (s_local.date() + _td(days=1))):
                raise ValueError("Booking must end same day, or at 00:00 the next day")

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


# --- Subscription / rettigheter ---
class SubscriptionPlanRead(BaseModel):
    code: str
    name: str
    duration_months: int
    default_hours_per_week: int
    is_active: bool

    class Config:
        from_attributes = True


class UserSubscriptionRead(BaseModel):
    id: str
    user_id: str
    plan_code: str
    start_date: datetime
    end_date: datetime
    hours_per_week: int
    is_active: bool

    class Config:
        from_attributes = True


class AdminUpsertUserSubscription(BaseModel):
    plan_code: str
    hours_per_week: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    extend_days: Optional[int] = None
    extend_months: Optional[int] = None