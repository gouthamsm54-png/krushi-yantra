"""Crop options managed by farmers through the authenticated API."""

from typing import Literal

from pydantic import BaseModel, Field, field_validator

CropCategory = Literal["Crop", "Vegetable", "Fruit"]


class CropOption(BaseModel):
    id: str
    name: str = Field(min_length=1, max_length=60)
    category: CropCategory


class CreateCropOptionRequest(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    category: CropCategory

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Crop name cannot be empty.")
        return value


class AssignZoneCropRequest(BaseModel):
    crop_id: str = Field(min_length=1)
