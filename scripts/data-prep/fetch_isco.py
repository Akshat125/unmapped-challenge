"""ISCO-08 reference table. The 4-digit code is the canonical join key
between ESCO, O*NET (via the crosswalk), and Frey-Osborne scores.

TODO (requires network): replace the inline seed with a full download of the
ILO ISCO-08 structure from https://www.ilo.org/public/english/bureau/stat/isco/isco08/
"""
from __future__ import annotations

from _common import write_output

# Curated LMIC-relevant ISCO-08 subset. Expanded during live fetch.
# Structure: {code: "name"} — 4-digit unit group level.
SEED = [
    # Technicians and associate professionals
    {"code": "3512", "title": "Information and communications technology user support technicians"},
    {"code": "3514", "title": "Web technicians"},
    # Service and sales workers
    {"code": "5120", "title": "Cooks"},
    {"code": "5223", "title": "Shop sales assistants"},
    {"code": "5412", "title": "Police officers"},
    # Craft and related trades workers
    {"code": "7115", "title": "Carpenters and joiners"},
    {"code": "7126", "title": "Plumbers and pipe fitters"},
    {"code": "7212", "title": "Welders and flamecutters"},
    {"code": "7221", "title": "Blacksmiths, hammersmiths and forging-press workers"},
    {"code": "7231", "title": "Motor vehicle mechanics and repairers"},
    {"code": "7421", "title": "Electronics mechanics and servicers"},
    {"code": "7422", "title": "Information and communications technology installers and servicers"},
    {"code": "7533", "title": "Sewing, embroidery and related workers"},
    # Clerical support workers
    {"code": "4110", "title": "General office clerks"},
    {"code": "4222", "title": "Contact centre information clerks"},
    # Plant and machine operators
    {"code": "8322", "title": "Car, taxi and van drivers"},
    # Elementary occupations
    {"code": "9111", "title": "Domestic cleaners and helpers"},
    {"code": "9211", "title": "Crop farm labourers"},
    # Professionals
    {"code": "2512", "title": "Software developers"},
    {"code": "2513", "title": "Web and multimedia developers"},
    {"code": "2421", "title": "Management and organization analysts"},
    {"code": "2622", "title": "Librarians and related information professionals"},
    {"code": "2351", "title": "Education methods specialists"},
    {"code": "2352", "title": "Special needs teachers"},
]


def main() -> None:
    print("fetch_isco: building ISCO-08 subset")
    write_output(
        "isco08.json",
        source="ILO ISCO-08 (curated subset, seed data — replace via live fetch for production)",
        values=SEED,
    )


if __name__ == "__main__":
    main()
