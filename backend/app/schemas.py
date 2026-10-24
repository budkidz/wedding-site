from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class RSVPCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=3, max_length=40)
    attending: bool


class RSVPOut(BaseModel):
    id: UUID
    name: str
    attending: bool
    guest_count: int
    ticket_code: str | None
    checked_in: bool
    created_at: datetime

    class Config:
        from_attributes = True


class EventSummary(BaseModel):
    capacity: int
    confirmed_guests: int
    declined_count: int
    checked_in_count: int


class CheckInRequest(BaseModel):
    ticket_code: str


class CheckInResult(BaseModel):
    name: str
    guest_count: int
    already_checked_in: bool
    total_checked_in: int
