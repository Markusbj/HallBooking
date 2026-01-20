from fastapi import FastAPI, Depends, HTTPException, Request, UploadFile, File, BackgroundTasks, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from contextlib import asynccontextmanager
from starlette.datastructures import MutableHeaders
from . import models, schemas, crud, database
from .database import Base, engine, get_db
from .models import User
from .schemas import UserRead, UserCreate, UserUpdate, BookingCreate, NewsItemCreate, NewsItemUpdate, NewsItemRead
from .auth import fastapi_users, auth_backend, current_active_user, create_db_and_tables, get_user_manager, get_jwt_strategy
from datetime import datetime, timedelta, date as date_type, timezone
from typing import List, Dict, Any
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
import logging
import time
import os
import shutil
from pathlib import Path
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import shutil
from pathlib import Path
import secrets
import string
from passlib.context import CryptContext
import base64
import hashlib

# Sett opp logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create uploads directory if it doesn't exist
UPLOAD_ROOT = Path(os.getenv("UPLOAD_ROOT", "uploads"))
UPLOAD_DIR = UPLOAD_ROOT / "images"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting HallBooking API...")
    await create_db_and_tables()
    logger.info("✅ Database tables created")
    # Ensure upload directory exists
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    logger.info(f"✅ Upload directory ready: {UPLOAD_DIR}")
    yield
    logger.info("🛑 Shutting down HallBooking API...")

app = FastAPI(title="HallBooking API", lifespan=lifespan)

# CORS configuration - støtter både utvikling og produksjon

# Hent tillatte origins fra environment variable, eller bruk default for utvikling
allowed_origins_str = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,https://www.tgtromso.no,https://tgtromso.no"
)
# Split og strippe whitespace, fjern tomme strings
ALLOWED_ORIGINS: List[str] = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

# Alltid inkluder produksjons-domener hvis de ikke allerede er der
production_domains = ["https://www.tgtromso.no", "https://tgtromso.no"]
for domain in production_domains:
    if domain not in ALLOWED_ORIGINS:
        ALLOWED_ORIGINS.append(domain)

ENVIRONMENT = os.getenv("ENVIRONMENT", "")

# Log CORS config for debugging
logger.info(f"🔒 CORS Config: ENVIRONMENT={ENVIRONMENT}, ALLOWED_ORIGINS={ALLOWED_ORIGINS}")

# Bruk alltid eksplisitte origins i produksjon for bedre sikkerhet
# I utvikling kan vi bruke regex for fleksibilitet
if ENVIRONMENT == "production":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Utvikling: tillat localhost med regex + produksjons-domener
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https?://(www\.)?tgtromso\.no$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Inject bearer token from httpOnly cookie when missing
@app.middleware("http")
async def attach_auth_cookie(request: Request, call_next):
    if request.method != "OPTIONS":
        token = request.cookies.get("access_token")
        if token:
            headers = MutableHeaders(scope=request.scope)
            if "authorization" not in headers:
                headers["authorization"] = f"Bearer {token}"
    return await call_next(request)

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

# Mount static files directory to serve uploaded images (must come before routes)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_ROOT)), name="uploads")

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

# PKCE helpers for authorization code flow
def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")

def _verify_pkce(code_verifier: str, code_challenge: str, method: str) -> bool:
    if method == "S256":
        digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
        expected = _base64url_encode(digest)
        return secrets.compare_digest(expected, code_challenge)
    if method == "plain":
        return secrets.compare_digest(code_verifier, code_challenge)
    return False

@app.post("/auth/authorize", tags=["auth"])
async def authorize_pkce(
    username: str = Form(...),
    password: str = Form(...),
    code_challenge: str = Form(...),
    code_challenge_method: str = Form("S256"),
    redirect_uri: str | None = Form(None),
    state: str | None = Form(None),
    response_mode: str = Form("json"),
    user_manager=Depends(get_user_manager),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Authorization endpoint for PKCE flow. Returns JSON by default,
    or redirects when response_mode=redirect and redirect_uri is provided.
    """
    if code_challenge_method not in {"S256", "plain"}:
        raise HTTPException(status_code=400, detail="Unsupported code_challenge_method")

    credentials = OAuth2PasswordRequestForm(
        username=username,
        password=password,
        scope="",
        client_id=None,
        client_secret=None,
        grant_type="password"
    )
    user = await user_manager.authenticate(credentials)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    code = secrets.token_urlsafe(32)
    code_hash = hashlib.sha256(code.encode("ascii")).hexdigest()

    await crud.create_authorization_code(
        db=db,
        user_id=str(user.id),
        code_hash=code_hash,
        code_challenge=code_challenge,
        code_challenge_method=code_challenge_method,
        redirect_uri=redirect_uri
    )

    payload = {"code": code, "state": state}
    if response_mode == "redirect" and redirect_uri:
        params = [f"code={code}"]
        if state:
            params.append(f"state={state}")
        return RedirectResponse(f"{redirect_uri}?{'&'.join(params)}", status_code=302)
    return payload

@app.post("/auth/token", tags=["auth"])
async def token_pkce(
    grant_type: str = Form(...),
    code: str = Form(...),
    code_verifier: str = Form(...),
    redirect_uri: str | None = Form(None),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Token endpoint for PKCE flow. Exchanges authorization code + verifier for JWT.
    """
    if grant_type != "authorization_code":
        raise HTTPException(status_code=400, detail="Unsupported grant_type")

    code_hash = hashlib.sha256(code.encode("ascii")).hexdigest()
    auth_code = await crud.get_authorization_code(db, code_hash)
    if not auth_code:
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    if auth_code.used_at is not None or auth_code.expires_at <= datetime.now():
        raise HTTPException(status_code=400, detail="Invalid or expired code")
    if auth_code.redirect_uri and not redirect_uri:
        raise HTTPException(status_code=400, detail="redirect_uri is required")
    if auth_code.redirect_uri and redirect_uri and auth_code.redirect_uri != redirect_uri:
        raise HTTPException(status_code=400, detail="redirect_uri mismatch")
    if not _verify_pkce(code_verifier, auth_code.code_challenge, auth_code.code_challenge_method):
        raise HTTPException(status_code=400, detail="Invalid code_verifier")

    user = await crud.get_user_by_uuid(db, auth_code.user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    await crud.mark_authorization_code_used(db, auth_code)

    jwt_strategy = get_jwt_strategy()
    access_token = await jwt_strategy.write_token(user)
    expires_in = 60 * 25

    response = JSONResponse({
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": expires_in
    })
    # NOTE: SameSite=Lax requires API to be on same-site domain (e.g. api.tgtromso.no).
    # Since we are currently cross-site, use SameSite=None to allow cookies in all browsers.
    cookie_samesite = "none" if ENVIRONMENT == "production" else "lax"
    cookie_domain = os.getenv("COOKIE_DOMAIN")
    cookie_kwargs = {
        "key": "access_token",
        "value": access_token,
        "httponly": True,
        "secure": ENVIRONMENT == "production",
        "samesite": cookie_samesite,
        "max_age": expires_in
    }
    if cookie_domain:
        cookie_kwargs["domain"] = cookie_domain
    response.set_cookie(**cookie_kwargs)
    return response

@app.post("/auth/logout", tags=["auth"])
async def logout_pkce():
    response = JSONResponse({"message": "Logged out"})
    # NOTE: SameSite=Lax requires same-site API domain.
    cookie_samesite = "none" if ENVIRONMENT == "production" else "lax"
    cookie_domain = os.getenv("COOKIE_DOMAIN")
    response.delete_cookie(
        "access_token",
        samesite=cookie_samesite,
        secure=ENVIRONMENT == "production",
        domain=cookie_domain
    )
    return response

# Define custom PATCH /users/me BEFORE including users router
# This prevents FastAPI Users' default handler from being used
@app.patch("/users/me", response_model=UserRead)
async def update_current_user(
    user_update: UserUpdate,
    user=Depends(current_active_user),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Update current user with timezone-aware datetime conversion for privacy_accepted_date.
    """
    from datetime import timezone
    
    # Convert update data to dict
    # Use model_dump for Pydantic v2, fallback to dict for v1
    if hasattr(user_update, 'model_dump'):
        update_data = user_update.model_dump(exclude_unset=True)
    else:
        update_data = user_update.dict(exclude_unset=True)
    
    # Handle privacy_accepted_date datetime conversion
    # Pydantic may convert ISO strings to timezone-aware datetime objects
    if 'privacy_accepted_date' in update_data and update_data['privacy_accepted_date'] is not None:
        date_value = update_data['privacy_accepted_date']
        
        # Always convert to naive UTC datetime for PostgreSQL TIMESTAMP WITHOUT TIME ZONE
        if isinstance(date_value, str):
            # Parse ISO string to datetime
            try:
                dt = datetime.fromisoformat(date_value.replace('Z', '+00:00'))
                # Convert to UTC naive datetime
                if dt.tzinfo is not None:
                    dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
                update_data['privacy_accepted_date'] = dt
            except (ValueError, AttributeError) as e:
                logger.warning(f"Failed to parse datetime string: {e}")
                # Remove invalid date if parsing fails
                if 'privacy_accepted_date' in update_data:
                    del update_data['privacy_accepted_date']
        elif isinstance(date_value, datetime):
            # If already a datetime object, ensure it's naive UTC
            if date_value.tzinfo is not None:
                # Convert timezone-aware datetime to naive UTC
                naive_dt = date_value.astimezone(timezone.utc).replace(tzinfo=None)
                update_data['privacy_accepted_date'] = naive_dt
                logger.debug(f"Converted timezone-aware datetime to naive UTC")
            else:
                # Already naive, use as-is
                update_data['privacy_accepted_date'] = date_value
    
    # Update user using crud helper
    updated_user = await crud.update_user_profile(db, user.id, update_data)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserRead.model_validate(updated_user)

# Include users router (GET /users/me, etc.) AFTER our custom PATCH override
app.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)

# Session management endpoints
@app.post("/api/auth/register-session")
async def register_session(
    request: Request,
    user=Depends(current_active_user),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Register a new session for the logged-in user.
    Enforces maximum 2 active sessions per user.
    """
    import hashlib
    
    # Get token from Authorization header
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization")
    
    token = auth_header.replace("Bearer ", "")
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    # Get device info from request
    user_agent = request.headers.get("User-Agent", "Unknown")
    
    # Enforce session limit (max 2 sessions)
    await crud.enforce_session_limit(db, str(user.id), max_sessions=2)
    
    # Create new session
    session = await crud.create_user_session(
        db=db,
        user_id=str(user.id),
        session_token=token_hash,
        device_info=user_agent,
        expires_in_minutes=25
    )
    
    return {
        "session_id": session.id,
        "message": "Session registered successfully"
    }

@app.post("/api/auth/update-session")
async def update_session(
    request: Request,
    user=Depends(current_active_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Update session activity timestamp"""
    import hashlib
    
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization")
    
    token = auth_header.replace("Bearer ", "")
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    session = await crud.update_session_activity(db, token_hash)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    
    return {"message": "Session activity updated"}

@app.get("/api/auth/sessions")
async def get_sessions(
    user=Depends(current_active_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Get all active sessions for the current user"""
    sessions = await crud.get_user_sessions(db, str(user.id), active_only=True)
    return {
        "sessions": [
            {
                "id": str(s.id),
                "device_info": s.device_info,
                "last_activity": s.last_activity.isoformat(),
                "created_at": s.created_at.isoformat()
            }
            for s in sessions
        ]
    }

@app.delete("/api/auth/sessions/{session_id}")
async def delete_session(
    session_id: str,
    user=Depends(current_active_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Delete a specific session (user can only delete their own sessions)"""
    from sqlalchemy import select
    
    result = await db.execute(
        select(models.UserSession)
        .filter(models.UserSession.id == session_id)
        .filter(models.UserSession.user_id == str(user.id))
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    await crud.delete_user_session(db, session.session_token)
    return {"message": "Session deleted successfully"}

@app.get("/")
async def root():
    logger.info("🏠 Root endpoint accessed")
    return {"msg": "Auth er oppe. Gå til /docs for å teste."}

# Booking data is persisted in the database

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

def _apply_bookings_to_slots(slots: List[Dict[str, Any]], bookings: List[models.Booking]):
    for booking in bookings:
        b_start = _to_local_naive(getattr(booking, "start_time", None))
        b_end = _to_local_naive(getattr(booking, "end_time", None))
        for slot in slots:
            slot_start = _to_local_naive(slot["start_time"])
            slot_end = _to_local_naive(slot["end_time"])
            # overlap-test
            if not (b_end <= slot_start or b_start >= slot_end):
                slot.setdefault("booking_ids", []).append(str(getattr(booking, "id", "")))
                slot["status"] = "booked"
                slot["color"] = CALENDAR_COLORS.get("booked", slot.get("color"))
                
def _require_admin(user):
    if not getattr(user, "is_superuser", False):
        raise HTTPException(status_code=403, detail="Administrator-tilgang kreves")

async def _apply_blocked_times_to_slots(slots, target_date, db):
    """Apply blocked times to calendar slots"""
    blocked_times = await crud.get_blocked_times(db, target_date, target_date)
    
    for slot in slots:
        slot_time = datetime(target_date.year, target_date.month, target_date.day, slot["hour"], 0, 0)
        slot_end_time = slot_time + timedelta(hours=1)
        
        for blocked in blocked_times:
            if blocked.block_type == "day":
                # Block entire day
                if (target_date >= blocked.start_date.date() and 
                    target_date <= blocked.end_date.date()):
                    slot["status"] = "blocked"
                    slot["color"] = "#ff4444"
                    slot["reason"] = blocked.reason or "Dag blokkert"
                    break
                    
            elif blocked.block_type == "weekly":
                # Block specific day of week
                if (blocked.day_of_week is not None and
                    target_date.weekday() == blocked.day_of_week and
                    target_date >= blocked.start_date.date() and
                    target_date <= blocked.end_date.date()):
                    slot["status"] = "blocked"
                    slot["color"] = "#ff4444"
                    slot["reason"] = blocked.reason or "Ukedag blokkert"
                    break
                    
            elif blocked.block_type == "hour":
                # Block specific hour
                if (blocked.hour is not None and
                    slot["hour"] == blocked.hour and
                    target_date >= blocked.start_date.date() and
                    target_date <= blocked.end_date.date()):
                    slot["status"] = "blocked"
                    slot["color"] = "#ff4444"
                    slot["reason"] = blocked.reason or "Time blokkert"
                    break

@app.get("/bookings/{target_date}")
async def get_bookings_calendar(target_date: str, db: AsyncSession = Depends(database.get_db)):
    """
    Return a calendar view (hourly slots) for given date (YYYY-MM-DD).
    """
    try:
        d = datetime.strptime(target_date, "%Y-%m-%d").date()
    except Exception:
        raise HTTPException(status_code=400, detail="target_date must be YYYY-MM-DD")
    slots = _hour_range_for_date(d)
    day_start = datetime(d.year, d.month, d.day, 0, 0, 0)
    day_end = day_start + timedelta(days=1)
    day_bookings = await crud.get_bookings_in_range(db, day_start, day_end)
    _apply_bookings_to_slots(slots, day_bookings)
    
    # Apply blocked times to slots
    await _apply_blocked_times_to_slots(slots, d, db)
    
    return {
        "date": d.isoformat(),
        "slots": slots,
        "colors": CALENDAR_COLORS,
    }

@app.post("/bookings")
async def create_booking(booking: BookingCreate, user=Depends(current_active_user), db: AsyncSession = Depends(database.get_db)):
    # Normalize incoming datetimes to local naive before storing (prevents shift)
    start_local = _to_local_naive(booking.start_time)
    end_local = _to_local_naive(booking.end_time)

    # Check if time is blocked
    is_blocked, blocked_info = await crud.is_time_blocked(db, start_local, end_local)
    if is_blocked:
        reason = blocked_info.reason or "Tiden er blokkert"
        raise HTTPException(status_code=400, detail=f"Kan ikke booke: {reason}")

    # Prevent overlaps (single hall calendar)
    overlaps = await crud.get_bookings_in_range(db, start_local, end_local)
    if overlaps:
        raise HTTPException(status_code=400, detail="Tiden er allerede booket")

    # Enforce subscription weekly hours (admins are unlimited)
    if not getattr(user, "is_superuser", False):
        sub = await crud.get_active_user_subscription(db, str(getattr(user, "id", "")), at_time=start_local)
        if not sub:
            raise HTTPException(status_code=403, detail="Du har ikke et aktivt abonnement og kan ikke booke.")

        hours_limit = int(getattr(sub, "hours_per_week", 0) or 0)
        if hours_limit <= 0:
            raise HTTPException(status_code=403, detail="Abonnementet ditt har 0 timer per uke og kan ikke booke.")

        week_start = start_local - timedelta(days=start_local.weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        week_end = week_start + timedelta(days=7)

        week_bookings = await crud.get_user_bookings_in_range(db, str(getattr(user, "id", "")), week_start, week_end)
        used_seconds = crud.sum_booking_seconds(week_bookings)
        new_seconds = int((end_local - start_local).total_seconds())
        limit_seconds = hours_limit * 3600

        if used_seconds + new_seconds > limit_seconds:
            used_h = used_seconds / 3600
            remaining_h = max(0.0, (limit_seconds - used_seconds) / 3600)
            raise HTTPException(
                status_code=400,
                detail=f"Ukekvoten er brukt opp. Du har {hours_limit}t/uke, brukt {used_h:.2f}t. Gjenstående {remaining_h:.2f}t.",
            )

    # Persist booking
    booking_id = str(uuid.uuid4())
    db_booking = models.Booking(
        id=booking_id,
        hall=booking.hall,
        start_time=start_local,
        end_time=end_local,
        created_by=str(getattr(user, "id", "")),
    )
    db.add(db_booking)
    await db.commit()
    await db.refresh(db_booking)

    logger.info(f"Created booking {booking_id} by user {getattr(user, 'id', None)}")
    return {"id": booking_id, "msg": "Booking opprettet"}

@app.get("/api/admin/bookings/{booking_id}")
async def get_booking_admin(booking_id: str, user=Depends(current_active_user), db: AsyncSession = Depends(database.get_db)):
    """Get a specific booking by ID (admin only)"""
    _require_admin(user)
    result = await db.execute(select(models.Booking).where(models.Booking.id == booking_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking ikke funnet")
    return booking

@app.put("/bookings/{booking_id}")
async def update_booking(booking_id: str, payload: BookingCreate, user=Depends(current_active_user), db: AsyncSession = Depends(database.get_db)):
    _require_admin(user)
    result = await db.execute(select(models.Booking).where(models.Booking.id == booking_id))
    db_booking = result.scalar_one_or_none()
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking ikke funnet")
    
    # Normalize incoming datetimes to local naive before storing
    start_local = _to_local_naive(payload.start_time)
    end_local = _to_local_naive(payload.end_time)
    
    # Check if time is blocked
    is_blocked, blocked_info = await crud.is_time_blocked(db, start_local, end_local)
    if is_blocked:
        reason = blocked_info.reason or "Tiden er blokkert"
        raise HTTPException(status_code=400, detail=f"Kan ikke oppdatere booking: {reason}")
    
    overlaps = await crud.get_bookings_in_range(db, start_local, end_local)
    overlaps = [b for b in overlaps if str(getattr(b, "id", "")) != booking_id]
    if overlaps:
        raise HTTPException(status_code=400, detail="Tiden er allerede booket")

    db_booking.hall = payload.hall
    db_booking.start_time = start_local
    db_booking.end_time = end_local
    db.add(db_booking)
    await db.commit()
    await db.refresh(db_booking)
    logger.info(f"Booking {booking_id} oppdatert av admin {getattr(user, 'id', None)}")
    return {"id": booking_id, "msg": "Booking oppdatert"}

class BookingUpdate(BaseModel):
    hall: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

@app.patch("/bookings/{booking_id}")
async def partial_update_booking(booking_id: str, payload: BookingUpdate, user=Depends(current_active_user), db: AsyncSession = Depends(database.get_db)):
    """Partially update a booking (admin only)"""
    _require_admin(user)
    result = await db.execute(select(models.Booking).where(models.Booking.id == booking_id))
    db_booking = result.scalar_one_or_none()
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking ikke funnet")

    updates: Dict[str, Any] = {}
    
    if payload.hall is not None:
        updates["hall"] = payload.hall
    
    if payload.start_time is not None:
        start_local = _to_local_naive(payload.start_time)
        updates["start_time"] = start_local
    
    if payload.end_time is not None:
        end_local = _to_local_naive(payload.end_time)
        updates["end_time"] = end_local
    
    # If we're updating times, check if the new time is blocked
    if payload.start_time is not None or payload.end_time is not None:
        start_time = updates.get("start_time", db_booking.start_time)
        end_time = updates.get("end_time", db_booking.end_time)
        
        is_blocked, blocked_info = await crud.is_time_blocked(db, start_time, end_time)
        if is_blocked:
            reason = blocked_info.reason or "Tiden er blokkert"
            raise HTTPException(status_code=400, detail=f"Kan ikke oppdatere booking: {reason}")

        overlaps = await crud.get_bookings_in_range(db, start_time, end_time)
        overlaps = [b for b in overlaps if str(getattr(b, "id", "")) != booking_id]
        if overlaps:
            raise HTTPException(status_code=400, detail="Tiden er allerede booket")
    
    if "hall" in updates:
        db_booking.hall = updates["hall"]
    if "start_time" in updates:
        db_booking.start_time = updates["start_time"]
    if "end_time" in updates:
        db_booking.end_time = updates["end_time"]

    db.add(db_booking)
    await db.commit()
    await db.refresh(db_booking)
    logger.info(f"Booking {booking_id} delvis oppdatert av admin {getattr(user, 'id', None)}")
    return {"id": booking_id, "msg": "Booking oppdatert"}

@app.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: str, user=Depends(current_active_user), db: AsyncSession = Depends(database.get_db)):
    _require_admin(user)
    deleted = await crud.delete_booking(db, booking_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Booking ikke funnet")
    logger.info(f"Booking {booking_id} slettet av admin {getattr(user, 'id', None)}")
    return {"id": booking_id, "msg": "Booking slettet"}


@app.get("/users/me/bookings")
async def get_my_bookings(user=Depends(current_active_user), db: AsyncSession = Depends(database.get_db)):
    """
    Return bookings created by the authenticated user.
    """
    user_id = str(getattr(user, "id", ""))
    result = await db.execute(
        select(models.Booking)
        .where(models.Booking.created_by == user_id)
        .order_by(models.Booking.start_time.desc())
    )
    bookings = result.scalars().all()
    return {
        "bookings": [
            {
                "id": str(b.id),
                "hall": b.hall,
                "start_time": b.start_time.isoformat(),
                "end_time": b.end_time.isoformat(),
            }
            for b in bookings
        ]
    }

@app.get("/api/admin/bookings")
async def get_all_bookings(user=Depends(current_active_user), db: AsyncSession = Depends(database.get_db)):
    """
    Return all bookings for admin users with user information.
    """
    _require_admin(user)
    
    result = await db.execute(select(models.Booking).order_by(models.Booking.start_time.desc()))
    all_db_bookings = result.scalars().all()

    all_bookings: List[Dict[str, Any]] = []
    for b in all_db_bookings:
        user_info = None
        if getattr(b, "created_by", None):
            try:
                u = await crud.get_user_by_id(db, b.created_by)
                if u:
                    user_info = {
                        "id": str(getattr(u, "id", "")),
                        "email": getattr(u, "email", ""),
                        "name": getattr(u, "full_name", "") or getattr(u, "name", "") or "",
                        "phone": getattr(u, "phone", "") or "",
                    }
            except Exception:
                user_info = {"id": b.created_by, "email": "Ukjent bruker", "name": "Ukjent bruker"}

        all_bookings.append(
            {
                "id": str(b.id),
                "hall": b.hall,
                "start_time": b.start_time.isoformat(),
                "end_time": b.end_time.isoformat(),
                "created_by": b.created_by,
                "user": user_info,
                "created_at": (b.created_at.isoformat() if getattr(b, "created_at", None) else b.start_time.isoformat()),
            }
        )

    return {"bookings": all_bookings}

@app.get("/api/admin/users")
async def get_all_users(user=Depends(current_active_user), db: AsyncSession = Depends(database.get_db)):
    """
    Return all users for admin users.
    """
    _require_admin(user)
    
    users = await crud.get_all_users(db)
    out: List[Dict[str, Any]] = []
    for u in users:
        uid = str(getattr(u, "id", ""))
        sub = await crud.get_current_user_subscription_record(db, uid)
        plan = await crud.get_subscription_plan(db, sub.plan_code) if sub else None
        out.append(
            {
                "id": uid,
                "email": getattr(u, "email", ""),
                "full_name": getattr(u, "full_name", None),
                "phone": getattr(u, "phone", None),
                "is_active": bool(getattr(u, "is_active", False)),
                "is_superuser": bool(getattr(u, "is_superuser", False)),
                "is_verified": bool(getattr(u, "is_verified", False)),
                "subscription": (
                    {
                        "id": str(getattr(sub, "id", "")),
                        "plan_code": sub.plan_code,
                        "plan_name": getattr(plan, "name", None) if plan else None,
                        "hours_per_week": int(getattr(sub, "hours_per_week", 0) or 0),
                        "start_date": sub.start_date.isoformat(),
                        "end_date": sub.end_date.isoformat(),
                        "is_active": bool(getattr(sub, "is_active", True)),
                    }
                    if sub
                    else None
                ),
            }
        )
    return {"users": out}


@app.get("/api/admin/subscription-plans")
async def admin_list_subscription_plans(user=Depends(current_active_user), db: AsyncSession = Depends(database.get_db)):
    _require_admin(user)
    plans = await crud.get_subscription_plans(db, active_only=False)
    return {
        "plans": [
            {
                "code": p.code,
                "name": p.name,
                "duration_months": p.duration_months,
                "default_hours_per_week": p.default_hours_per_week,
                "is_active": p.is_active,
            }
            for p in plans
        ]
    }


@app.get("/api/admin/users/{user_id}/subscription")
async def admin_get_user_subscription(user_id: str, user=Depends(current_active_user), db: AsyncSession = Depends(database.get_db)):
    _require_admin(user)
    sub = await crud.get_current_user_subscription_record(db, user_id)
    if not sub:
        return {"subscription": None}
    plan = await crud.get_subscription_plan(db, sub.plan_code)
    return {
        "subscription": {
            "id": str(sub.id),
            "user_id": sub.user_id,
            "plan_code": sub.plan_code,
            "plan_name": getattr(plan, "name", None) if plan else None,
            "start_date": sub.start_date.isoformat(),
            "end_date": sub.end_date.isoformat(),
            "hours_per_week": int(sub.hours_per_week),
            "is_active": bool(sub.is_active),
        }
    }


@app.put("/api/admin/users/{user_id}/subscription")
async def admin_upsert_user_subscription(
    user_id: str,
    payload: schemas.AdminUpsertUserSubscription,
    user=Depends(current_active_user),
    db: AsyncSession = Depends(database.get_db),
):
    _require_admin(user)
    try:
        sub = await crud.upsert_user_subscription(
            db,
            user_id=user_id,
            plan_code=payload.plan_code,
            hours_per_week=payload.hours_per_week,
            start_date=payload.start_date,
            end_date=payload.end_date,
            extend_days=payload.extend_days,
            extend_months=payload.extend_months,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    plan = await crud.get_subscription_plan(db, sub.plan_code)
    return {
        "subscription": {
            "id": str(sub.id),
            "user_id": sub.user_id,
            "plan_code": sub.plan_code,
            "plan_name": getattr(plan, "name", None) if plan else None,
            "start_date": sub.start_date.isoformat(),
            "end_date": sub.end_date.isoformat(),
            "hours_per_week": int(sub.hours_per_week),
            "is_active": bool(sub.is_active),
        }
    }


@app.get("/users/me/subscription")
async def get_my_subscription(user=Depends(current_active_user), db: AsyncSession = Depends(database.get_db)):
    """
    Return current user's active subscription (for UI/info).
    """
    if getattr(user, "is_superuser", False):
        return {"subscription": {"role": "admin", "unlimited": True}}

    sub = await crud.get_active_user_subscription(db, str(getattr(user, "id", "")), at_time=datetime.now())
    if not sub:
        return {"subscription": None}
    plan = await crud.get_subscription_plan(db, sub.plan_code)
    return {
        "subscription": {
            "id": str(sub.id),
            "plan_code": sub.plan_code,
            "plan_name": getattr(plan, "name", None) if plan else None,
            "start_date": sub.start_date.isoformat(),
            "end_date": sub.end_date.isoformat(),
            "hours_per_week": int(sub.hours_per_week),
        }
    }

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def generate_password(length=12):
    """Generate a secure random password"""
    alphabet = string.ascii_letters + string.digits + "!@#$%&*"
    password = ''.join(secrets.choice(alphabet) for i in range(length))
    return password

async def send_user_credentials_email(user_email: str, user_name: str, password: str, is_admin: bool):
    """
    Send email to new user with their login credentials.
    This function will not fail the request if email sending fails.
    """
    try:
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER", "")
        smtp_password = os.getenv("SMTP_PASSWORD", "")
        
        if not smtp_user or not smtp_password:
            logger.warning("⚠️ SMTP credentials not configured. Email not sent. Set SMTP_USER and SMTP_PASSWORD environment variables.")
            return
        
        # Create email message
        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = user_email
        msg['Subject'] = "Velkommen til TG Tromsø - Dine innloggingsdetaljer"
        
        role_text = "administrator" if is_admin else "standard bruker"
        
        # Create email body
        body = f"""
Hei {user_name or 'der'}!

Din brukerkonto hos TG Tromsø har blitt opprettet.

Innloggingsdetaljer:
E-post: {user_email}
Passord: {password}
Rolle: {role_text}

Viktig:
- Dette passordet er midlertidig. Vi anbefaler at du endrer det ved første innlogging.
- Du kan endre passordet i kontoinnstillingene etter at du har logget inn.

For å logge inn, gå til innloggingssiden og bruk e-postadressen og passordet over.

Hvis du har spørsmål, ta kontakt med oss.

Med vennlig hilsen,
TG Tromsø

---
Dette er en automatisk e-post fra TG Tromsø.
Ikke svar på denne e-posten.
"""
        
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        # Send email using SMTP
        try:
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(smtp_user, smtp_password)
            text = msg.as_string()
            server.sendmail(smtp_user, user_email, text)
            server.quit()
            logger.info(f"✅ Welcome email sent successfully to {user_email}")
        except Exception as e:
            logger.error(f"❌ Error sending welcome email to {user_email}: {e}")
            # Don't fail the request if email fails, just log it
            
    except Exception as e:
        logger.error(f"❌ Error processing welcome email for {user_email}: {e}")
        # Don't fail the request if email fails

class CreateUserRequest(BaseModel):
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_superuser: bool = False

@app.post("/api/admin/users")
async def create_user_admin(
    user_data: CreateUserRequest, 
    background_tasks: BackgroundTasks,
    user=Depends(current_active_user), 
    db: AsyncSession = Depends(database.get_db)
):
    """
    Create a new user (admin only).
    Generates a random password automatically.
    """
    _require_admin(user)
    
    # Check if user already exists
    from sqlalchemy import select
    
    result = await db.execute(select(models.User).filter(models.User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Bruker med denne e-postadressen eksisterer allerede")
    
    # Generate password
    generated_password = generate_password()
    hashed_password = pwd_context.hash(generated_password)
    
    # Create new user
    new_user = models.User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        phone=user_data.phone,
        is_active=True,
        is_superuser=user_data.is_superuser,
        is_verified=True  # Auto-verify admin-created users
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Send welcome email with credentials to the new user in the background
    # This won't block the request and won't fail it if email sending fails
    background_tasks.add_task(
        send_user_credentials_email,
        user_email=new_user.email,
        user_name=new_user.full_name or "Bruker",
        password=generated_password,
        is_admin=user_data.is_superuser
    )
    
    return {
        "user": {
            "id": str(new_user.id),
            "email": new_user.email,
            "full_name": new_user.full_name,
            "phone": new_user.phone
        },
        "password": generated_password,  # Return password so admin can share it
        "message": "Bruker opprettet vellykket"
    }

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@app.post("/users/me/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    user=Depends(current_active_user),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Change password for the current user.
    """
    # Validate new password length
    if len(password_data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Nytt passord må være minst 8 tegn")
    
    # Get user from database
    from sqlalchemy import select
    
    result = await db.execute(select(models.User).filter(models.User.id == user.id))
    db_user = result.scalar_one_or_none()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="Bruker ikke funnet")
    
    # Verify current password
    if not pwd_context.verify(password_data.current_password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Nåværende passord er feil")
    
    # Hash and update password
    db_user.hashed_password = pwd_context.hash(password_data.new_password)
    db.add(db_user)
    await db.commit()
    
    return {"message": "Passord endret vellykket"}

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
async def update_my_profile(payload: UserProfileUpdate, db: AsyncSession = Depends(database.get_db), user=Depends(current_active_user)):
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

# Page Content API endpoints
@app.get("/api/page-content/{page_name}")
async def get_page_content_api(page_name: str, section_name: str = None, db: AsyncSession = Depends(database.get_db)):
    """Get content for a specific page"""
    content = await crud.get_page_content(db, page_name, section_name)
    if section_name and content:
        return content
    elif not section_name and content:
        return {"content": content}
    else:
        return {"content": []}

@app.get("/api/page-content")
async def get_all_page_content_api(db: AsyncSession = Depends(database.get_db)):
    """Get all page content (admin only)"""
    content = await crud.get_all_page_content(db)
    return {"content": content}

@app.post("/api/page-content")
async def create_page_content_api(content: schemas.PageContentCreate, user=Depends(current_active_user), db: AsyncSession = Depends(database.get_db)):
    """Create new page content (admin only)"""
    _require_admin(user)
    user_id = str(getattr(user, "id", ""))
    new_content = await crud.create_page_content(db, content, user_id)
    return new_content

@app.put("/api/page-content/{content_id}")
async def update_page_content_api(content_id: str, content: schemas.PageContentUpdate, user=Depends(current_active_user), db: AsyncSession = Depends(database.get_db)):
    """Update page content (admin only)"""
    _require_admin(user)
    user_id = str(getattr(user, "id", ""))
    updated_content = await crud.update_page_content(db, content_id, content, user_id)
    if not updated_content:
        raise HTTPException(status_code=404, detail="Content not found")
    return updated_content

@app.delete("/api/page-content/{content_id}")
async def delete_page_content_api(content_id: str, user=Depends(current_active_user), db: AsyncSession = Depends(database.get_db)):
    """Delete page content (admin only)"""
    _require_admin(user)
    deleted_content = await crud.delete_page_content(db, content_id)
    if not deleted_content:
        raise HTTPException(status_code=404, detail="Content not found")
    return {"message": "Content deleted successfully"}

# Blocked Time API endpoints
@app.get("/api/blocked-times")
async def get_blocked_times_api(start_date: str = None, end_date: str = None, db: AsyncSession = Depends(database.get_db)):
    """Get blocked times (admin only)"""
    start_dt = datetime.strptime(start_date, "%Y-%m-%d") if start_date else None
    end_dt = datetime.strptime(end_date, "%Y-%m-%d") if end_date else None
    
    blocked_times = await crud.get_blocked_times(db, start_dt, end_dt)
    return {"blocked_times": blocked_times}

@app.post("/api/blocked-times")
async def create_blocked_time_api(blocked_time: schemas.BlockedTimeCreate, user=Depends(current_active_user), db: AsyncSession = Depends(database.get_db)):
    """Create blocked time (admin only)"""
    _require_admin(user)
    user_id = str(getattr(user, "id", ""))
    new_blocked_time = await crud.create_blocked_time(db, blocked_time, user_id)
    return new_blocked_time

@app.put("/api/blocked-times/{blocked_time_id}")
async def update_blocked_time_api(blocked_time_id: str, blocked_time: schemas.BlockedTimeUpdate, user=Depends(current_active_user), db: AsyncSession = Depends(database.get_db)):
    """Update blocked time (admin only)"""
    _require_admin(user)
    user_id = str(getattr(user, "id", ""))
    updated_blocked_time = await crud.update_blocked_time(db, blocked_time_id, blocked_time, user_id)
    if not updated_blocked_time:
        raise HTTPException(status_code=404, detail="Blocked time not found")
    return updated_blocked_time

@app.delete("/api/blocked-times/{blocked_time_id}")
async def delete_blocked_time_api(blocked_time_id: str, user=Depends(current_active_user), db: AsyncSession = Depends(database.get_db)):
    """Delete blocked time (admin only)"""
    _require_admin(user)
    deleted_blocked_time = await crud.delete_blocked_time(db, blocked_time_id)
    if not deleted_blocked_time:
        raise HTTPException(status_code=404, detail="Blocked time not found")
    return {"message": "Blocked time deleted successfully"}

# Contact form API endpoint
class ContactForm(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    subject: str
    message: str

async def send_contact_form_email(
    contact_name: str,
    contact_email: str,
    contact_phone: Optional[str],
    contact_subject: str,
    contact_message: str
):
    """
    Send contact form email to configured recipient.
    This function runs in the background and will not block the request.
    """
    try:
        recipient_email = os.getenv("CONTACT_RECIPIENT_EMAIL", "tgnrk@gmail.com")
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER", "")
        smtp_password = os.getenv("SMTP_PASSWORD", "")
        
        if not smtp_user or not smtp_password:
            logger.warning("⚠️ SMTP credentials not configured. Email not sent. Set SMTP_USER and SMTP_PASSWORD environment variables.")
            return
        
        # Create email message
        msg = MIMEMultipart()
        # Use SMTP user as From (required by most SMTP servers)
        msg['From'] = smtp_user
        msg['To'] = recipient_email
        # Add Reply-To header so replies go to the contact form submitter
        msg['Reply-To'] = contact_email
        msg['Subject'] = f"Kontaktskjema: {contact_subject}"
        
        # Create email body
        body = f"""
Ny henvendelse fra kontaktskjemaet:

Navn: {contact_name}
E-post: {contact_email}
Telefon: {contact_phone or 'Ikke oppgitt'}
Emne: {contact_subject}

Melding:
{contact_message}

---
Dette er en automatisk melding fra TG Tromsø kontaktskjema.
Svar til: {contact_email}
"""
        
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        # Send email using SMTP with timeout
        try:
            # Set timeout to prevent hanging (10 seconds)
            server = smtplib.SMTP(smtp_server, smtp_port, timeout=10)
            server.starttls()
            server.login(smtp_user, smtp_password)
            text = msg.as_string()
            server.sendmail(smtp_user, recipient_email, text)
            server.quit()
            logger.info(f"✅ Contact form email sent successfully to {recipient_email} from {contact_email}")
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"❌ SMTP authentication failed. Check SMTP_USER and SMTP_PASSWORD. Error: {str(e)}")
        except smtplib.SMTPException as e:
            logger.error(f"❌ SMTP error: {str(e)}")
        except Exception as e:
            logger.error(f"❌ Error sending contact form email: {str(e)}")
        
    except Exception as e:
        logger.error(f"❌ Error processing contact form email: {str(e)}")

@app.post("/api/contact")
async def submit_contact_form(
    contact: ContactForm,
    background_tasks: BackgroundTasks
):
    """
    Handle contact form submissions (kurs, seminar, trening, atferdsproblemer, etc.)
    Sends email to configured recipient in the background.
    """
    logger.info(f"📧 Contact form submission received:")
    logger.info(f"   Name: {contact.name}")
    logger.info(f"   Email: {contact.email}")
    logger.info(f"   Phone: {contact.phone or 'N/A'}")
    logger.info(f"   Subject: {contact.subject}")
    logger.info(f"   Message: {contact.message}")
    
    # Send email in the background - this won't block the response
    background_tasks.add_task(
        send_contact_form_email,
        contact_name=contact.name,
        contact_email=contact.email,
        contact_phone=contact.phone,
        contact_subject=contact.subject,
        contact_message=contact.message
    )
    
    # Return immediately - email will be sent in background
    return {
        "message": "Takk for din henvendelse! Vi kommer tilbake til deg snart.",
        "success": True
    }

# News Items API endpoints
@app.get("/api/news")
async def get_news_items_api(
    item_type: Optional[str] = None,
    published: Optional[bool] = None,
    featured: Optional[bool] = None,
    limit: Optional[int] = None,
    db: AsyncSession = Depends(database.get_db)
):
    """Get news items (kurs, seminarer, nyheter) with optional filters"""
    items = await crud.get_news_items(db, item_type=item_type, published=published, featured=featured, limit=limit)
    return {"items": items}

@app.get("/api/news/{item_id}")
async def get_news_item_api(item_id: str, db: AsyncSession = Depends(database.get_db)):
    """Get a single news item by ID"""
    item = await crud.get_news_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="News item not found")
    return item

@app.post("/api/news")
async def create_news_item_api(news_item: NewsItemCreate, user=Depends(current_active_user), db: AsyncSession = Depends(database.get_db)):
    """Create new news item (admin only)"""
    _require_admin(user)
    user_id = str(getattr(user, "id", ""))
    new_item = await crud.create_news_item(db, news_item, user_id)
    return new_item

@app.put("/api/news/{item_id}")
async def update_news_item_api(item_id: str, news_item: NewsItemUpdate, user=Depends(current_active_user), db: AsyncSession = Depends(database.get_db)):
    """Update news item (admin only)"""
    _require_admin(user)
    user_id = str(getattr(user, "id", ""))
    updated_item = await crud.update_news_item(db, item_id, news_item, user_id)
    if not updated_item:
        raise HTTPException(status_code=404, detail="News item not found")
    return updated_item

@app.delete("/api/news/{item_id}")
async def delete_news_item_api(item_id: str, user=Depends(current_active_user), db: AsyncSession = Depends(database.get_db)):
    """Delete news item (admin only)"""
    _require_admin(user)
    deleted_item = await crud.delete_news_item(db, item_id)
    if not deleted_item:
        raise HTTPException(status_code=404, detail="News item not found")
    return {"message": "News item deleted successfully"}

@app.post("/api/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    user=Depends(current_active_user)
):
    """Upload an image file (admin only)"""
    _require_admin(user)
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}")
    
    # Generate unique filename
    file_ext = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return URL path (relative to static files)
        image_url = f"/uploads/images/{unique_filename}"
        logger.info(f"✅ Image uploaded: {image_url}")
        return {"url": image_url, "filename": unique_filename}
    except Exception as e:
        logger.error(f"❌ Error uploading image: {e}")
        raise HTTPException(status_code=500, detail=f"Error uploading image: {str(e)}")