import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .database import (
    Base,
    engine,
    ensure_approval_column,
    ensure_normalized_phone_unique_index,
)
from .routers import admin, checkin, rsvp

# Dev-friendly: creates tables if they don't exist yet.
# For a real deployment, switch to Alembic migrations instead — see README.
Base.metadata.create_all(bind=engine)
ensure_approval_column()
ensure_normalized_phone_unique_index()

app = FastAPI(title="Dingani & Gloria Wedding API")

origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rsvp.router)
app.include_router(checkin.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    return {"status": "ok"}
