"""Wittgenstein Centre education attainment projections, 2025-2035.
Country × age 20-24 × both sexes (the single cohort definition in §7.2.2).
Drives the "Where you are heading" subcard; template rules consume the
current and 2035 tertiary attainment percentages.

TODO (requires network): live fetch from the Wittgenstein Centre Data Explorer
  http://dataexplorer.wittgensteincentre.org/
"""
from __future__ import annotations

from _common import write_output

# Percentage of 20-24 age cohort (both sexes) at each attainment level.
# Rows must sum to ~100 within a country+year. Country namespace is ISO-3.
PROJECTIONS = {
    "GHA": [
        {"year": 2025, "no_education_pct": 9, "basic_pct": 46, "secondary_pct": 33, "tertiary_pct": 12},
        {"year": 2030, "no_education_pct": 7, "basic_pct": 42, "secondary_pct": 35, "tertiary_pct": 16},
        {"year": 2035, "no_education_pct": 5, "basic_pct": 38, "secondary_pct": 36, "tertiary_pct": 21},
    ],
    "BOL": [
        {"year": 2025, "no_education_pct": 5, "basic_pct": 38, "secondary_pct": 38, "tertiary_pct": 19},
        {"year": 2030, "no_education_pct": 4, "basic_pct": 33, "secondary_pct": 39, "tertiary_pct": 24},
        {"year": 2035, "no_education_pct": 3, "basic_pct": 29, "secondary_pct": 39, "tertiary_pct": 29},
    ],
    "VNM": [
        {"year": 2025, "no_education_pct": 2, "basic_pct": 30, "secondary_pct": 47, "tertiary_pct": 21},
        {"year": 2030, "no_education_pct": 2, "basic_pct": 26, "secondary_pct": 45, "tertiary_pct": 27},
        {"year": 2035, "no_education_pct": 1, "basic_pct": 22, "secondary_pct": 43, "tertiary_pct": 34},
    ],
}


def main() -> None:
    print("fetch_wittgenstein: building education attainment projections")
    write_output(
        "wittgenstein.json",
        source="Wittgenstein Centre 2025-2035 education attainment projections (seed values)",
        values=PROJECTIONS,
    )


if __name__ == "__main__":
    main()
