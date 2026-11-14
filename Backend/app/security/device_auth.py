"""
app/security/device_auth.py
────────────────────────────
FastAPI dependency for authenticating ESP32 device requests.

The ESP32 passes its secret in the ``X-Device-Token`` HTTP header.
The token is compared (constant-time) against ``DEVICE_SECRET_KEY``
loaded from the environment.
"""

from __future__ import annotations

import hmac
import logging

from fastapi import Header, HTTPException, status

from app.config import settings

logger = logging.getLogger(__name__)

_DEVICE_TOKEN_HEADER = "X-Device-Token"


async def verify_device_token(
    x_device_token: str = Header(
        ...,
        alias="X-Device-Token",
        description=(
            "Shared secret key that authenticates the ESP32 device. "
            "Must match the DEVICE_SECRET_KEY environment variable."
        ),
    ),
) -> str:
    """
    FastAPI dependency that validates the ``X-Device-Token`` header.

    Uses :func:`hmac.compare_digest` for constant-time comparison to
    prevent timing-based token enumeration attacks.

    Args:
        x_device_token: Value of the ``X-Device-Token`` HTTP header,
            injected by FastAPI.

    Returns:
        The validated token string (so downstream handlers can log it).

    Raises:
        :class:`fastapi.HTTPException` 401: When the token is missing or invalid.
    """
    expected = settings.device_secret_key

    # compare_digest requires both operands to be the same type (str).
    is_valid = hmac.compare_digest(
        x_device_token.encode("utf-8"),
        expected.encode("utf-8"),
    )

    if not is_valid:
        logger.warning(
            "Device authentication failed — invalid X-Device-Token header."
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing device token.",
            headers={"WWW-Authenticate": "X-Device-Token"},
        )

    logger.debug("Device token validated successfully.")
    return x_device_token
