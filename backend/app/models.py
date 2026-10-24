import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID

from .database import Base
from .phone import normalized_phone_expression


def make_ticket_code():
    # Short, scannable, still unique enough for a single-event guest list.
    return f"DG-{uuid.uuid4().hex[:8].upper()}"


class RSVP(Base):
    __tablename__ = "rsvps"

    phone = Column(String, nullable=False)

    __table_args__ = (
        Index(
            "uq_rsvps_phone_normalized",
            normalized_phone_expression(phone),
            unique=True,
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    attending = Column(Boolean, nullable=False)
    guest_count = Column(Integer, nullable=False, default=1)

    # Only meaningful when attending=True; used as the QR payload.
    ticket_code = Column(String, unique=True, index=True, default=make_ticket_code)

    checked_in = Column(Boolean, nullable=False, default=False)
    checked_in_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
