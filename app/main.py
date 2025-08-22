from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import time
from . import models, schemas, crud, database
from .database import Base, engine
from .models import User
from .schemas import UserRead, UserCreate, UserUpdate
from .auth import fastapi_users, auth_backend, current_active_user, create_db_and_tables

# Sett opp logging - VIKTIG: sett level til INFO
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
    logger.info("�� Shutting down HallBooking API...")

app = FastAPI(title="HallBooking API", lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Legg til begge
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Middleware for logging av ALLE requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Log request
    logger.info(f"�� {request.method} {request.url}")
    
    # Log headers (kun viktige)
    important_headers = {
        'content-type': request.headers.get('content-type'),
        'user-agent': request.headers.get('user-agent'),
        'origin': request.headers.get('origin'),
    }
    logger.info(f"📋 Headers: {important_headers}")
    
    # Log body for POST requests
    if request.method == "POST":
        try:
            body = await request.body()
            if body:
                body_str = body.decode()
                logger.info(f"📦 Body: {body_str}")
        except Exception as e:
            logger.warning(f"⚠️ Could not read body: {e}")
    
    # Process request
    response = await call_next(request)
    
    # Log response
    process_time = time.time() - start_time
    logger.info(f"📤 Response: {response.status_code} ({process_time:.3f}s)")
    
    return response

# Auth-rutere - VIKTIG: Endret prefix for å matche frontend
app.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/jwt",  # Endret fra /auth/jwt til /jwt
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="",  # Endret fra /auth til "" (ingen prefix)
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

@app.get("/test")
async def test_endpoint():
    logger.info("🧪 Test endpoint accessed")
    return {"msg": "Test endpoint fungerer!"}

@app.post("/test-post")
async def test_post(data: dict):
    logger.info(f"🧪 Test POST with data: {data}")
    return {"msg": "POST endpoint fungerer!", "received_data": data}

# Debug endpoint for å teste CORS
@app.get("/debug")
async def debug_info():
    logger.info("🔍 Debug endpoint accessed")
    return {
        "message": "Debug info",
        "endpoints": [
            "/",
            "/test",
            "/test-post",
            "/jwt/login",  # Endret fra /auth/jwt/login
            "/register",   # Endret fra /auth/register
            "/users/me"
        ]
    }