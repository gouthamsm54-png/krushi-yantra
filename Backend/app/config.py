"""
app/config.py
─────────────
Application settings loaded from environment variables / .env file.
Uses pydantic-settings for type-safe configuration with validation.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """
    Central configuration class for Krushi Yantra backend.

    All fields are populated from environment variables or the `.env` file.
    Override at runtime by setting the corresponding environment variable.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Firebase ──────────────────────────────────────────────────────────────
    firebase_credentials_path: str = Field(
        default="serviceAccountKey.json",
        description="Path to the Firebase service-account JSON file.",
    )
    firebase_database_url: str = Field(
        ...,
        description="Firebase Realtime Database URL (e.g. https://…firebaseio.com).",
    )

    # ── Device authentication ─────────────────────────────────────────────────
    device_secret_key: str = Field(
        ...,
        description="Shared secret key used to authenticate ESP32 device requests.",
    )

    # ── Application ───────────────────────────────────────────────────────────
    app_env: str = Field(
        default="development",
        description="Runtime environment: development | staging | production.",
    )
    app_title: str = "Krushi Yantra API"
    app_version: str = "1.0.0"
    app_description: str = (
        "Smart agriculture monitoring backend — "
        "manages zones, sensor readings, and irrigation sessions."
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    cors_origins: list[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"],
        description="Allowed CORS origins for the frontend.",
    )

    @property
    def is_production(self) -> bool:
        """Return True when running in the production environment."""
        return self.app_env.lower() == "production"


# Module-level singleton — import this everywhere.
settings = Settings()
