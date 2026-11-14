"""
app/security/auth.py
────────────────────
FastAPI dependency for verifying Firebase Authentication ID tokens
sent by the React frontend dashboard via Authorization: Bearer <token>.
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import firebase_admin
from firebase_admin import auth

from app.config import settings

logger = logging.getLogger(__name__)

security_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
) -> dict:
    """
    Validate the Firebase ID token in Authorization header.
    In development mode, allows a mock user if no token is provided.
    """
    if credentials is None:
        if not settings.is_production:
            # Development fallback
            return {
                "uid": "dev-user-001",
                "email": "dev@krushiyantra.local",
                "name": "Dev Farmer",
            }
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as exc:
        logger.warning("Token verification failed: %s", exc)
        if not settings.is_production:
            return {
                "uid": "dev-user-fallback",
                "email": "farmer@krushiyantra.local",
                "name": "Local Farmer",
            }
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )

