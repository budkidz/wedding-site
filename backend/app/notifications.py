import json
import logging
import os
import urllib.request

logger = logging.getLogger(__name__)


def notify_pending_rsvp(name: str) -> None:
    """Send a Telegram alert for an RSVP awaiting approval.

    Does nothing when Telegram is not configured, and never raises so a
    notification problem cannot affect the guest's RSVP.
    """
    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.getenv("TELEGRAM_CHAT_ID", "").strip()
    if not token or not chat_id:
        return

    request = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data=json.dumps(
            {"chat_id": chat_id, "text": f"New RSVP awaiting approval: {name}"}
        ).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=10):
            pass
    except Exception as exc:
        # Log the type only; the exception text can contain the bot token URL.
        logger.warning("Telegram notification failed: %s", type(exc).__name__)
