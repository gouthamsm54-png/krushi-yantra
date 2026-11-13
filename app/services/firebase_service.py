"""
app/services/firebase_service.py
─────────────────────────────────
Low-level Firebase read/write helpers used by the API routers.

Paths used in Firebase Realtime Database:
  /liveReadings/{zone_id}             ← latest reading snapshot
  /history/{zone_id}/{timestamp_key}  ← time-series log
  /devices/{device_id}                ← device status
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from app.firebase import get_db
from app.models.sensor import ReadingPayload
from app.models.device import DeviceStatus, HeartbeatPayload

logger = logging.getLogger(__name__)

LIVE_READINGS_PATH = "liveReadings"
HISTORY_PATH = "history"
DEVICES_PATH = "devices"


def _utc_now_iso() -> str:
    """Return current UTC time as an ISO-8601 string."""
    return datetime.now(tz=timezone.utc).isoformat()


def _timestamp_key() -> str:
    """Return a Firebase-safe sortable timestamp key without forbidden characters."""
    return datetime.now(tz=timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")


def write_live_reading(payload: ReadingPayload) -> None:
    """
    Overwrite the latest sensor snapshot for a zone.

    Written to ``/liveReadings/{zone_id}`` so the frontend can subscribe
    with a Firebase real-time listener and get instant updates.

    Args:
        payload: The validated :class:`~app.models.sensor.ReadingPayload`.
    """
    zone_id = payload.zone_id
    record: dict[str, Any] = {
        "zone_id": zone_id,
        "device_id": payload.device_id,
        "session_id": payload.session_id,
        "timestamp": payload.timestamp.isoformat() if payload.timestamp else _utc_now_iso(),
        "readings": payload.readings.model_dump(exclude_none=True),
        "server_timestamp": _utc_now_iso(),
    }

    get_db().child(LIVE_READINGS_PATH).child(zone_id).set(record)
    logger.debug("Live reading written for zone '%s'.", zone_id)


def append_history(payload: ReadingPayload) -> str:
    """
    Append a sensor reading to the time-series history log for a zone.

    Written to ``/history/{zone_id}/{timestamp_key}``.

    Args:
        payload: The validated :class:`~app.models.sensor.ReadingPayload`.

    Returns:
        The key used to store this history entry.
    """
    zone_id = payload.zone_id
    key = _timestamp_key()

    record: dict[str, Any] = {
        "zone_id": zone_id,
        "device_id": payload.device_id,
        "session_id": payload.session_id,
        "timestamp": payload.timestamp.isoformat() if payload.timestamp else _utc_now_iso(),
        "readings": payload.readings.model_dump(exclude_none=True),
    }

    get_db().child(HISTORY_PATH).child(zone_id).child(key).set(record)
    logger.debug("History appended for zone '%s' at key '%s'.", zone_id, key)
    return key


def update_device_status(
    device_id: str,
    status: DeviceStatus,
    extra: dict[str, Any] | None = None,
) -> None:
    """
    Merge a status update into the device record under ``/devices/{device_id}``.

    Args:
        device_id: Target device identifier.
        status: New :class:`~app.models.device.DeviceStatus`.
        extra: Additional fields to merge (e.g. IP address, RSSI).
    """
    updates: dict[str, Any] = {
        "status": status.value,
        "last_seen": _utc_now_iso(),
    }
    if extra:
        updates.update(extra)

    get_db().child(DEVICES_PATH).child(device_id).update(updates)
    logger.debug("Device '%s' status → '%s'.", device_id, status.value)


def get_device_status(device_id: str) -> dict[str, Any] | None:
    """
    Fetch the current device record from Firebase.

    Args:
        device_id: Target device identifier.

    Returns:
        Device data dict, or ``None`` if not found.
    """
    return get_db().child(DEVICES_PATH).child(device_id).get()


def get_live_reading(zone_id: str) -> dict[str, Any] | None:
    """Fetch the latest sensor snapshot for a zone from the live-readings path."""
    return get_db().child(LIVE_READINGS_PATH).child(zone_id).get()


def get_zone_history(zone_id: str, limit: int = 100) -> list[dict[str, Any]]:
    """
    Retrieve the most-recent history entries for a zone.

    Firebase Realtime DB does not support server-side ``LIMIT`` on the
    Python Admin SDK in the same way as Firestore; we sort client-side.

    Args:
        zone_id: Target zone identifier.
        limit: Maximum number of entries to return (newest first).

    Returns:
        List of history records sorted by timestamp descending.
    """
    data: dict | None = get_db().child(HISTORY_PATH).child(zone_id).get()

    if not data:
        return []

    entries = list(data.values())
    entries.sort(key=lambda e: e.get("timestamp", ""), reverse=True)
    return entries[:limit]
