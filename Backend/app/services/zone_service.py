"""
app/services/zone_service.py
─────────────────────────────
Business logic for zone management backed by Firebase Realtime Database.
"""

from __future__ import annotations

import logging
from typing import Optional

from app.firebase import get_db
from app.models.zone import DEFAULT_ZONES, Zone, ZoneStatus

logger = logging.getLogger(__name__)

ZONES_PATH = "zones"


def get_all_zones() -> list[Zone]:
    """
    Fetch all zones from Firebase.

    Returns:
        A list of :class:`~app.models.zone.Zone` objects ordered by zone_id.

    Raises:
        RuntimeError: When Firebase is unreachable.
    """
    ref = get_db().child(ZONES_PATH)
    data: dict | None = ref.get()

    if not data:
        logger.warning("No zones found in Firebase — returning empty list.")
        return []

    zones = [Zone(**zone_data) for zone_data in data.values()]
    zones.sort(key=lambda z: z.zone_id)
    return zones


def get_zone(zone_id: str) -> Optional[Zone]:
    """
    Fetch a single zone by ID from Firebase.

    Args:
        zone_id: Zone identifier (e.g. ``"zone_01"``).

    Returns:
        :class:`~app.models.zone.Zone` or ``None`` if not found.
    """
    ref = get_db().child(ZONES_PATH).child(zone_id)
    data: dict | None = ref.get()

    if not data:
        logger.info("Zone '%s' not found in Firebase.", zone_id)
        return None

    return Zone(**data)


def initialize_zones() -> None:
    """
    Seed the Firebase database with the default eight zones.

    This is a **non-destructive** operation: existing zones are not
    overwritten so manual edits in Firebase survive a server restart.

    Call this from the FastAPI startup event.
    """
    ref = get_db().child(ZONES_PATH)
    existing: dict | None = ref.get()

    for zone_dict in DEFAULT_ZONES:
        zone_id = zone_dict["zone_id"]

        if existing and zone_id in existing:
            logger.debug("Zone '%s' already exists — skipping seed.", zone_id)
            continue

        # Serialise enums to their string values before writing
        payload = {
            k: (v.value if isinstance(v, ZoneStatus) else v)
            for k, v in zone_dict.items()
        }
        ref.child(zone_id).set(payload)
        logger.info("Seeded zone '%s'.", zone_id)

    logger.info("Zone initialisation complete.")


def update_zone_status(zone_id: str, status: ZoneStatus) -> None:
    """
    Update the status field of a single zone in Firebase.

    Args:
        zone_id: Target zone identifier.
        status: New :class:`~app.models.zone.ZoneStatus` value.
    """
    get_db().child(ZONES_PATH).child(zone_id).update({"status": status.value})
    logger.info("Zone '%s' status → '%s'.", zone_id, status.value)
