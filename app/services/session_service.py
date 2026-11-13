"""
app/services/session_service.py
────────────────────────────────
Business logic for irrigation-session lifecycle management.

Sessions are stored in Firebase under:
  /sessions/{session_id}
  /activeSession        ← points to the current session_id (or null)
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from app.firebase import get_db
from app.models.session import Session, SessionStatus
from app.services.zone_service import update_zone_status
from app.models.zone import ZoneStatus

logger = logging.getLogger(__name__)

SESSIONS_PATH = "sessions"
ACTIVE_SESSION_PATH = "activeSession"


def _now_utc() -> datetime:
    """Return the current UTC time (timezone-aware)."""
    return datetime.now(tz=timezone.utc)


def _session_id() -> str:
    """Generate a unique session ID."""
    stamp = _now_utc().strftime("%Y%m%d_%H%M%S")
    short_uuid = uuid.uuid4().hex[:6].upper()
    return f"sess_{stamp}_{short_uuid}"


def get_active_session() -> Optional[Session]:
    """
    Return the currently active session, or ``None`` if no session is running.

    Reads ``/activeSession`` to find the session ID, then fetches the full
    record from ``/sessions/{session_id}``.

    Returns:
        :class:`~app.models.session.Session` or ``None``.
    """
    db = get_db()
    active_id: str | None = db.child(ACTIVE_SESSION_PATH).get()

    if not active_id:
        return None

    data: dict | None = db.child(SESSIONS_PATH).child(active_id).get()
    if not data:
        logger.warning(
            "activeSession points to '%s' but no record found — clearing pointer.",
            active_id,
        )
        db.child(ACTIVE_SESSION_PATH).delete()
        return None

    return Session(**data)


def create_session(zone_id: str, device_id: str = "ESP32_001", notes: Optional[str] = None) -> Session:
    """
    Create and persist a new irrigation session for *zone_id*.

    Also:
    * Sets ``/activeSession`` to the new session ID.
    * Updates the zone status to ``IRRIGATING``.

    Args:
        zone_id: Zone to irrigate.
        device_id: Device that will collect readings (default: ``"ESP32_001"``).
        notes: Optional pre-session notes.

    Returns:
        The newly created :class:`~app.models.session.Session`.

    Raises:
        ValueError: If a session is already active.
    """
    existing = get_active_session()
    if existing:
        raise ValueError(
            f"Cannot start a new session: session '{existing.session_id}' is already active "
            f"on zone '{existing.zone_id}'."
        )

    session = Session(
        session_id=_session_id(),
        zone_id=zone_id,
        device_id=device_id,
        status=SessionStatus.ACTIVE,
        started_at=_now_utc(),
        notes=notes,
    )

    db = get_db()
    # Persist session record
    db.child(SESSIONS_PATH).child(session.session_id).set(
        session.model_dump(mode="json")
    )
    # Update active-session pointer
    db.child(ACTIVE_SESSION_PATH).set(session.session_id)

    # Update zone status
    update_zone_status(zone_id, ZoneStatus.IRRIGATING)

    logger.info("Session '%s' started on zone '%s'.", session.session_id, zone_id)
    return session


def stop_session(session_id: str, notes: Optional[str] = None) -> Session:
    """
    Mark a session as completed and clear the active-session pointer.

    Also resets the zone status back to ``ACTIVE``.

    Args:
        session_id: ID of the session to stop.
        notes: Optional post-session notes.

    Returns:
        The updated :class:`~app.models.session.Session`.

    Raises:
        ValueError: If the session does not exist or is already closed.
    """
    db = get_db()
    data: dict | None = db.child(SESSIONS_PATH).child(session_id).get()

    if not data:
        raise ValueError(f"Session '{session_id}' not found.")

    session = Session(**data)

    if session.status != SessionStatus.ACTIVE:
        raise ValueError(
            f"Session '{session_id}' is already in state '{session.status.value}'."
        )

    stopped_at = _now_utc()
    duration = int((stopped_at - session.started_at).total_seconds())

    updates: dict = {
        "status": SessionStatus.COMPLETED.value,
        "stopped_at": stopped_at.isoformat(),
        "duration_seconds": duration,
    }
    if notes:
        updates["notes"] = notes

    db.child(SESSIONS_PATH).child(session_id).update(updates)
    db.child(ACTIVE_SESSION_PATH).delete()

    # Restore zone to ACTIVE
    update_zone_status(session.zone_id, ZoneStatus.ACTIVE)

    session.status = SessionStatus.COMPLETED
    session.stopped_at = stopped_at
    session.duration_seconds = duration
    if notes:
        session.notes = notes

    logger.info(
        "Session '%s' stopped after %d s on zone '%s'.",
        session_id,
        duration,
        session.zone_id,
    )
    return session
