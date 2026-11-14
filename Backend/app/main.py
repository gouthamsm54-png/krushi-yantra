"""
app/main.py
───────────
FastAPI application factory for Krushi Yantra backend.

Responsibilities:
  - Create and configure the FastAPI app instance.
  - Register CORS middleware.
  - Mount all API routers.
  - Run the Firebase + zone initialisation on startup.
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.firebase import init_firebase
from app.api import auth, crops, zones, sessions, devices, readings, history

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if not settings.is_production else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── Application factory ───────────────────────────────────────────────────────

def create_app() -> FastAPI:
    """
    Build and return the configured FastAPI application.

    Called once at module import time; the returned instance is what
    uvicorn serves.
    """
    app = FastAPI(
        title=settings.app_title,
        version=settings.app_version,
        description=settings.app_description,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ───────────────────────────────────────────────────────────────
    app.include_router(auth.router)
    app.include_router(crops.router)
    app.include_router(zones.router)
    app.include_router(sessions.router)
    app.include_router(devices.router)
    app.include_router(readings.router)
    app.include_router(history.router)

    # ── Startup / shutdown events ─────────────────────────────────────────────
    @app.on_event("startup")
    async def on_startup() -> None:
        """
        Initialise Firebase and seed default zone data on server start.

        This runs once before the first request is accepted.
        """
        logger.info("Krushi Yantra API starting up (env=%s)…", settings.app_env)
        init_firebase()

        # Seed zones only after Firebase is ready
        from app.services.zone_service import initialize_zones
        initialize_zones()

        logger.info("Startup complete — API is ready.")

    @app.on_event("shutdown")
    async def on_shutdown() -> None:
        """Graceful shutdown hook."""
        logger.info("Krushi Yantra API shutting down.")

    # ── Health check ──────────────────────────────────────────────────────────
    @app.get("/health", tags=["Health"], summary="Health check")
    async def health_check() -> dict:
        """
        Simple liveness probe.

        Returns ``{"status": "ok"}`` when the server is up.
        Kubernetes / load-balancer probes can hit this endpoint.
        """
        return {
            "status": "ok",
            "app": settings.app_title,
            "version": settings.app_version,
            "env": settings.app_env,
        }

    return app


# ── Module-level app instance (used by uvicorn) ───────────────────────────────
app = create_app()
