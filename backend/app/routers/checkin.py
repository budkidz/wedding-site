from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(tags=["check-in"])


@router.post("/check-in", response_model=schemas.CheckInResult)
def check_in_guest(payload: schemas.CheckInRequest, db: Session = Depends(get_db)):
    rsvp = (
        db.query(models.RSVP)
        .filter(models.RSVP.ticket_code == payload.ticket_code)
        .first()
    )
    if not rsvp:
        raise HTTPException(status_code=404, detail="Ticket not recognized")
    if not rsvp.attending:
        raise HTTPException(status_code=400, detail="This guest declined the invitation")

    already = rsvp.checked_in
    if not already:
        rsvp.checked_in = True
        rsvp.checked_in_at = datetime.utcnow()
        db.commit()
        db.refresh(rsvp)

    total_checked_in = (
        db.query(models.RSVP).filter(models.RSVP.checked_in.is_(True)).count()
    )

    return schemas.CheckInResult(
        name=rsvp.name,
        guest_count=rsvp.guest_count,
        already_checked_in=already,
        total_checked_in=total_checked_in,
    )
