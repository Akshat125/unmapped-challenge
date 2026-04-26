"""build_frey_osborne_overlay.py — bring data/frey_osborne.csv onto the
ISCO-08 axis using the SOC↔ISCO crosswalk so the recommendation ranker can
score the automation-safety component.

Inputs:
  data/frey_osborne.csv                          — Frey & Osborne (2013) probs
  scripts/data-prep/crosswalks/onet_soc_isco08.csv — SOC↔ISCO-08 mapping

Output:
  public/data/frey_osborne_isco.json — { isco_code: { fo_prob,
                                                      employed_total,
                                                      n_socs,
                                                      sources: [...] } }

Aggregation: when one ISCO-08 unit group maps to multiple SOC codes, we
average the SOC probabilities weighted by US employment ('numbEmployed'),
which is the same shape Frey-Osborne use to weight their own dataset. The
provenance `sources` array lists every contributing SOC row so the runtime
can cite exact codes in the per-card 'Why we recommended this' disclosure.

This script is a sidecar — it does NOT regenerate esco_occupations.json.
The runtime ESCO loader looks up frey_osborne_isco.json and merges the
fo_prob value at request time. That keeps the ESCO release pinned and lets
us iterate the FO overlay independently.
"""
from __future__ import annotations

import csv
from pathlib import Path

from _common import REPO_ROOT, write_output

DATA_DIR_RAW = REPO_ROOT / "data"
CROSSWALK_PATH = REPO_ROOT / "scripts" / "data-prep" / "crosswalks" / "onet_soc_isco08.csv"
FREY_PATH = DATA_DIR_RAW / "frey_osborne.csv"


def normalize_soc(code: str) -> str:
    """Crosswalk uses 49-3023.00 form; Frey-Osborne uses 49-3023. Reduce both
    to the same 6-digit major-minor-detail form for keying."""
    return code.split(".")[0].strip()


def load_crosswalk() -> dict[str, list[str]]:
    """soc6 -> [isco_code, ...]"""
    out: dict[str, list[str]] = {}
    with CROSSWALK_PATH.open(encoding="utf-8") as fh:
        for line in fh:
            if line.startswith("#") or not line.strip():
                continue
            if line.startswith("soc_code"):
                continue
            parts = [p.strip() for p in line.split(",")]
            if len(parts) < 2:
                continue
            soc, isco = parts[0], parts[1]
            if not soc or not isco:
                continue
            out.setdefault(normalize_soc(soc), []).append(isco)
    return out


def load_frey_osborne() -> list[dict]:
    rows = []
    with FREY_PATH.open(encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            soc = normalize_soc(row.get("_ - code", ""))
            try:
                prob = float(row.get("prob") or row.get("probability") or "")
            except ValueError:
                continue
            try:
                employed = float(row.get("numbEmployed") or row.get("employed_may2016") or 0)
            except ValueError:
                employed = 0.0
            occupation = (row.get("occupation") or row.get("short occupation") or "").strip()
            if not soc:
                continue
            rows.append({
                "soc": soc,
                "prob": prob,
                "employed": employed,
                "occupation": occupation,
            })
    return rows


def main() -> None:
    print("build_frey_osborne_overlay: SOC -> ISCO-08 employment-weighted aggregation")
    if not FREY_PATH.exists():
        print(f"  ERROR: {FREY_PATH} missing — cannot build FO overlay")
        return
    if not CROSSWALK_PATH.exists():
        print(f"  ERROR: {CROSSWALK_PATH} missing — cannot build FO overlay")
        return

    crosswalk = load_crosswalk()
    fo_rows = load_frey_osborne()
    print(f"  crosswalk rows: {sum(len(v) for v in crosswalk.values())}")
    print(f"  frey-osborne rows: {len(fo_rows)}")

    # Bucket SOC-keyed FO rows by ISCO. One SOC may be associated with one or
    # more ISCO codes per the crosswalk; we add the row to each.
    bucket: dict[str, list[dict]] = {}
    miss = 0
    for fo in fo_rows:
        iscos = crosswalk.get(fo["soc"], [])
        if not iscos:
            miss += 1
            continue
        for isco in iscos:
            bucket.setdefault(isco, []).append(fo)

    payload: dict[str, dict] = {}
    for isco, items in bucket.items():
        total_emp = sum(it["employed"] for it in items)
        if total_emp <= 0:
            # Even split if numbEmployed is missing for every contributor.
            fo_prob = sum(it["prob"] for it in items) / len(items)
        else:
            fo_prob = sum(it["prob"] * it["employed"] for it in items) / total_emp
        payload[isco] = {
            "fo_prob": round(fo_prob, 4),
            "employed_total": round(total_emp, 1),
            "n_socs": len(items),
            "sources": [
                {
                    "soc": it["soc"],
                    "prob": round(it["prob"], 4),
                    "employed": round(it["employed"], 1),
                    "occupation": it["occupation"],
                }
                for it in sorted(items, key=lambda x: -x["employed"])
            ],
        }

    print(f"  ISCO codes covered: {len(payload)}")
    print(f"  unmatched SOC rows: {miss} (~{100 * miss / max(1, len(fo_rows)):.1f}%)")

    write_output(
        "frey_osborne_isco.json",
        source=(
            "Frey & Osborne (2013) Table A1 · employment-weighted SOC→ISCO-08 "
            "crosswalk · scripts/data-prep/crosswalks/onet_soc_isco08.csv"
        ),
        values=payload,
    )


if __name__ == "__main__":
    main()
