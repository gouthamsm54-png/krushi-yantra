"""
app/api/auth.py
───────────────
Authentication API router.
Validates Firebase auth tokens and provides current user profile.
"""

from fastapi import APIRouter, Depends
from app.security.auth import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.get("/me", summary="Get authenticated user info")
async def get_me(user: dict = Depends(get_current_user)) -> dict:
    """Return the profile of the currently logged-in user."""
    return {
        "uid": user.get("uid"),
        "email": user.get("email"),
        "name": user.get("name") or user.get("email", "Farmer"),
    }


@router.post("/verify", summary="Verify Firebase ID token")
async def verify_token(user: dict = Depends(get_current_user)) -> dict:
    """Check if token is valid and active."""
    return {"status": "authenticated", "user": user}

