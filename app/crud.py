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