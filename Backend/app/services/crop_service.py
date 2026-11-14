"""Farmer crop catalog and zone assignment services."""

from __future__ import annotations

import re
from uuid import uuid4

from app.firebase import get_db
from app.models.crop import CropCategory, CropOption
from app.models.zone import Zone

CROP_OPTIONS_PATH = "cropOptions"
ZONES_PATH = "zones"


def _category_for(name: str) -> CropCategory:
    value = name.lower()
    if any(word in value for word in ("mango", "strawberr", "apple", "orange", "banana", "grape", "berry", "papaya", "guava", "fruit")):
        return "Fruit"
    if any(word in value for word in ("tomato", "capsicum", "pepper", "spinach", "chard", "cucumber", "bean", "carrot", "chilli", "chili", "eggplant", "brinjal", "okra", "potato", "onion", "lettuce")):
        return "Vegetable"
    return "Crop"


def _slug(value: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", value.lower())).strip("-") or "produce"


def get_crop_options() -> list[CropOption]:
    """Return saved options plus current zone crops for initial assignment choices."""
    stored = get_db().child(CROP_OPTIONS_PATH).get() or {}
    options_by_name: dict[str, CropOption] = {}
    if isinstance(stored, dict):
        for crop_id, raw in stored.items():
            if isinstance(raw, dict):
                item = CropOption(id=raw.get("id", crop_id), name=raw.get("name", ""), category=raw.get("category", "Crop"))
                options_by_name[item.name.casefold()] = item

    zones_data = get_db().child(ZONES_PATH).get() or {}
    if isinstance(zones_data, dict):
        for raw in zones_data.values():
            if not isinstance(raw, dict) or not raw.get("crop_type"):
                continue
            name = str(raw["crop_type"]).strip()
            key = name.casefold()
            if key not in options_by_name:
                category = raw.get("crop_category") or _category_for(name)
                options_by_name[key] = CropOption(id=f"default-{_slug(name)}", name=name, category=category)

    return sorted(options_by_name.values(), key=lambda item: (item.category, item.name.casefold()))


def add_crop_option(name: str, category: CropCategory) -> CropOption:
    """Save a farmer-created crop option, rejecting duplicate names."""
    normalized_name = name.strip()
    if any(item.name.casefold() == normalized_name.casefold() for item in get_crop_options()):
        raise ValueError(f"{normalized_name} is already in the crop options.")

    crop_id = f"{_slug(normalized_name)}-{uuid4().hex[:8]}"
    option = CropOption(id=crop_id, name=normalized_name, category=category)
    get_db().child(CROP_OPTIONS_PATH).child(crop_id).set(option.model_dump())
    return option


def assign_crop_to_zone(zone_id: str, crop_id: str) -> Zone:
    """Assign an existing crop option to a zone and return the updated zone."""
    zone_ref = get_db().child(ZONES_PATH).child(zone_id)
    zone_data = zone_ref.get()
    if not zone_data:
        raise ValueError(f"Zone '{zone_id}' was not found.")

    crop = next((item for item in get_crop_options() if item.id == crop_id), None)
    if crop is None:
        raise ValueError(f"Crop option '{crop_id}' was not found.")

    zone_ref.update({"crop_type": crop.name, "crop_category": crop.category})
    updated = zone_ref.get() or {}
    return Zone(**updated)
