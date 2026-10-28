from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import GUEST_CAPACITY, get_db
from ..notifications import notify_pending_rsvp
from ..phone import normalize_phone_number, normalized_phone_expression

router = APIRouter(prefix="/rsvp", tags=["rsvp"])

PHONE_ALREADY_USED = (
    "This phone number has already been used for an RSVP. "
    "Please use the original RSVP or contact the hosts."
)


@router.post("", response_model=schemas.RSVPOut)
def create_rsvp(
    payload: schemas.RSVPCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    normalized_phone = normalize_phone_number(payload.phone)
    if not normalized_phone:
        raise HTTPException(status_code=422, detail="Enter a valid phone number.")

    existing_rsvp = (
        db.query(models.RSVP.id)
        .filter(normalized_phone_expression(models.RSVP.phone) == normalized_phone)
        .first()
    )
    if existing_rsvp:
        raise HTTPException(status_code=409, detail=PHONE_ALREADY_USED)

    if payload.attending:
        confirmed = (
            db.query(func.coalesce(func.sum(models.RSVP.guest_count), 0))
            .filter(models.RSVP.attending.is_(True))
            .scalar()
        )
        if confirmed + 1 > GUEST_CAPACITY:
            raise HTTPException(
                status_code=400,
                detail=f"Only {max(0, GUEST_CAPACITY - confirmed)} spots left.",
            )

    rsvp = models.RSVP(
        name=payload.name.strip(),
        phone=payload.phone,
        attending=payload.attending,
        guest_count=1 if payload.attending else 0,
        approved=not payload.attending,
        ticket_code=None,
    )
    db.add(rsvp)

    try:
        db.flush()
    except IntegrityError as exc:
        db.rollback()
        constraint_name = getattr(
            getattr(exc.orig, "diag", None), "constraint_name", None
        )
        if constraint_name == "uq_rsvps_phone_normalized":
            raise HTTPException(status_code=409, detail=PHONE_ALREADY_USED) from exc
        raise

    db.commit()
    db.refresh(rsvp)
    if payload.attending:
        background_tasks.add_task(notify_pending_rsvp, rsvp.name)
    return rsvp


@router.get("/summary", response_model=schemas.EventSummary)
def get_summary(db: Session = Depends(get_db)):
    confirmed = (
        db.query(func.coalesce(func.sum(models.RSVP.guest_count), 0))
        .filter(
            models.RSVP.attending.is_(True),
            models.RSVP.approved.is_(True),
        )
        .scalar()
    )
    declined = db.query(models.RSVP).filter(models.RSVP.attending.is_(False)).count()
    checked_in = db.query(models.RSVP).filter(models.RSVP.checked_in.is_(True)).count()

    return schemas.EventSummary(
        capacity=GUEST_CAPACITY,
        confirmed_guests=confirmed,
        declined_count=declined,
        checked_in_count=checked_in,
    )


@router.get("/{rsvp_id}", response_model=schemas.RSVPOut)
def get_rsvp(rsvp_id: UUID, db: Session = Depends(get_db)):
    rsvp = db.query(models.RSVP).filter(models.RSVP.id == rsvp_id).first()
    if not rsvp:
        raise HTTPException(status_code=404, detail="RSVP not found")
    return rsvp
