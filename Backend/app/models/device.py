"""
app/models/device.py
────────────────────
Pydantic models for the ESP32 device and its heartbeat payloads.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class DeviceStatus(str, Enum):
    """Connectivity and operational state of the ESP32."""

    ONLINE = "online"
    OFFLINE = "offline"
    IDLE = "idle"
    MEASURING = "measuring"
    ERROR = "error"


class Device(BaseModel):
    """
    Represents the ESP32_001 field device.

    Stored and updated under `/devices/ESP32_001` in Firebase Realtime DB.
    """

    device_id: str = Field(..., description="Unique device identifier.")
    status: DeviceStatus = Field(
        DeviceStatus.OFFLINE, description="Current device state."
    )
    current_session_id: Optional[str] = Field(
        None, description="Active session ID, or None when idle."
    )
    current_zone_id: Optional[str] = Field(
        None, description="Zone currently being monitored."
    )
    firmware_version: Optional[str] = Field(
        None, description="Semantic version string of the installed firmware."
    )
    ip_address: Optional[str] = Field(
        None, description="Current local IP address assigned over Wi-Fi."
    )
    wifi_rssi: Optional[int] = Field(
        None, description="Wi-Fi signal strength in dBm (negative value)."
    )
    last_seen: Optional[datetime] = Field(
        None, description="UTC timestamp of the most-recent heartbeat."
    )
    uptime_seconds: Optional[int] = Field(
        None, ge=0, description="Seconds since the device last rebooted."
    )

    model_config = {"json_schema_extra": {
        "example": {
            "device_id": "ESP32_001",
            "status": "online",
            "current_session_id": "sess_20240501_001",
            "current_zone_id": "zone_01",
            "firmware_version": "1.2.0",
            "ip_address": "192.168.1.42",
            "wifi_rssi": -62,
            "last_seen": "2024-05-01T07:35:00Z",
            "uptime_seconds": 3600,
        }
    }}


class HeartbeatPayload(BaseModel):
    """
    Payload sent by the ESP32 to `POST /api/device/heartbeat` every 60 s.
    """

    device_id: str = Field(
        default="ESP32_001", description="Device identifier."
    )
    firmware_version: Optional[str] = Field(None, description="Current firmware version.")
    ip_address: Optional[str] = Field(None, description="Current Wi-Fi IP address.")
    wifi_rssi: Optional[int] = Field(None, description="Wi-Fi RSSI (dBm).")
    uptime_seconds: Optional[int] = Field(None, ge=0, description="Uptime in seconds.")
    free_heap_bytes: Optional[int] = Field(
        None, ge=0, description="Available ESP32 heap memory in bytes."
    )
