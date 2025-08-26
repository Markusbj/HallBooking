from sqlalchemy.orm import Session
from . import models, schemas

def create_booking(db: Session, booking: schemas.BookingCreate, user_id: int):
    db_booking = models.Booking(
        user_id=user_id,
        hall=booking.hall,
        start_time=booking.start_time,
        end_time=booking.end_time
    )
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking

def get_bookings(db: Session, skip=0, limit=10):
    return db.query(models.Booking).offset(skip).limit(limit).all()

# --- NEW: update user profile helper ---
def update_user_profile(db: Session, user_id, data: dict):
    """
    Update fields on models.User for given user_id and persist to DB.
    Returns the updated user model or None if not found.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return None
    for k, v in data.items():
        if hasattr(user, k) and v is not None:
            setattr(user, k, v)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user