"""
app/firebase.py
───────────────
Firebase Admin SDK initialisation and Realtime Database helpers.

Call `init_firebase()` once at startup (done inside `app/main.py`).
Everywhere else use `get_db()` to obtain the authenticated database reference.
Includes an in-memory fallback store when serviceAccountKey.json is not present.
"""

from __future__ import annotations

import logging
import os
from functools import lru_cache
from typing import Any, Optional

from app.config import settings

logger = logging.getLogger(__name__)

_is_real_firebase = False


class InMemoryDbRef:
    """A lightweight in-memory fallback when Firebase credentials are not provided."""

    _store: dict[str, Any] = {}

    def __init__(self, path: str = "") -> None:
        self.path = path.strip("/")

    def child(self, subpath: str) -> InMemoryDbRef:
        new_path = f"{self.path}/{subpath.strip('/')}" if self.path else subpath.strip("/")
        return InMemoryDbRef(new_path)

    def _get_node(self) -> tuple[Optional[dict[str, Any]], Optional[str]]:
        if not self.path:
            return InMemoryDbRef._store, None
        parts = self.path.split("/")
        curr = InMemoryDbRef._store
        for p in parts[:-1]:
            if not isinstance(curr, dict) or p not in curr:
                return None, parts[-1]
            curr = curr[p]
        return curr, parts[-1]

    def get(self) -> Any:
        if not self.path:
            return InMemoryDbRef._store
        curr, key = self._get_node()
        if curr is None or key is None or key not in curr:
            return None
        return curr[key]

    def set(self, value: Any) -> None:
        if not self.path:
            InMemoryDbRef._store = value if isinstance(value, dict) else {}
            return
        parts = self.path.split("/")
        curr = InMemoryDbRef._store
        for p in parts[:-1]:
            if p not in curr or not isinstance(curr[p], dict):
                curr[p] = {}
            curr = curr[p]
        curr[parts[-1]] = value

    def update(self, values: dict[str, Any]) -> None:
        existing = self.get()
        if not isinstance(existing, dict):
            existing = {}
        existing.update(values)
        self.set(existing)

    def delete(self) -> None:
        if not self.path:
            InMemoryDbRef._store.clear()
            return
        curr, key = self._get_node()
        if curr is not None and key is not None and key in curr:
            del curr[key]


def init_firebase() -> None:
    """
    Initialise the Firebase Admin SDK if credentials exist.
    Otherwise, fall back to in-memory store for local testing.
    """
    global _is_real_firebase

    try:
        import firebase_admin
        from firebase_admin import credentials

        if firebase_admin._DEFAULT_APP_NAME in firebase_admin._apps:
            logger.debug("Firebase already initialised — skipping.")
            _is_real_firebase = True
            return

        cred_path = settings.firebase_credentials_path
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(
                cred,
                {"databaseURL": settings.firebase_database_url},
            )
            _is_real_firebase = True
            logger.info(
                "Firebase Admin SDK initialised. Database URL: %s",
                settings.firebase_database_url,
            )
        else:
            logger.warning(
                "Firebase credentials file not found at '%s'. Running in in-memory simulation mode.",
                cred_path,
            )
    except Exception as exc:
        logger.warning(
            "Could not initialize Firebase Admin SDK (%s). Running in in-memory simulation mode.",
            exc,
        )


def get_db():
    """
    Return the Firebase Realtime Database reference, or the in-memory fallback.
    """
    global _is_real_firebase
    if _is_real_firebase:
        try:
            from firebase_admin import db
            return db.reference("/")
        except Exception:
            pass
    return InMemoryDbRef("")
