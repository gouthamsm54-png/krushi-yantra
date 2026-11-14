"""
app/models/session.py
─────────────────────
Pydantic models and enums for irrigation sessions.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class SessionStatus(str, Enum):
    """Lifecycle state of an irrigation session."""

    ACTIVE = "active"
    COMPLETED = "completed"
    ABORTED = "aborted"


class Session(BaseModel):
    """
    Represents a single irrigation / monitoring session for a zone.

    A session is created when the operator presses *Start* on the dashboard
    and closed (status → COMPLETED) when *Stop* is pressed.
    """

    session_id: str = Field(..., description="Unique session identifier.")
    zone_id: str = Field(..., description="Zone this session belongs to.")
    device_id: str = Field(..., description="Device that executed this session.")
    status: SessionStatus = Field(
        SessionStatus.ACTIVE, description="Current lifecycle state."
    )
    started_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="UTC timestamp when the session was created.",
    )
    stopped_at: Optional[datetime] = Field(
        None, description="UTC timestamp when the session ended (None if still active)."
    )
    duration_seconds: Optional[int] = Field(
        None, ge=0, description="Total session duration in seconds (computed on stop)."
    )
    notes: Optional[str] = Field(
        None, description="Optional operator notes attached at session end."
    )

    model_config = {"json_schema_extra": {
        "example": {
            "session_id": "sess_20240501_001",
            "zone_id": "zone_01",
            "device_id": "ESP32_001",
            "status": "active",
            "started_at": "2024-05-01T06:00:00Z",
            "stopped_at": None,
            "duration_seconds": None,
            "notes": None,
        }
    }}


class StartSessionRequest(BaseModel):
    """Request body for `POST /api/sessions/start`."""

    zone_id: str = Field(..., description="Zone to start monitoring.")
    device_id: str = Field(
        default="ESP32_001", description="Device ID that will collect readings."
    )
    notes: Optional[str] = Field(None, description="Optional pre-session notes.")


class StopSessionRequest(BaseModel):
    """Request body for `POST /api/sessions/{session_id}/stop`."""

    notes: Optional[str] = Field(
        None, description="Optional post-session notes or observations."
    )
