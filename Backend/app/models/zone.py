"""
app/models/zone.py
──────────────────
Pydantic models and enums for irrigation zones.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ZoneStatus(str, Enum):
    """Operational state of a zone."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    IRRIGATING = "irrigating"
    ERROR = "error"


class Zone(BaseModel):
    """
    Represents a single irrigation / monitoring zone.

    Eight zones exist in Krushi Yantra (zone_01 … zone_08).
    Zones 1-4 are active by default; zones 5-8 are inactive.
    """

    zone_id: str = Field(..., description="Unique zone identifier (e.g. 'zone_01').")
    name: str = Field(..., description="Human-readable zone name.")
    status: ZoneStatus = Field(ZoneStatus.INACTIVE, description="Current zone state.")
    description: Optional[str] = Field(
        None, description="Optional description of the zone (crop type, location …)."
    )
    area_sqm: Optional[float] = Field(
        None, ge=0, description="Zone area in square metres."
    )
    crop_type: Optional[str] = Field(None, description="Primary crop grown in the zone.")
    crop_category: Optional[str] = Field(None, description="Farmer-selected category: Crop, Vegetable, or Fruit.")

    # Soil-moisture thresholds used by automation rules
    moisture_threshold_low: float = Field(
        30.0,
        ge=0,
        le=100,
        description="Trigger irrigation when moisture falls below this level (%).",
    )
    moisture_threshold_high: float = Field(
        70.0,
        ge=0,
        le=100,
        description="Stop irrigation when moisture reaches this level (%).",
    )

    model_config = {"json_schema_extra": {
        "example": {
            "zone_id": "zone_01",
            "name": "Zone 1 — North Field",
            "status": "active",
            "description": "Tomato crop, drip irrigation",
            "area_sqm": 500.0,
            "crop_type": "Tomato",
            "moisture_threshold_low": 30.0,
            "moisture_threshold_high": 70.0,
        }
    }}


# ── Default zone definitions ───────────────────────────────────────────────────

DEFAULT_ZONES: list[dict] = [
    {
        "zone_id": "zone_01",
        "name": "Zone 1 — North Field",
        "status": ZoneStatus.ACTIVE,
        "crop_type": "Tomato",
        "area_sqm": 500.0,
        "moisture_threshold_low": 30.0,
        "moisture_threshold_high": 70.0,
    },
    {
        "zone_id": "zone_02",
        "name": "Zone 2 — South Field",
        "status": ZoneStatus.ACTIVE,
        "crop_type": "Wheat",
        "area_sqm": 600.0,
        "moisture_threshold_low": 35.0,
        "moisture_threshold_high": 65.0,
    },
    {
        "zone_id": "zone_03",
        "name": "Zone 3 — East Greenhouse",
        "status": ZoneStatus.ACTIVE,
        "crop_type": "Capsicum",
        "area_sqm": 200.0,
        "moisture_threshold_low": 40.0,
        "moisture_threshold_high": 75.0,
    },
    {
        "zone_id": "zone_04",
        "name": "Zone 4 — West Orchard",
        "status": ZoneStatus.ACTIVE,
        "crop_type": "Mango",
        "area_sqm": 1000.0,
        "moisture_threshold_low": 25.0,
        "moisture_threshold_high": 60.0,
    },
    {
        "zone_id": "zone_05",
        "name": "Zone 5 — Storage Area",
        "status": ZoneStatus.INACTIVE,
        "crop_type": None,
        "area_sqm": 150.0,
        "moisture_threshold_low": 30.0,
        "moisture_threshold_high": 70.0,
    },
    {
        "zone_id": "zone_06",
        "name": "Zone 6 — Nursery",
        "status": ZoneStatus.INACTIVE,
        "crop_type": "Seedlings",
        "area_sqm": 80.0,
        "moisture_threshold_low": 50.0,
        "moisture_threshold_high": 85.0,
    },
    {
        "zone_id": "zone_07",
        "name": "Zone 7 — Fallow (South-East)",
        "status": ZoneStatus.INACTIVE,
        "crop_type": None,
        "area_sqm": 400.0,
        "moisture_threshold_low": 30.0,
        "moisture_threshold_high": 70.0,
    },
    {
        "zone_id": "zone_08",
        "name": "Zone 8 — Fallow (North-West)",
        "status": ZoneStatus.INACTIVE,
        "crop_type": None,
        "area_sqm": 350.0,
        "moisture_threshold_low": 30.0,
        "moisture_threshold_high": 70.0,
    },
]
