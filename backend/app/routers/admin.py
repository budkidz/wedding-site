import hmac
import os
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin_key(x_admin_key: str | None = Header(default=None)):
    expected_key = os.getenv("ADMIN_API_KEY", "")
    if not expected_key:
        raise HTTPException(
            status_code=503,
            detail="Admin access is not configured. Set ADMIN_API_KEY on the API server.",
        )
    if not x_admin_key or not hmac.compare_digest(
        x_admin_key.encode("utf-8"),
        expected_key.encode("utf-8"),
    ):
        raise HTTPException(status_code=401, detail="Invalid admin key.")


@router.get("/rsvps", response_model=list[schemas.AdminRSVPOut])
def list_rsvps(
    _: None = Depends(require_admin_key),
    db: Session = Depends(get_db),
):
    return db.query(models.RSVP).order_by(models.RSVP.created_at.desc()).all()


@router.put("/rsvps/{rsvp_id}/approve", response_model=schemas.AdminRSVPOut)
def approve_rsvp(
    rsvp_id: UUID,
    _: None = Depends(require_admin_key),
    db: Session = Depends(get_db),
):
    rsvp = (
        db.query(models.RSVP)
        .filter(models.RSVP.id == rsvp_id)
        .with_for_update()
        .first()
    )
    if not rsvp:
        raise HTTPException(status_code=404, detail="RSVP not found.")
    if not rsvp.attending:
        raise HTTPException(
            status_code=400,
            detail="Only attending RSVPs need invitation approval.",
        )

    if not rsvp.approved:
        rsvp.approved = True
        rsvp.ticket_code = models.make_ticket_code()
        db.commit()
        db.refresh(rsvp)

    return rsvp


@router.delete("/rsvps/{rsvp_id}")
def reject_rsvp(
    rsvp_id: UUID,
    _: None = Depends(require_admin_key),
    db: Session = Depends(get_db),
):
    rsvp = (
        db.query(models.RSVP)
        .filter(models.RSVP.id == rsvp_id)
        .with_for_update()
        .first()
    )
    if not rsvp:
        raise HTTPException(status_code=404, detail="RSVP not found.")
    if not rsvp.attending or rsvp.approved:
        raise HTTPException(
            status_code=400,
            detail="Only RSVPs awaiting approval can be rejected.",
        )

    db.delete(rsvp)
    db.commit()
    return {"status": "deleted"}