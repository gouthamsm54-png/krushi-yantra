"""Authenticated API for farmer crop options."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.models.crop import AssignZoneCropRequest, CreateCropOptionRequest, CropOption
from app.models.zone import Zone
from app.security.auth import get_current_user
from app.services.crop_service import add_crop_option, assign_crop_to_zone, get_crop_options

router = APIRouter(prefix="/api", tags=["Crops"])


@router.get("/crops", response_model=list[CropOption])
async def list_crop_options(_user: dict = Depends(get_current_user)) -> list[CropOption]:
    return get_crop_options()


@router.post("/crops", response_model=CropOption, status_code=status.HTTP_201_CREATED)
async def create_crop_option(
    body: CreateCropOptionRequest,
    _user: dict = Depends(get_current_user),
) -> CropOption:
    try:
        return add_crop_option(body.name, body.category)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.put("/zones/{zone_id}/crop", response_model=Zone)
async def update_zone_crop(
    zone_id: str,
    body: AssignZoneCropRequest,
    _user: dict = Depends(get_current_user),
) -> Zone:
    try:
        return assign_crop_to_zone(zone_id, body.crop_id)
    except ValueError as exc:
        code = status.HTTP_404_NOT_FOUND
        raise HTTPException(status_code=code, detail=str(exc)) from exc
