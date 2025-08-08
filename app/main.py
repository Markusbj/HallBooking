from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas, crud, database
from fastapi import FastAPI
from .database import Base, engine
from .models import User
from .schemas import UserRead, UserCreate, UserUpdate
from .auth import fastapi_users, auth_backend, current_active_user, create_db_and_tables

app = FastAPI(title="HallBooking API")

# Opprett tabeller ved oppstart (async)
@app.on_event("startup")
async def on_startup():
    await create_db_and_tables()

# Auth-rutere (registrer/logg inn/logg ut/bruker-CRUD)
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
    return {"msg": "Auth er oppe. Gå til /docs for å teste."}


# models.Base.metadata.create_all(bind=database.engine)

# app = FastAPI()

# # Dependency
# def get_db():
#     db = database.SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# @app.get("/")
# def read_root():
#     return {"msg": "Velkommen til HallBooking API!"}

# @app.post("/bookings/", response_model=schemas.BookingOut)
# def create_booking(booking: schemas.BookingCreate, db: Session = Depends(get_db)):
#     # Her bør du legge inn autentisering, for nå er det bare demo!
#     user_id = 1  # Dummy-user for testing
#     return crud.create_booking(db, booking, user_id)

# @app.get("/bookings/", response_model=list[schemas.BookingOut])
# def list_bookings(db: Session = Depends(get_db)):
#     return crud.get_bookings(db)