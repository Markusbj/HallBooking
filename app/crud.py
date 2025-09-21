from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from . import models, schemas

async def create_booking(db: AsyncSession, booking: schemas.BookingCreate, user_id: int):
    db_booking = models.Booking(
        user_id=user_id,
        hall=booking.hall,
        start_time=booking.start_time,
        end_time=booking.end_time
    )
    db.add(db_booking)
    await db.commit()
    await db.refresh(db_booking)
    return db_booking  # return object so route can respond with created booking

async def get_bookings(db: AsyncSession, skip=0, limit=10):
    result = await db.execute(select(models.Booking).offset(skip).limit(limit))
    return result.scalars().all()

# --- NEW: update user profile helper ---
async def update_user_profile(db: AsyncSession, user_id, data: dict):
    """
    Update fields on models.User for given user_id and persist to DB.
    Returns the updated user model or None if not found.
    """
    result = await db.execute(select(models.User).filter(models.User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return None
    for k, v in data.items():
        if hasattr(user, k) and v is not None:
            setattr(user, k, v)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

# Page Content CRUD operations
async def get_page_content(db: AsyncSession, page_name: str, section_name: str = None):
    """Get content for a specific page and optionally a specific section"""
    query = select(models.PageContent).filter(models.PageContent.page_name == page_name)
    if section_name:
        query = query.filter(models.PageContent.section_name == section_name)
    
    result = await db.execute(query)
    if section_name:
        return result.scalar_one_or_none()
    return result.scalars().all()

async def get_all_page_content(db: AsyncSession):
    """Get all page content"""
    result = await db.execute(select(models.PageContent))
    return result.scalars().all()

async def create_page_content(db: AsyncSession, content: schemas.PageContentCreate, user_id: str):
    """Create new page content"""
    db_content = models.PageContent(
        page_name=content.page_name,
        section_name=content.section_name,
        content=content.content,
        content_type=content.content_type,
        created_by=user_id
    )
    db.add(db_content)
    await db.commit()
    await db.refresh(db_content)
    return db_content

async def update_page_content(db: AsyncSession, content_id: str, content: schemas.PageContentUpdate, user_id: str):
    """Update existing page content"""
    result = await db.execute(select(models.PageContent).filter(models.PageContent.id == content_id))
    db_content = result.scalar_one_or_none()
    if not db_content:
        return None
    
    db_content.content = content.content
    db_content.content_type = content.content_type
    db_content.created_by = user_id
    
    db.add(db_content)
    await db.commit()
    await db.refresh(db_content)
    return db_content

async def delete_page_content(db: AsyncSession, content_id: str):
    """Delete page content"""
    result = await db.execute(select(models.PageContent).filter(models.PageContent.id == content_id))
    db_content = result.scalar_one_or_none()
    if not db_content:
        return None
    
    await db.delete(db_content)
    await db.commit()
    return db_content

# Blocked Time CRUD operations
async def get_blocked_times(db: AsyncSession, start_date = None, end_date = None):
    """Get all blocked times, optionally filtered by date range"""
    query = select(models.BlockedTime).filter(models.BlockedTime.is_active == True)
    
    if start_date and end_date:
        # Convert date to datetime if needed
        if hasattr(start_date, 'date'):
            start_date = start_date.date()
        if hasattr(end_date, 'date'):
            end_date = end_date.date()
            
        # Convert to datetime for comparison
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        query = query.filter(
            (models.BlockedTime.start_date <= end_datetime) & 
            (models.BlockedTime.end_date >= start_datetime)
        )
    
    result = await db.execute(query)
    return result.scalars().all()

async def create_blocked_time(db: AsyncSession, blocked_time: schemas.BlockedTimeCreate, user_id: str):
    """Create new blocked time"""
    db_blocked_time = models.BlockedTime(
        block_type=blocked_time.block_type,
        start_date=blocked_time.start_date,
        end_date=blocked_time.end_date,
        hour=blocked_time.hour,
        day_of_week=blocked_time.day_of_week,
        reason=blocked_time.reason,
        created_by=user_id
    )
    db.add(db_blocked_time)
    await db.commit()
    await db.refresh(db_blocked_time)
    return db_blocked_time

async def update_blocked_time(db: AsyncSession, blocked_time_id: str, blocked_time: schemas.BlockedTimeUpdate, user_id: str):
    """Update existing blocked time"""
    result = await db.execute(select(models.BlockedTime).filter(models.BlockedTime.id == blocked_time_id))
    db_blocked_time = result.scalar_one_or_none()
    if not db_blocked_time:
        return None
    
    update_data = blocked_time.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_blocked_time, field, value)
    
    db_blocked_time.created_by = user_id
    
    db.add(db_blocked_time)
    await db.commit()
    await db.refresh(db_blocked_time)
    return db_blocked_time

async def delete_blocked_time(db: AsyncSession, blocked_time_id: str):
    """Delete blocked time"""
    result = await db.execute(select(models.BlockedTime).filter(models.BlockedTime.id == blocked_time_id))
    db_blocked_time = result.scalar_one_or_none()
    if not db_blocked_time:
        return None
    
    await db.delete(db_blocked_time)
    await db.commit()
    return db_blocked_time

async def is_time_blocked(db: AsyncSession, start_time: datetime, end_time: datetime):
    """Check if a specific time range is blocked"""
    blocked_times = await get_blocked_times(db, start_time.date(), end_time.date())
    
    for blocked in blocked_times:
        if blocked.block_type == "day":
            # Block entire day
            if (start_time.date() >= blocked.start_date.date() and 
                end_time.date() <= blocked.end_date.date()):
                return True, blocked
                
        elif blocked.block_type == "weekly":
            # Block specific day of week
            if (blocked.day_of_week is not None and
                start_time.weekday() == blocked.day_of_week and
                start_time.date() >= blocked.start_date.date() and
                end_time.date() <= blocked.end_date.date()):
                return True, blocked
                
        elif blocked.block_type == "hour":
            # Block specific hour
            if (blocked.hour is not None and
                start_time.hour == blocked.hour and
                start_time.date() >= blocked.start_date.date() and
                end_time.date() <= blocked.end_date.date()):
                return True, blocked
    
    return False, None