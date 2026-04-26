"""Orchestrator. Runs every source fetcher, then performs the
SOC-to-ISCO-08 crosswalk join (§6.1) and logs unmatched occupations to
public/data/crosswalk_misses.json. Reports the match rate on stdout for
consumption by /about/limits in a later step.

Usage:
    python3 build_occupation_subset.py
"""
from __future__ import annotations

import csv
import json

# Re-use helpers + invoke each fetcher's main()
from _common import DATA_DIR, REPO_ROOT, write_output
import fetch_isco
import fetch_esco
import fetch_onet
import fetch_ilostat
import fetch_wdi
import fetch_wbes
import fetch_wittgenstein
import fetch_frey_osborne
import fetch_ilo_fow

CROSSWALK_CSV = REPO_ROOT / "scripts" / "data-prep" / "crosswalks" / "onet_soc_isco08.csv"


def load_crosswalk() -> dict[str, str]:
    """Returns {soc_code: isco_code} from the committed CSV."""
    mapping: dict[str, str] = {}
    with CROSSWALK_CSV.open() as fh:
        reader = csv.reader(fh)
        for row in reader:
            if not row or row[0].startswith("#"):
                continue
            if row[0].strip().lower() == "soc_code":
                continue
            soc = row[0].strip()
            isco = row[1].strip()
            if soc and isco:
                mapping[soc] = isco
    return mapping


def perform_crosswalk_join() -> None:
    """Build the joined occupation subset and write crosswalk_misses.json."""
    crosswalk = load_crosswalk()

    esco = json.loads((DATA_DIR / "esco_occupations.json").read_text())["values"]
    onet = json.loads((DATA_DIR / "onet_tasks.json").read_text())["values"]
    fo = json.loads((DATA_DIR / "frey_osborne.json").read_text())["values"]

    esco_by_isco = {occ["isco_code"]: occ for occ in esco}

    joined = []
    misses = []

    for onet_row in onet:
        soc = onet_row["soc_code"]
        isco = crosswalk.get(soc)
        if not isco:
            misses.append({"soc_code": soc, "reason": "no_crosswalk_mapping"})
            continue
        esco_occ = esco_by_isco.get(isco)
        if not esco_occ:
            misses.append({
                "soc_code": soc,
                "isco_code": isco,
                "reason": "no_esco_occupation_for_isco",
            })
            continue
        fo_score = fo.get(soc)
        if fo_score is None:
            misses.append({
                "soc_code": soc,
                "isco_code": isco,
                "reason": "no_frey_osborne_score",
            })
            continue
        joined.append({
            "isco_code": isco,
            "soc_code": soc,
            "esco_uri": esco_occ["esco_uri"],
            "preferred_label": esco_occ["preferred_label"],
            "plain_language": esco_occ["plain_language"],
            "essential_skills": esco_occ["essential_skills"],
            "onet_tasks": onet_row["tasks"],
            "frey_osborne_raw": fo_score,
        })

    write_output(
        "occupations_joined.json",
        source="UNMAPPED build: ESCO x O*NET x Frey-Osborne joined via ISCO-08 crosswalk",
        values=joined,
    )

    # Crosswalk misses get their own file per §6.1.
    (DATA_DIR / "crosswalk_misses.json").write_text(
        json.dumps(
            {
                "source": "UNMAPPED build pipeline",
                "misses": misses,
                "match_rate_pct": round(
                    100.0 * len(joined) / max(1, len(joined) + len(misses)),
                    2,
                ),
                "total_onet_occupations": len(onet),
                "matched_occupations": len(joined),
            },
            indent=2,
        )
    )

    match_rate = 100.0 * len(joined) / max(1, len(joined) + len(misses))
    print("")
    print(f"Crosswalk join: {len(joined)} matched, {len(misses)} missed")
    print(f"Match rate: {match_rate:.1f}% (target: >=75%)")
    if match_rate < 75.0:
        print("  WARNING: match rate below 75%. §15 risk #7 trigger — review /about/limits.")


def main() -> None:
    print("=" * 60)
    print("UNMAPPED data-prep pipeline")
    print("=" * 60)
    fetch_isco.main()
    fetch_esco.main()
    fetch_onet.main()
    fetch_ilostat.main()
    fetch_wdi.main()
    fetch_wbes.main()
    fetch_wittgenstein.main()
    fetch_frey_osborne.main()
    fetch_ilo_fow.main()
    print("")
    print("Joining via SOC-to-ISCO-08 crosswalk...")
    perform_crosswalk_join()
    print("=" * 60)
    print("done")


if __name__ == "__main__":
    main()
