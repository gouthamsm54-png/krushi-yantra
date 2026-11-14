"""
app/api/zones.py
────────────────
Zone configuration endpoints.

Routes
------
GET  /api/zones              — list all 8 zones
GET  /api/zones/{zone_id}    — fetch a single zone by ID
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.models.zone import Zone
from app.security.auth import get_current_user
from app.services.zone_service import get_all_zones, get_zone

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/zones", tags=["Zones"])


@router.get(
    "",
    response_model=list[Zone],
    summary="List all zones",
    description=(
        "Returns the configuration for all 8 irrigation zones "
        "(zone_01 … zone_08), ordered by zone ID."
    ),
)
async def list_zones(_user: dict = Depends(get_current_user)) -> list[Zone]:
    """
    Fetch all zone configurations from Firebase Realtime Database.

    Returns an ordered list of :class:`~app.models.zone.Zone` objects.
    Zones 1-4 are active by default; zones 5-8 are inactive.
    """
    zones = get_all_zones()
    logger.info("Returned %d zones.", len(zones))
    return zones


@router.get(
    "/{zone_id}",
    response_model=Zone,
    summary="Get a single zone",
    description="Returns the configuration for a specific zone identified by *zone_id*.",
    responses={
        404: {"description": "Zone not found"},
    },
)
async def get_zone_detail(zone_id: str, _user: dict = Depends(get_current_user)) -> Zone:
    """
    Fetch a single zone configuration from Firebase.

    Args:
        zone_id: Zone identifier, e.g. ``zone_01``.

    Returns:
        :class:`~app.models.zone.Zone` or 404 if the zone does not exist.
    """
    zone = get_zone(zone_id)
    if zone is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Zone '{zone_id}' not found.",
        )
    return zone
