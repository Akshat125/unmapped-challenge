"""Shared helpers for the data-prep scripts.

Every output JSON written to public/data/ uses the envelope:
    {"source": "<human-readable source label>", "fetched_at": "YYYY-MM-DD", "values": [...]}

Primary path is the committed cache (scripts/data-prep/cache/) so throttled APIs
cannot block the build. Live API fetch remains a TODO per-fetcher.
"""
from __future__ import annotations

import json
import os
from datetime import date
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = REPO_ROOT / "public" / "data"
CACHE_DIR = REPO_ROOT / "scripts" / "data-prep" / "cache"


def ensure_dirs() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)


def write_output(filename: str, source: str, values: Any) -> Path:
    ensure_dirs()
    path = DATA_DIR / filename
    envelope = {
        "source": source,
        "fetched_at": date.today().isoformat(),
        "values": values,
    }
    path.write_text(json.dumps(envelope, indent=2, ensure_ascii=False))
    print(f"  wrote {path.relative_to(REPO_ROOT)}")
    return path


def load_cache(filename: str) -> Any:
    path = CACHE_DIR / filename
    if not path.exists():
        return None
    return json.loads(path.read_text())


def seed_cache(filename: str, payload: Any) -> None:
    ensure_dirs()
    path = CACHE_DIR / filename
    if path.exists():
        return
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False))
