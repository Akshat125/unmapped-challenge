"""Orchestrator — runs all live data fetchers in sequence.

Usage:
    python3 build_occupation_subset.py
"""
from __future__ import annotations

import fetch_esco
import fetch_ilostat
import fetch_wdi
import fetch_wbes
import fetch_wittgenstein
import fetch_ilo_fow


def main() -> None:
    print("=" * 60)
    print("UNMAPPED data-prep pipeline")
    print("=" * 60)
    fetch_esco.main()
    fetch_ilostat.main()
    fetch_wdi.main()
    fetch_wbes.main()
    fetch_wittgenstein.main()
    fetch_ilo_fow.main()
    print("=" * 60)
    print("done")


if __name__ == "__main__":
    main()
