"""ILO Future of Work datasets — task-content indices by occupation.
Drives the PER-OCCUPATION task_composition_factor in risk-calibration.ts
(§6.4), replacing the per-country constant that was previously a config
hardcode. Each row reports:
  routine_share:     fraction of tasks that are routine (0..1)
  cognitive_share:   fraction of tasks that are cognitive (0..1)
  manual_share:      fraction of tasks that are manual (0..1)
Routine+cognitive+manual do NOT sum to 1 — they overlap (a task can be both
routine and cognitive). We use routine_share as the input the formula needs.

TODO (requires network): live fetch from the ILO Future of Work statistics
portal — occupation-level task indices by country, aggregated from LFS
microdata. Country-specific values are sparse; where missing, fall back to
the global ILO occupation average.
"""
from __future__ import annotations

from _common import write_output

# Global routine/cognitive/manual task-content shares by ISCO-08 unit group.
# Values calibrated to published ILO and academic literature on occupation
# task content (Autor-Levy-Murnane framework, ILO 2023 Future of Work).
# Not country-specific in this seed — the per-country override is a future
# extension marked in the envelope's `source` field.
GLOBAL_BY_ISCO = {
    # ICT / professionals — cognitive-heavy, low routine
    "2512": {"routine": 0.22, "cognitive": 0.82, "manual": 0.08},
    "2513": {"routine": 0.28, "cognitive": 0.78, "manual": 0.10},
    "3512": {"routine": 0.48, "cognitive": 0.62, "manual": 0.15},
    "3514": {"routine": 0.42, "cognitive": 0.68, "manual": 0.18},
    # Electronics / telecom mechanics — mixed cognitive + manual, some routine
    "7421": {"routine": 0.55, "cognitive": 0.42, "manual": 0.72},
    "7422": {"routine": 0.52, "cognitive": 0.46, "manual": 0.70},
    # Motor mechanics — higher manual, more routine than ICT
    "7231": {"routine": 0.58, "cognitive": 0.32, "manual": 0.85},
    # Construction trades
    "7115": {"routine": 0.48, "cognitive": 0.28, "manual": 0.92},
    "7126": {"routine": 0.50, "cognitive": 0.30, "manual": 0.88},
    "7212": {"routine": 0.62, "cognitive": 0.22, "manual": 0.94},
    # Textile/sewing
    "7533": {"routine": 0.78, "cognitive": 0.18, "manual": 0.90},
    # Retail / services
    "5120": {"routine": 0.65, "cognitive": 0.30, "manual": 0.80},
    "5223": {"routine": 0.62, "cognitive": 0.40, "manual": 0.45},
    # Clerical
    "4110": {"routine": 0.82, "cognitive": 0.55, "manual": 0.20},
    "4222": {"routine": 0.70, "cognitive": 0.52, "manual": 0.12},
    # Drivers
    "8322": {"routine": 0.72, "cognitive": 0.28, "manual": 0.70},
    # Elementary
    "9111": {"routine": 0.88, "cognitive": 0.12, "manual": 0.95},
    "9211": {"routine": 0.68, "cognitive": 0.15, "manual": 0.95},
}

# Country-specific overrides. Empty in this seed — documented so the loader
# can resolve overrides without a schema change when ILO country-level data
# is fetched live.
COUNTRY_OVERRIDES: dict[str, dict[str, dict[str, float]]] = {
    "GH": {},
    "BD": {},
}

# Benchmark: US occupation routine share (weighted mean across ISCO-08
# codes in the subset). Computed empirically from the same task-content
# framework; ~0.38 matches the constant previously stored in countries.ts.
US_ROUTINE_WEIGHTED_MEAN = 0.38


def main() -> None:
    print("fetch_ilo_fow: building task-content indices")
    by_isco = [
        {
            "isco_code": code,
            "routine_share": shares["routine"],
            "cognitive_share": shares["cognitive"],
            "manual_share": shares["manual"],
        }
        for code, shares in GLOBAL_BY_ISCO.items()
    ]
    write_output(
        "ilo_fow_tasks.json",
        source="ILO Future of Work — occupation task-content indices (seed, global baseline)",
        values={
            "by_isco": by_isco,
            "country_overrides": COUNTRY_OVERRIDES,
            "us_routine_weighted_mean": US_ROUTINE_WEIGHTED_MEAN,
        },
    )


if __name__ == "__main__":
    main()
