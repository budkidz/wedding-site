import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/wedding"
)
GUEST_CAPACITY = int(os.getenv("GUEST_CAPACITY", "150"))

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_normalized_phone_unique_index():
    from .models import RSVP

    phone_index = next(
        index
        for index in RSVP.__table__.indexes
        if index.name == "uq_rsvps_phone_normalized"
    )
    phone_index.create(bind=engine, checkfirst=True)
