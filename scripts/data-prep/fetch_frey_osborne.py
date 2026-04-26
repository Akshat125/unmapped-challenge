"""Frey & Osborne (2013) 'Future of Employment' automation probabilities by
SOC code. Used as the raw/long-term risk value in §6.4 — the near-term
LMIC-adjusted displacement risk is computed at runtime by
lib/risk-calibration.ts using this + ITU broadband + ILO task share.

TODO (requires network): live fetch of the published score table
  https://www.oxfordmartin.ox.ac.uk/publications/view/1314
"""
from __future__ import annotations

from _common import write_output

# Keyed by SOC code. Values are probability of computerization (0-1).
# Matched to the demo occupation subset via the crosswalk.
FREY_OSBORNE = {
    "49-3023.00": 0.59,   # Auto mechanics
    "49-2097.00": 0.71,   # Electronic equipment installers
    "49-2022.00": 0.70,   # Telecom installers
    "15-1254.00": 0.21,   # Web developers
    "15-1252.00": 0.13,   # Software developers
    "15-1232.00": 0.65,   # Computer user support specialists
    "41-2031.00": 0.92,   # Retail salespersons
    "51-6052.00": 0.84,   # Tailors
    "47-2031.00": 0.72,   # Carpenters
    "47-2152.00": 0.35,   # Plumbers
    "51-4121.00": 0.94,   # Welders
    "53-3058.00": 0.89,   # Drivers (near-eliminated in FO framing)
    "35-2014.00": 0.96,   # Cooks, restaurant
    "43-9061.00": 0.96,   # Office clerks
    "43-4051.00": 0.55,   # Customer service reps
    "37-2012.00": 0.66,   # Cleaners
    "45-2092.00": 0.87,   # Farmworkers
}


def main() -> None:
    print("fetch_frey_osborne: building automation probability table")
    write_output(
        "frey_osborne.json",
        source="Frey & Osborne (2013) US automation probabilities",
        values=FREY_OSBORNE,
    )


if __name__ == "__main__":
    main()
