"""
app/api/history.py
───────────────────
Sensor history retrieval endpoint.

Routes
------
GET /api/history/{zone_id}  — paginated reading history for a zone
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, Query

from app.security.auth import get_current_user
from app.services.firebase_service import get_live_reading, get_zone_history

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/history", tags=["History"])


@router.get(
    "/{zone_id}/latest",
    summary="Get latest zone reading",
    description="Returns the current sensor snapshot for a zone through the authenticated API.",
)
async def latest_zone_reading(
    zone_id: str,
    _user: dict = Depends(get_current_user),
) -> dict[str, Any] | None:
    return get_live_reading(zone_id)


@router.get(
    "/{zone_id}",
    summary="Get zone reading history",
    description=(
        "Returns the most-recent sensor readings logged for *zone_id*, "
        "sorted newest-first. Use the `limit` query parameter to cap the "
        "number of records returned (default 100, max 500)."
    ),
    responses={
        200: {"description": "List of historical sensor records"},
    },
)
async def zone_history(
    zone_id: str,
    limit: int = Query(
        default=100,
        ge=1,
        le=500,
        description="Maximum number of history entries to return.",
    ),
    _user: dict = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """
    Retrieve reading history for a zone from Firebase.

    Args:
        zone_id: Zone identifier (e.g. ``zone_01``).
        limit: Maximum entries to return (1–500, default 100).

    Returns:
        List of history records, newest first.
    """
    records = get_zone_history(zone_id, limit=limit)
    logger.info(
        "History query for zone '%s': returned %d records (limit=%d).",
        zone_id,
        len(records),
        limit,
    )
    return records
