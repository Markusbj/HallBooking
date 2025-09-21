from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
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