"""
manage_firebase.py
──────────────────
CLI management tool for Krushi Yantra Firebase Realtime Database.
Allows inspecting, seeding, testing, and resetting database nodes:
  - zones
  - devices
  - sessions
  - liveReadings
  - history
"""

import argparse
import json
import os
import sys

# Ensure backend root is on Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import settings
from app.firebase import init_firebase, get_db

DEFAULT_ZONES_INIT = {
    "zone_01": {"name": "Zone 1", "status": "active", "crop_type": "Tomato"},
    "zone_02": {"name": "Zone 2", "status": "active", "crop_type": "Wheat"},
    "zone_03": {"name": "Zone 3", "status": "active", "crop_type": "Capsicum"},
    "zone_04": {"name": "Zone 4", "status": "active", "crop_type": "Mango"},
    "zone_05": {"name": "Zone 5", "status": "inactive", "crop_type": None},
    "zone_06": {"name": "Zone 6", "status": "inactive", "crop_type": "Seedlings"},
    "zone_07": {"name": "Zone 7", "status": "inactive", "crop_type": None},
    "zone_08": {"name": "Zone 8", "status": "inactive", "crop_type": None},
}

DEFAULT_DEVICE_INIT = {
    "name": "Portable Sensor Kit",
    "status": "offline",
    "lastSeen": None,
    "current_session_id": None,
    "current_zone_id": None,
}


def cmd_seed(args):
    """Seed the database with default zones and the ESP32_001 device."""
    print("🌱 Connecting to Firebase Realtime Database...")
    init_firebase()
    db = get_db()

    print("🌱 Seeding 8 zones...")
    zones_ref = db.child("zones")
    for zone_id, data in DEFAULT_ZONES_INIT.items():
        zones_ref.child(zone_id).update(data)
        print(f"  ✓ {zone_id}: {data['name']} ({data['status']})")

    print("\n🌱 Seeding device ESP32_001...")
    devices_ref = db.child("devices")
    devices_ref.child("ESP32_001").update(DEFAULT_DEVICE_INIT)
    print("  ✓ ESP32_001 registered.")

    print("\n✅ Database seeding complete!")


def cmd_status(args):
    """Inspect the current contents of the database."""
    print("🔍 Fetching database status...")
    init_firebase()
    db = get_db()

    zones = db.child("zones").get() or {}
    devices = db.child("devices").get() or {}
    sessions = db.child("sessions").get() or {}
    live = db.child("liveReadings").get() or {}
    history = db.child("history").get() or {}

    print("\n" + "=" * 50)
    print("KRUSHI YANTRA DATABASE STATUS")
    print("=" * 50)

    print(f"\n[ZONES] ({len(zones)} registered)")
    for zid, zdata in zones.items():
        st = zdata.get("status", "unknown") if isinstance(zdata, dict) else str(zdata)
        name = zdata.get("name", zid) if isinstance(zdata, dict) else zid
        print(f"  • {zid}: {name} [{st}]")

    print(f"\n[DEVICES] ({len(devices)} registered)")
    for did, ddata in devices.items():
        st = ddata.get("status", "unknown") if isinstance(ddata, dict) else str(ddata)
        name = ddata.get("name", did) if isinstance(ddata, dict) else did
        last_seen = ddata.get("last_seen") or ddata.get("lastSeen") or "never"
        print(f"  • {did}: {name} [{st}] (last seen: {last_seen})")

    print(f"\n[ACTIVE SESSIONS] ({len(sessions)} total)")
    for sid, sdata in list(sessions.items())[-5:]:
        st = sdata.get("status", "unknown") if isinstance(sdata, dict) else str(sdata)
        zid = sdata.get("zone_id", "?") if isinstance(sdata, dict) else "?"
        print(f"  • {sid}: Zone {zid} [{st}]")

    print(f"\n[LIVE READINGS] ({len(live)} zones with live data)")
    for zid, rdata in live.items():
        print(f"  • {zid}: {rdata}")


def cmd_clear_sessions(args):
    """Clear active session pointers and test sessions."""
    print("🧹 Clearing sessions...")
    init_firebase()
    db = get_db()
    db.child("activeSession").delete()
    print("✓ Cleared activeSession pointer.")


def main():
    parser = argparse.ArgumentParser(description="Krushi Yantra Firebase Management CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    seed_parser = subparsers.add_parser("seed", help="Seed default zones and device")
    seed_parser.set_defaults(func=cmd_seed)

    status_parser = subparsers.add_parser("status", help="Inspect database status")
    status_parser.set_defaults(func=cmd_status)

    clear_parser = subparsers.add_parser("clear-sessions", help="Clear active sessions")
    clear_parser.set_defaults(func=cmd_clear_sessions)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()

