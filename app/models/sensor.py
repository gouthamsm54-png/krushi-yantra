"""
app/models/sensor.py
────────────────────
Pydantic models for sensor readings coming from the ESP32 device.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class SensorReadings(BaseModel):
    """
    Raw sensor values recorded in a single measurement cycle.

    All numeric fields use `float` so the ESP32 can send integer or
    decimal values without schema errors.  `None` signals that the
    sensor reported an error / was unavailable.
    """

    soil_moisture_1: Optional[float] = Field(
        None,
        ge=0,
        le=100,
        description="Soil moisture from sensor 1 (% volumetric water content).",
    )
    soil_moisture_2: Optional[float] = Field(
        None,
        ge=0,
        le=100,
        description="Soil moisture from sensor 2 (% volumetric water content).",
    )
    temperature_air: Optional[float] = Field(
        None,
        ge=-40,
        le=85,
        description="Air temperature from DHT22 (°C).",
    )
    humidity_air: Optional[float] = Field(
        None,
        ge=0,
        le=100,
        description="Relative humidity from DHT22 (%).",
    )
    temperature_soil: Optional[float] = Field(
        None,
        ge=-55,
        le=125,
        description="Soil temperature from DS18B20 (°C).",
    )
    rain_analog: Optional[float] = Field(
        None,
        ge=0,
        le=100,
        description="Rain intensity from HW-028 analogue pin (0–100 %).",
    )
    rain_digital: Optional[bool] = Field(
        None,
        description="Rain detected flag from HW-028 digital pin.",
    )
    water_level_cm: Optional[float] = Field(
        None,
        ge=0,
        description="Water reservoir level from HC-SR04 ultrasonic sensor (cm).",
    )

    @field_validator("soil_moisture_1", "soil_moisture_2", mode="before")
    @classmethod
    def reject_negative_moisture(cls, v: object) -> object:
        """Treat negative sentinel values (e.g. -1) as None."""
        if isinstance(v, (int, float)) and v < 0:
            return None
        return v


class ReadingPayload(BaseModel):
    """
    Full payload POSTed by the ESP32 to `POST /api/device/readings`.

    Wraps :class:`SensorReadings` with device metadata so the backend
    can route the data to the correct zone and session.
    """

    device_id: str = Field(
        ...,
        description="Unique identifier of the ESP32 device (e.g. 'ESP32_001').",
    )
    zone_id: str = Field(
        ...,
        description="Zone being monitored (e.g. 'zone_01').",
    )
    session_id: Optional[str] = Field(
        None,
        description="Active session ID.  None if device is in idle/heartbeat mode.",
    )
    readings: SensorReadings = Field(..., description="Sensor measurement values.")
    timestamp: Optional[datetime] = Field(
        None,
        description=(
            "Device-side timestamp (UTC ISO-8601).  "
            "Falls back to server time if omitted."
        ),
    )

    model_config = {"json_schema_extra": {
        "example": {
            "device_id": "ESP32_001",
            "zone_id": "zone_01",
            "session_id": "sess_20240501_001",
            "readings": {
                "soil_moisture_1": 42.5,
                "soil_moisture_2": 38.0,
                "temperature_air": 29.3,
                "humidity_air": 65.0,
                "temperature_soil": 24.1,
                "rain_analog": 10.0,
                "rain_digital": False,
                "water_level_cm": 18.5,
            },
            "timestamp": "2024-05-01T07:30:00Z",
        }
    }}
