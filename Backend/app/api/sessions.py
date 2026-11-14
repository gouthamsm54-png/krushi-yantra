"""
app/api/sessions.py
────────────────────
Irrigation session management endpoints.

Routes
------
POST /api/sessions/start               — start a new session
POST /api/sessions/{session_id}/stop   — stop an active session
GET  /api/sessions/active              — get the currently active session (if any)
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status

from app.models.session import Session, StartSessionRequest, StopSessionRequest
from app.security.auth import get_current_user
from app.services.session_service import (
    create_session,
    get_active_session,
    stop_session,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])


@router.get(
    "/active",
    response_model=Optional[Session],
    summary="Get active session",
    description="Returns the currently active session, or null if no session is running.",
)
async def active_session(_user: dict = Depends(get_current_user)) -> Optional[Session]:
    """Return the active session or ``null``."""
    return get_active_session()


@router.post(
    "/start",
    response_model=Session,
    status_code=status.HTTP_201_CREATED,
    summary="Start a session",
    description=(
        "Create a new irrigation/monitoring session for the given zone. "
        "Only one session may be active at a time."
    ),
    responses={
        409: {"description": "A session is already active"},
        404: {"description": "Zone not found"},
    },
)
async def start_session(body: StartSessionRequest, _user: dict = Depends(get_current_user)) -> Session:
    """
    Start a new irrigation session.

    Args:
        body: :class:`~app.models.session.StartSessionRequest` with zone ID.

    Returns:
        The newly created :class:`~app.models.session.Session`.
    """
    try:
        session = create_session(
            zone_id=body.zone_id,
            device_id=body.device_id,
            notes=body.notes,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    logger.info("Session '%s' started via API.", session.session_id)
    return session


@router.post(
    "/{session_id}/stop",
    response_model=Session,
    summary="Stop a session",
    description="Mark the specified session as completed and free the device for the next session.",
    responses={
        404: {"description": "Session not found"},
        409: {"description": "Session is already closed"},
    },
)
async def stop_session_endpoint(
    session_id: str,
    body: Optional[StopSessionRequest] = None,
    _user: dict = Depends(get_current_user),
) -> Session:
    """
    Stop an active irrigation session.

    Args:
        session_id: ID of the session to stop.
        body: Optional :class:`~app.models.session.StopSessionRequest` with optional notes.

    Returns:
        The updated :class:`~app.models.session.Session` with final duration.
    """
    notes = body.notes if body else None
    try:
        session = stop_session(session_id=session_id, notes=notes)
    except ValueError as exc:
        detail = str(exc)
        status_code = (
            status.HTTP_404_NOT_FOUND
            if "not found" in detail
            else status.HTTP_409_CONFLICT
        )
        raise HTTPException(status_code=status_code, detail=detail) from exc

    logger.info("Session '%s' stopped via API.", session_id)
    return session
