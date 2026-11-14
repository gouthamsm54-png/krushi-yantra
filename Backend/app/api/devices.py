"""
app/api/devices.py
───────────────────
Device management endpoints consumed by the ESP32 firmware.

Routes
------
GET  /api/device/current-session   — ESP32 polls this to know what to monitor
POST /api/device/heartbeat         — ESP32 sends a heartbeat every 60 s
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.models.device import Device, DeviceStatus, HeartbeatPayload
from app.models.session import Session
from app.security.auth import get_current_user
from app.security.device_auth import verify_device_token
from app.services.firebase_service import get_device_status, update_device_status
from app.services.session_service import get_active_session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/device", tags=["Device"])

DEVICE_ID = "ESP32_001"


@router.get(
    "/status",
    response_model=Device,
    summary="Get portable sensor kit status",
    description="Returns the latest ESP32 heartbeat for the authenticated dashboard user.",
)
async def dashboard_device_status(
    device_id: str = Query(default=DEVICE_ID),
    _user: dict = Depends(get_current_user),
) -> Device:
    """Serve device status through FastAPI so the frontend never reads Firebase directly."""
    data = get_device_status(device_id) or {}
    return Device(device_id=device_id, **{key: value for key, value in data.items() if key != "device_id"})


@router.get(
    "/current-session",
    response_model=Optional[Session],
    summary="Get current active session",
    description=(
        "Returns the active session so the ESP32 knows which zone to monitor. "
        "Returns null/204 when no session is running — the device should idle."
    ),
    dependencies=[Depends(verify_device_token)],
)
async def current_session() -> Optional[Session]:
    """
    Return the currently active session, or ``null`` if idle.

    The ESP32 polls this endpoint on startup and after each reading cycle
    to check whether it should start/continue/stop collecting data.
    """
    session = get_active_session()
    if session:
        logger.debug("ESP32 polled current-session → '%s'.", session.session_id)
    else:
        logger.debug("ESP32 polled current-session → no active session.")
    return session


@router.post(
    "/heartbeat",
    response_model=Device,
    summary="Device heartbeat",
    description=(
        "Called by the ESP32 every 60 seconds to signal it is online and "
        "report its current status (firmware version, IP, Wi-Fi RSSI, uptime)."
    ),
    dependencies=[Depends(verify_device_token)],
)
async def device_heartbeat(payload: HeartbeatPayload) -> Device:
    """
    Receive and persist an ESP32 heartbeat.

    Updates ``/devices/ESP32_001`` in Firebase with the latest status info.

    Args:
        payload: :class:`~app.models.device.HeartbeatPayload` from the device.

    Returns:
        The updated :class:`~app.models.device.Device` record.
    """
    extra = {k: v for k, v in {
        "firmware_version": payload.firmware_version,
        "ip_address": payload.ip_address,
        "wifi_rssi": payload.wifi_rssi,
        "uptime_seconds": payload.uptime_seconds,
        "free_heap_bytes": payload.free_heap_bytes,
        "device_id": payload.device_id,
    }.items() if v is not None}

    update_device_status(DEVICE_ID, DeviceStatus.ONLINE, extra=extra)

    # Return the freshest record from Firebase so the client can inspect it
    data = get_device_status(DEVICE_ID) or {}
    device = Device(device_id=DEVICE_ID, **{k: v for k, v in data.items() if k != "device_id"})
    logger.info("Heartbeat received from '%s'.", DEVICE_ID)
    return device
