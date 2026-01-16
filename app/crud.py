from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
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
async def get_user_by_id(db: AsyncSession, user_id: int):
    """Get user by ID"""
    result = await db.execute(select(models.User).filter(models.User.id == user_id))
    return result.scalar_one_or_none()

async def get_all_users(db: AsyncSession):
    """Get all users"""
    result = await db.execute(select(models.User))
    return result.scalars().all()

async def update_user_profile(db: AsyncSession, user_id, data: dict):
    """
    Update fields on models.User for given user_id and persist to DB.
    Returns the updated user model or None if not found.
    """
    from datetime import timezone
    result = await db.execute(select(models.User).filter(models.User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return None
    for k, v in data.items():
        if hasattr(user, k) and v is not None:
            # Convert timezone-aware datetime strings to naive datetime objects for PostgreSQL
            if k == 'privacy_accepted_date' and isinstance(v, str):
                try:
                    # Parse ISO string to datetime
                    dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
                    # Convert to UTC naive datetime (PostgreSQL TIMESTAMP WITHOUT TIME ZONE)
                    if dt.tzinfo is not None:
                        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
                    v = dt
                except (ValueError, AttributeError):
                    # If parsing fails, keep original value
                    pass
            elif k == 'privacy_accepted_date' and isinstance(v, datetime):
                # If already a datetime object, ensure it's naive UTC
                if v.tzinfo is not None:
                    # Convert timezone-aware datetime to naive UTC
                    v = v.astimezone(timezone.utc).replace(tzinfo=None)
                # Already naive, use as-is
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

# News Items CRUD operations
async def get_news_items(db: AsyncSession, item_type: str = None, published: bool = None, featured: bool = None, limit: int = None):
    """Get news items with optional filters"""
    query = select(models.NewsItem)
    
    if item_type:
        query = query.filter(models.NewsItem.item_type == item_type)
    if published is not None:
        query = query.filter(models.NewsItem.published == published)
    if featured is not None:
        query = query.filter(models.NewsItem.featured == featured)
    
    query = query.order_by(models.NewsItem.event_date.desc().nulls_last(), models.NewsItem.created_at.desc())
    
    if limit:
        query = query.limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()

async def get_news_item(db: AsyncSession, item_id: str):
    """Get a single news item by ID"""
    result = await db.execute(select(models.NewsItem).filter(models.NewsItem.id == item_id))
    return result.scalar_one_or_none()

async def create_news_item(db: AsyncSession, news_item: schemas.NewsItemCreate, user_id: str):
    """Create new news item"""
    # Convert timezone-aware datetime to timezone-naive UTC if needed
    event_date = news_item.event_date
    if event_date and hasattr(event_date, 'tzinfo') and event_date.tzinfo is not None:
        # Convert to UTC first, then remove timezone info
        event_date = event_date.astimezone(timezone.utc).replace(tzinfo=None)
    
    db_news_item = models.NewsItem(
        title=news_item.title,
        content=news_item.content,
        excerpt=news_item.excerpt,
        item_type=news_item.item_type,
        event_date=event_date,
        published=news_item.published,
        featured=news_item.featured,
        image_url=news_item.image_url,
        created_by=user_id
    )
    db.add(db_news_item)
    await db.commit()
    await db.refresh(db_news_item)
    return db_news_item

async def update_news_item(db: AsyncSession, item_id: str, news_item: schemas.NewsItemUpdate, user_id: str):
    """Update existing news item"""
    result = await db.execute(select(models.NewsItem).filter(models.NewsItem.id == item_id))
    db_news_item = result.scalar_one_or_none()
    if not db_news_item:
        return None
    
    update_data = news_item.dict(exclude_unset=True)
    for field, value in update_data.items():
        # Convert timezone-aware datetime to timezone-naive UTC if needed
        if field == 'event_date' and value is not None and hasattr(value, 'tzinfo') and value.tzinfo is not None:
            value = value.astimezone(timezone.utc).replace(tzinfo=None)
        setattr(db_news_item, field, value)
    
    db_news_item.updated_at = datetime.now()
    
    db.add(db_news_item)
    await db.commit()
    await db.refresh(db_news_item)
    return db_news_item

async def delete_news_item(db: AsyncSession, item_id: str):
    """Delete news item"""
    result = await db.execute(select(models.NewsItem).filter(models.NewsItem.id == item_id))
    db_news_item = result.scalar_one_or_none()
    if not db_news_item:
        return None
    
    await db.delete(db_news_item)
    await db.commit()
    return db_news_item

# User Session CRUD operations
async def create_user_session(db: AsyncSession, user_id: str, session_token: str, device_info: str = None, expires_in_minutes: int = 25):
    """Create a new user session"""
    from datetime import timedelta
    
    expires_at = datetime.now() + timedelta(minutes=expires_in_minutes)
    
    db_session = models.UserSession(
        user_id=user_id,
        session_token=session_token,
        device_info=device_info,
        expires_at=expires_at
    )
    db.add(db_session)
    await db.commit()
    await db.refresh(db_session)
    return db_session

async def get_user_sessions(db: AsyncSession, user_id: str, active_only: bool = True):
    """Get all sessions for a user"""
    query = select(models.UserSession).filter(models.UserSession.user_id == user_id)
    if active_only:
        query = query.filter(models.UserSession.expires_at > datetime.now())
    query = query.order_by(models.UserSession.last_activity.desc())
    
    result = await db.execute(query)
    return result.scalars().all()

async def get_user_session_by_token(db: AsyncSession, session_token: str):
    """Get a session by token"""
    result = await db.execute(
        select(models.UserSession)
        .filter(models.UserSession.session_token == session_token)
        .filter(models.UserSession.expires_at > datetime.now())
    )
    return result.scalar_one_or_none()

async def update_session_activity(db: AsyncSession, session_token: str):
    """Update last activity time for a session"""
    session = await get_user_session_by_token(db, session_token)
    if session:
        session.last_activity = datetime.now()
        db.add(session)
        await db.commit()
        await db.refresh(session)
    return session

async def delete_user_session(db: AsyncSession, session_token: str):
    """Delete a user session"""
    result = await db.execute(select(models.UserSession).filter(models.UserSession.session_token == session_token))
    db_session = result.scalar_one_or_none()
    if not db_session:
        return None
    
    await db.delete(db_session)
    await db.commit()
    return db_session

async def delete_expired_sessions(db: AsyncSession):
    """Delete expired sessions"""
    result = await db.execute(select(models.UserSession).filter(models.UserSession.expires_at <= datetime.now()))
    expired_sessions = result.scalars().all()
    for session in expired_sessions:
        await db.delete(session)
    await db.commit()
    return len(expired_sessions)

async def enforce_session_limit(db: AsyncSession, user_id: str, max_sessions: int = 2):
    """Enforce maximum number of active sessions per user. Returns number of sessions deleted."""
    sessions = await get_user_sessions(db, user_id, active_only=True)
    if len(sessions) >= max_sessions:
        # Delete oldest sessions, keeping the newest ones
        sessions.sort(key=lambda s: s.last_activity, reverse=True)
        sessions_to_delete = sessions[max_sessions - 1:]
        for session in sessions_to_delete:
            await db.delete(session)
        await db.commit()
        return len(sessions_to_delete)
    return 0