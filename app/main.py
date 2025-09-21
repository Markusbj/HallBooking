from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from . import models, schemas, crud, database
from .database import Base, engine, get_db
from .models import User
from .schemas import UserRead, UserCreate, UserUpdate, BookingCreate
from .auth import fastapi_users, auth_backend, current_active_user, create_db_and_tables
from datetime import datetime, timedelta, date as date_type, timezone
from typing import List, Dict, Any
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
import uuid
import logging
import time

# Sett opp logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting HallBooking API...")
    await create_db_and_tables()
    logger.info("✅ Database tables created")
    yield
    logger.info("🛑 Shutting down HallBooking API...")

app = FastAPI(title="HallBooking API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple request logger
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    logger.info(f"➡️ {request.method} {request.url}")
    important_headers = {
        'content-type': request.headers.get('content-type'),
        'user-agent': request.headers.get('user-agent'),
        'origin': request.headers.get('origin'),
    }
    logger.info(f"📋 Headers: {important_headers}")
    if request.method == "POST":
        try:
            body = await request.body()
            if body:
                logger.info(f"📦 Body: {body.decode()}")
            # Restore the request stream for downstream handlers
            async def receive():
                return {"type": "http.request", "body": body, "more_body": False}
            request._receive = receive
        except Exception as e:
            logger.warning(f"⚠️ Could not read body: {e}")
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"📤 Response: {response.status_code} ({process_time:.3f}s)")
    return response
# Auth-rutere
app.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth/jwt",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)

@app.get("/")
async def root():
    logger.info("🏠 Root endpoint accessed")
    return {"msg": "Auth er oppe. Gå til /docs for å teste."}

# In-memory booking store (erstatt med DB senere)
BOOKINGS: Dict[str, Dict[str, Any]] = {}

# Fargekart (bruk disse i frontend)
CALENDAR_COLORS = {
    "empty": "#F2F2F2",
    "booked": "#D88A44",
    "blocked": "#7A8B6F",
}

def _hour_range_for_date(target_date: date_type) -> List[Dict[str, Any]]:
    slots = []
    # Only show allowed booking hours: 17:00-23:00 (5 PM - 11 PM)
    for h in range(17, 24):
        start = datetime(target_date.year, target_date.month, target_date.day, h, 0, 0)
        end = start + timedelta(hours=1)
        slots.append({
            "hour": h,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
            "booking_ids": [],
            "status": "empty",
            "color": CALENDAR_COLORS["empty"],
        })
    return slots


def _to_local_naive(dt):
    """
    Return a naive datetime in the server local timezone.
    Accepts ISO strings or tz-aware datetimes; converts to local tz then strips tzinfo.
    """
    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt)
    if dt.tzinfo is not None:
        # Hent systemets lokale sone uten ekstra avhengighet
        local_tz = datetime.now().astimezone().tzinfo
        dt = dt.astimezone(local_tz).replace(tzinfo=None)
    return dt

def _apply_bookings_to_slots(slots: List[Dict[str, Any]]):
    for booking in BOOKINGS.values():
        b_start = _to_local_naive(booking["start_time"])
        b_end = _to_local_naive(booking["end_time"])
        for slot in slots:
            slot_start = _to_local_naive(slot["start_time"])
            slot_end = _to_local_naive(slot["end_time"])
            # overlap-test
            if not (b_end <= slot_start or b_start >= slot_end):
                slot.setdefault("booking_ids", []).append(booking["id"])
                slot["status"] = "booked"
                slot["color"] = CALENDAR_COLORS.get("booked", slot.get("color"))
                
def _require_admin(user):
    if not getattr(user, "is_superuser", False):
        raise HTTPException(status_code=403, detail="Administrator-tilgang kreves")

@app.get("/bookings/{target_date}")
async def get_bookings_calendar(target_date: str):
    """
    Return a calendar view (hourly slots) for given date (YYYY-MM-DD).
    """
    try:
        d = datetime.strptime(target_date, "%Y-%m-%d").date()
    except Exception:
        raise HTTPException(status_code=400, detail="target_date must be YYYY-MM-DD")
    slots = _hour_range_for_date(d)
    _apply_bookings_to_slots(slots)
    return {
        "date": d.isoformat(),
        "slots": slots,
        "colors": CALENDAR_COLORS,
    }

@app.post("/bookings")
async def create_booking(booking: BookingCreate, user=Depends(current_active_user)):
    booking_id = str(uuid.uuid4())

    # Normalize incoming datetimes to local naive before storing (prevents shift)
    start_local = _to_local_naive(booking.start_time)
    end_local = _to_local_naive(booking.end_time)

    BOOKINGS[booking_id] = {
        "id": booking_id,
        "hall": booking.hall,
        "start_time": start_local,
        "end_time": end_local,
        "created_by": getattr(user, "id", None),
    }
    logger.info(f"Created booking {booking_id} by user {getattr(user, 'id', None)}")
    return {"id": booking_id, "msg": "Booking opprettet"}

@app.put("/bookings/{booking_id}")
async def update_booking(booking_id: str, payload: BookingCreate, user=Depends(current_active_user)):
    _require_admin(user)
    if booking_id not in BOOKINGS:
        raise HTTPException(status_code=404, detail="Booking ikke funnet")
    BOOKINGS[booking_id].update({
        "hall": payload.hall,
        "start_time": payload.start_time,
        "end_time": payload.end_time,
    })
    logger.info(f"Booking {booking_id} oppdatert av admin {getattr(user, 'id', None)}")
    return {"id": booking_id, "msg": "Booking oppdatert"}

@app.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: str, user=Depends(current_active_user)):
    _require_admin(user)
    if booking_id not in BOOKINGS:
        raise HTTPException(status_code=404, detail="Booking ikke funnet")
    del BOOKINGS[booking_id]
    logger.info(f"Booking {booking_id} slettet av admin {getattr(user, 'id', None)}")
    return {"id": booking_id, "msg": "Booking slettet"}


@app.get("/users/me/bookings")
async def get_my_bookings(user=Depends(current_active_user)):
    """
    Return bookings created by the authenticated user.
    """
    user_id = getattr(user, "id", None)
    my = []
    for b in BOOKINGS.values():
        if b.get("created_by") == user_id:
            start = b["start_time"].isoformat() if isinstance(b["start_time"], datetime) else str(b["start_time"])
            end = b["end_time"].isoformat() if isinstance(b["end_time"], datetime) else str(b["end_time"])
            my.append({
                "id": b["id"],
                "hall": b.get("hall"),
                "start_time": start,
                "end_time": end,
            })
    return {"bookings": my}

# Add/replace profile pydantic model and endpoints to use DB session
class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None

@app.get("/users/me/profile")
async def get_my_profile(user=Depends(current_active_user)):
    """
    Return current user's profile (email, name, phone).
    """
    return {
        "email": getattr(user, "email", ""),
        "name": getattr(user, "name", "") if hasattr(user, "name") else "",
        "phone": getattr(user, "phone", "") if hasattr(user, "phone") else "",
    }

@app.put("/users/me/profile")
async def update_my_profile(payload: UserProfileUpdate, db: Session = Depends(database.get_db), user=Depends(current_active_user)):
    """
    Update current user's profile and persist to DB via crud.update_user_profile.
    """
    data = payload.dict(exclude_unset=True)
    # Use crud helper that persists changes
    if hasattr(crud, "update_user_profile"):
        updated = await crud.update_user_profile(db, user.id, data)
        if updated is None:
            raise HTTPException(status_code=404, detail="User not found")
        return {
            "ok": True,
            "user": {
                "email": getattr(updated, "email", ""),
                "name": getattr(updated, "name", ""),
                "phone": getattr(updated, "phone", ""),
            },
        }
    # fallback: attempt shallow local update (non-persistent)
    for k, v in data.items():
        if hasattr(user, k):
            setattr(user, k, v)
    return {"ok": True, "user": {"email": getattr(user, "email", ""), "name": getattr(user, "name", ""), "phone": getattr(user, "phone", "")}}