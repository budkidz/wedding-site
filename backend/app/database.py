import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

def _normalize_database_url(url: str) -> str:
    """Force the psycopg2 driver we install.

    Hosts like Supabase hand out plain "postgresql://" (or "postgres://") URLs.
    Newer SQLAlchemy versions pick the psycopg v3 driver for those, which is not
    installed here and crashes the app on startup.
    """
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg2://" + url[len("postgresql://"):]
    return url


DATABASE_URL = _normalize_database_url(
    os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/wedding")
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


def ensure_approval_column():
    if "approved" in {column["name"] for column in inspect(engine).get_columns("rsvps")}:
        return

    # Existing RSVP tickets were already released, so preserve that state.
    with engine.begin() as connection:
        connection.execute(
            text("ALTER TABLE rsvps ADD COLUMN approved BOOLEAN NOT NULL DEFAULT TRUE")
        )
