"""build_ilo_isco_country.py — per-country employment by ISCO-08 1-digit
major group, derived from the ILOSTAT bulk download files committed at
data/ilo_emp_occ_{BOL,GHA,VNM}.csv.

Powers the country-demand component of the recommendation ranker:
  s_demand(occupation, country) =
      0.5 * employment_share[isco_1_digit, country] +
      0.5 * cagr_3y_rescaled[isco_1_digit, country]

Output envelope (public/data/ilo_isco_country.json):
  {
    "GHA": {
      "latest_year": 2023,
      "by_isco_1": {
        "1": { "emp_share": 0.06, "yoy_pct": 1.2, "cagr_3y_pct": 2.4,
               "latest_value_thousands": 870.5,
               "source_rows": [{"year": 2021, "value": 800}, ...] },
        ...
      }
    },
    "BOL": {...},
    "VNM": {...}
  }

The provenance `source_rows` array is what lets the runtime cite "the rows
we used" in the per-card 'Why we recommended this' disclosure.

Annual rows are preferred. When annual is missing we average all available
quarterly rows for that year. Months (BOL series only) are averaged into
quarters first.
"""
from __future__ import annotations

import csv
import re
from pathlib import Path
from typing import Iterator

from _common import REPO_ROOT, write_output

DATA_DIR_RAW = REPO_ROOT / "data"

# Files committed to the repo. Order is also the source-trace order.
COUNTRY_FILES: dict[str, str] = {
    "BOL": "ilo_emp_occ_BOL.csv",
    "GHA": "ilo_emp_occ_GHA.csv",
    "VNM": "ilo_emp_occ_VNM.csv",
}

ISCO1_CODES = [str(d) for d in range(0, 10)]

ANNUAL_RE = re.compile(r"^(\d{4})$")
QUARTER_RE = re.compile(r"^(\d{4})-Q([1-4])$")
MONTH_RE = re.compile(r"^(\d{4})-M(\d{2})$")


def parse_period(period: str) -> tuple[int | None, str]:
    """Return (year, frequency) where frequency ∈ {'A','Q','M'} or ('?', '?')."""
    if m := ANNUAL_RE.match(period):
        return int(m.group(1)), "A"
    if m := QUARTER_RE.match(period):
        return int(m.group(1)), "Q"
    if m := MONTH_RE.match(period):
        return int(m.group(1)), "M"
    return None, "?"


def parse_csv(path: Path) -> Iterator[dict[str, str]]:
    with path.open(encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            yield row


def aggregate_for_country(country_code: str, csv_path: Path) -> dict:
    """Build the per-country payload from one ILO bulk CSV."""
    # value[isco_1][year] -> list of (period, value, freq) rows pulled from CSV
    raw: dict[str, dict[int, list[tuple[str, float, str]]]] = {
        c: {} for c in ISCO1_CODES
    }

    for row in parse_csv(csv_path):
        if row.get("REF_AREA") != country_code:
            continue
        if row.get("MEASURE") != "EMP_TEMP_NB":
            continue
        if row.get("SEX") != "SEX_T":
            continue
        ocu = row.get("OCU", "")
        if not ocu.startswith("OCU_ISCO08_"):
            continue
        suffix = ocu[len("OCU_ISCO08_"):]
        if suffix not in ISCO1_CODES:
            continue
        period = row.get("TIME_PERIOD", "")
        year, freq = parse_period(period)
        if year is None:
            continue
        try:
            value = float(row.get("OBS_VALUE") or "")
        except ValueError:
            continue
        raw[suffix].setdefault(year, []).append((period, value, freq))

    # Reduce raw rows to one annual value per (isco, year). Prefer annual
    # rows; otherwise mean quarterly; otherwise mean monthly.
    annual: dict[str, dict[int, tuple[float, list[dict]]]] = {
        c: {} for c in ISCO1_CODES
    }
    for isco, by_year in raw.items():
        for year, items in by_year.items():
            picked: list[tuple[str, float, str]] = []
            picked_freq: str | None = None
            for freq_pref in ("A", "Q", "M"):
                rows_for_freq = [r for r in items if r[2] == freq_pref]
                if rows_for_freq:
                    picked = rows_for_freq
                    picked_freq = freq_pref
                    break
            if not picked:
                continue
            mean_value = sum(v for _, v, _ in picked) / len(picked)
            provenance = [
                {"period": p, "value": round(v, 3), "frequency": picked_freq}
                for p, v, _ in sorted(picked, key=lambda x: x[0])
            ]
            annual[isco][year] = (mean_value, provenance)

    # Latest year per ISCO is the most recent year that has data.
    all_years = sorted({y for series in annual.values() for y in series}, reverse=True)
    if not all_years:
        return {"latest_year": None, "by_isco_1": {}, "source_file": str(csv_path.relative_to(REPO_ROOT))}

    latest_year = all_years[0]

    # Total employment for share denominator (sum across ISCO 1..9 in latest year).
    total_latest = 0.0
    for isco in ISCO1_CODES:
        if isco == "0":
            continue  # major group 0 = Armed forces; excluded from total.
        series = annual.get(isco, {})
        if latest_year in series:
            total_latest += series[latest_year][0]

    by_isco_1: dict[str, dict] = {}
    for isco in ISCO1_CODES:
        series = annual.get(isco, {})
        if not series:
            continue
        years_sorted = sorted(series.keys())
        latest = years_sorted[-1]
        latest_value = series[latest][0]
        emp_share = latest_value / total_latest if total_latest > 0 else 0.0

        # YoY growth: compare latest with previous year if available.
        yoy_pct = None
        if len(years_sorted) >= 2 and years_sorted[-2] == latest - 1:
            prev = series[years_sorted[-2]][0]
            if prev > 0:
                yoy_pct = round(((latest_value - prev) / prev) * 100, 2)

        # 3-year CAGR over the latest 3 years available, contiguous when
        # possible. Falls back to the longest contiguous window of length >=2
        # ending at `latest`.
        cagr_pct = None
        for window in (3, 2):
            anchor = latest - window
            if anchor in series:
                start = series[anchor][0]
                if start > 0 and latest_value > 0:
                    cagr = (latest_value / start) ** (1 / window) - 1
                    cagr_pct = round(cagr * 100, 2)
                    break

        # Provenance — every row used to compute the values above.
        source_rows = []
        for y in (latest, latest - 1, latest - 2, latest - 3):
            if y in series:
                _, prov = series[y]
                source_rows.extend(
                    {"year": y, **r} for r in prov
                )

        by_isco_1[isco] = {
            "latest_year": latest,
            "latest_value_thousands": round(latest_value, 3),
            "emp_share": round(emp_share, 4),
            "yoy_pct": yoy_pct,
            "cagr_3y_pct": cagr_pct,
            "source_rows": source_rows,
        }

    return {
        "latest_year": latest_year,
        "by_isco_1": by_isco_1,
        "source_file": str(csv_path.relative_to(REPO_ROOT)),
        "rows_used": sum(len(v["source_rows"]) for v in by_isco_1.values()),
    }


def main() -> None:
    print("build_ilo_isco_country: per-country ISCO-08 1-digit employment")
    payload: dict[str, dict] = {}
    for country, filename in COUNTRY_FILES.items():
        path = DATA_DIR_RAW / filename
        if not path.exists():
            print(f"  WARN: {filename} not found, skipping {country}")
            continue
        agg = aggregate_for_country(country, path)
        rows_used = agg.get("rows_used", 0)
        print(f"  {country}: latest_year={agg['latest_year']} rows_used={rows_used}")
        payload[country] = agg

    write_output(
        "ilo_isco_country.json",
        source=(
            "ILO ILOSTAT bulk download — EMP_TEMP_SEX_OCU_NB by ISCO-08 1-digit · "
            "aggregated from data/ilo_emp_occ_{BOL,GHA,VNM}.csv"
        ),
        values=payload,
    )


if __name__ == "__main__":
    main()
