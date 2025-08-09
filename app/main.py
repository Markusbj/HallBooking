from contextlib import asynccontextmanager
from fastapi import FastAPI
from .auth import fastapi_users, auth_backend, create_db_and_tables
from .schemas import UserRead, UserCreate, UserUpdate

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await create_db_and_tables()
    yield
    # Shutdown (valgfritt): lukk ressurser her
    # await some_engine.dispose()
    # await some_client.aclose()

app = FastAPI(title="HallBooking API", lifespan=lifespan)

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
    return {"msg": "Auth er oppe. Gå til /docs for å teste."}