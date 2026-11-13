"""
app/api/readings.py
────────────────────
Sensor-reading ingestion endpoint.

Routes
------
POST /api/device/readings  — ESP32 posts validated sensor data here
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.models.sensor import ReadingPayload
from app.security.device_auth import verify_device_token
from app.services.firebase_service import append_history, write_live_reading
from app.services.sensor_service import validate_readings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/device", tags=["Readings"])


@router.post(
    "/readings",
    status_code=status.HTTP_201_CREATED,
    summary="Ingest sensor readings",
    description=(
        "Called by the ESP32 after each measurement cycle. "
        "Validates the payload, writes the latest snapshot to `liveReadings`, "
        "and appends a time-stamped entry to `history`."
    ),
    dependencies=[Depends(verify_device_token)],
    responses={
        422: {"description": "Sensor data failed validation"},
    },
)
async def ingest_readings(payload: ReadingPayload) -> dict:
    """
    Validate and store sensor readings.

    Processing steps:
    1. Stamp server receive time if device timestamp is missing.
    2. Run domain-level validation via :func:`~app.services.sensor_service.validate_readings`.
    3. Write to ``/liveReadings/{zone_id}`` (overwrites previous snapshot).
    4. Append to ``/history/{zone_id}/{timestamp_key}`` (append-only log).

    Args:
        payload: :class:`~app.models.sensor.ReadingPayload` from the device.

    Returns:
        Confirmation dict with ``history_key`` for the stored entry.
    """
    # Fill missing device timestamp with server time
    if payload.timestamp is None:
        payload.timestamp = datetime.now(tz=timezone.utc)

    # Domain validation
    is_valid, issues = validate_readings(payload.readings)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"message": "Sensor readings failed validation.", "issues": issues},
        )

    if issues:
        logger.warning(
            "Readings for zone '%s' passed with warnings: %s",
            payload.zone_id,
            issues,
        )

    # Persist to Firebase
    write_live_reading(payload)
    history_key = append_history(payload)

    logger.info(
        "Readings stored for zone '%s' (session=%s, history_key=%s).",
        payload.zone_id,
        payload.session_id,
        history_key,
    )

    return {
        "status": "ok",
        "zone_id": payload.zone_id,
        "history_key": history_key,
        "timestamp": payload.timestamp.isoformat(),
        "warnings": issues,
    }
