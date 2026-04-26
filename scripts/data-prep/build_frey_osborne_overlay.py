"""build_frey_osborne_overlay.py — bring data/frey_osborne.csv onto the
ISCO-08 axis using the SOC↔ISCO crosswalk so the recommendation ranker can
score the automation-safety component.

Inputs:
  data/frey_osborne.csv                          — Frey & Osborne (2013) probs
  scripts/data-prep/crosswalks/onet_soc_isco08.csv — SOC↔ISCO-08 mapping

Output:
  public/data/frey_osborne_isco.json — {
    by_isco_4: { "2512": { fo_prob, employed_total, n_socs, sources } },
    by_isco_3: { "251":  { fo_prob, employed_total, n_socs, n_isco_4 } },
    by_isco_2: { "25":   { fo_prob, employed_total, n_socs, n_isco_4 } },
    by_isco_1: { "2":    { fo_prob, employed_total, n_socs, n_isco_4 } }
  }

Aggregation: when one ISCO-08 unit group maps to multiple SOC codes, we
average the SOC probabilities weighted by US employment ('numbEmployed'),
which is the same shape Frey-Osborne use to weight their own dataset. The
provenance `sources` array on the 4-digit level lists every contributing SOC
row so the runtime can cite exact codes in the per-card 'Why we recommended
this' disclosure.

The 3/2/1-digit aggregates exist because the SOC→ISCO crosswalk is sparse —
only ~95 of ~430 ISCO unit groups have an exact match. Without the
hierarchical fallback, ~66% of ESCO occupations would fall through to
'safety = 1.0' and the youth card would silently report 0% automation risk.
With the fallback the runtime can always cite a real Frey-Osborne probability
and tell the user what level of the ISCO tree it came from.

This script is a sidecar — it does NOT regenerate esco_occupations.json.
The runtime ESCO loader looks up frey_osborne_isco.json and merges the
fo_prob value at request time. That keeps the ESCO release pinned and lets
us iterate the FO overlay independently.
"""
from __future__ import annotations

import csv

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


def aggregate_unit_groups(bucket: dict[str, list[dict]]) -> dict[str, dict]:
    """4-digit ISCO unit-group level: employment-weighted across contributing
    SOC rows, with a `sources` array citing every SOC."""
    payload: dict[str, dict] = {}
    for isco, items in bucket.items():
        total_emp = sum(it["employed"] for it in items)
        if total_emp <= 0:
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
    return payload


def aggregate_prefix(unit: dict[str, dict], width: int) -> dict[str, dict]:
    """Roll the 4-digit unit-group payload up to a shorter ISCO prefix.
    Employment-weighted across every unit group whose code starts with the
    prefix — this is the `safety = 1 − fo_prob` fallback the runtime uses
    when an ISCO code has no exact 4-digit match in the SOC crosswalk."""
    bucket: dict[str, list[dict]] = {}
    for isco, entry in unit.items():
        if len(isco) < width:
            continue
        bucket.setdefault(isco[:width], []).append({"isco": isco, **entry})
    out: dict[str, dict] = {}
    for prefix, items in bucket.items():
        total_emp = sum(it["employed_total"] for it in items)
        if total_emp <= 0:
            fo_prob = sum(it["fo_prob"] for it in items) / len(items)
        else:
            fo_prob = sum(it["fo_prob"] * it["employed_total"] for it in items) / total_emp
        out[prefix] = {
            "fo_prob": round(fo_prob, 4),
            "employed_total": round(total_emp, 1),
            "n_socs": sum(it["n_socs"] for it in items),
            "n_isco_4": len(items),
            "isco_4_codes": sorted(it["isco"] for it in items)[:8],
        }
    return out


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

    by_isco_4 = aggregate_unit_groups(bucket)
    by_isco_3 = aggregate_prefix(by_isco_4, 3)
    by_isco_2 = aggregate_prefix(by_isco_4, 2)
    by_isco_1 = aggregate_prefix(by_isco_4, 1)

    print(f"  ISCO 4-digit unit groups covered: {len(by_isco_4)}")
    print(f"  ISCO 3-digit minor groups covered: {len(by_isco_3)}")
    print(f"  ISCO 2-digit sub-major groups covered: {len(by_isco_2)}")
    print(f"  ISCO 1-digit major groups covered: {len(by_isco_1)}")
    print(f"  unmatched SOC rows: {miss} (~{100 * miss / max(1, len(fo_rows)):.1f}%)")

    write_output(
        "frey_osborne_isco.json",
        source=(
            "Frey & Osborne (2013) Table A1 · employment-weighted SOC→ISCO-08 "
            "crosswalk · scripts/data-prep/crosswalks/onet_soc_isco08.csv · "
            "hierarchical fallback at ISCO 4/3/2/1 digit levels"
        ),
        values={
            "by_isco_4": by_isco_4,
            "by_isco_3": by_isco_3,
            "by_isco_2": by_isco_2,
            "by_isco_1": by_isco_1,
        },
    )


if __name__ == "__main__":
    main()
