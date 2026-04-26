"""fetch_esco.py — build esco_skills.json and esco_occupations.json
from the official ESCO v1.2.1 CSV release.

Produces:
  public/data/esco_skills.json      — all 13,960 skills with real URIs,
                                       labels, alt_labels, descriptions
  public/data/esco_occupations.json — all ESCO occupations with real URIs,
                                       ISCO codes, essential skill URIs

Usage:
    python3 extract_esco_csv.py [/path/to/esco-csv-dir]

Default CSV dir: ~/Downloads/ESCO dataset - v1.2.1 - classification - en - csv
"""
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

from _common import write_output

DEFAULT_CSV_DIR = (
    Path.home()
    / "Downloads"
    / "ESCO dataset - v1.2.1 - classification - en - csv"
)

# Frey-Osborne automation scores keyed by ISCO code (from our existing seed).
# Populated for the 17 occupations we had data for; everything else gets 0.
# TODO: expand via a full SOC→ISCO crosswalk when needed.
FREY_OSBORNE_BY_ISCO: dict[str, float] = {
    "7231": 0.59,  # Auto mechanics
    "7421": 0.71,  # Electronics mechanics
    "7422": 0.70,  # Telecom installers
    "2513": 0.21,  # Web developers
    "2512": 0.13,  # Software developers
    "3512": 0.65,  # Computer support specialists
    "5223": 0.92,  # Retail / shop sales
    "7533": 0.84,  # Tailors / sewing workers
    "7115": 0.72,  # Carpenters
    "7126": 0.35,  # Plumbers
    "7212": 0.94,  # Welders
    "8322": 0.89,  # Drivers
    "5120": 0.96,  # Cooks
    "4110": 0.96,  # Office clerks
    "4222": 0.55,  # Contact centre / customer service
    "9111": 0.69,  # Domestic cleaners
    "9211": 0.87,  # Crop farm workers
}

# Hand-written plain-language descriptions kept from the original seed.
# These are shown to youth users instead of the ESCO formal definition.
PLAIN_LANGUAGE_BY_ISCO: dict[str, str] = {
    "7231": "Fixes cars, motorbikes and trucks",
    "7421": "Repairs electronic devices and equipment",
    "7422": "Installs and services phones, routers and IT equipment",
    "2513": "Builds websites and web applications",
    "2512": "Writes software for computers and phones",
    "3512": "Helps people solve computer and software problems",
    "3514": "Maintains websites and fixes web problems",
    "5223": "Sells goods in a shop and helps customers",
    "7533": "Sews and alters clothing",
    "7115": "Builds and fits wooden structures and furniture",
    "7126": "Installs and repairs water pipes and fittings",
    "7212": "Joins metal parts by welding",
    "8322": "Drives passengers or goods for a living",
    "5120": "Prepares food in homes, restaurants or stalls",
    "4110": "Handles paperwork, records and office tasks",
    "4222": "Answers calls and handles customer questions",
    "9111": "Cleans homes and helps with household chores",
    "9211": "Plants, tends and harvests crops",
}


def extract_skills(csv_dir: Path) -> list[dict]:
    """Read skills_en.csv → list of skill dicts with real URIs + descriptions."""
    skills = []
    path = csv_dir / "skills_en.csv"
    with path.open(encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            if row["conceptType"] != "KnowledgeSkillCompetence":
                continue
            alt_labels = [
                a.strip()
                for a in row.get("altLabels", "").split("\n")
                if a.strip()
            ]
            skills.append(
                {
                    "uri": row["conceptUri"],
                    "label": row["preferredLabel"].strip(),
                    "alt_labels": alt_labels,
                    "description": row.get("description", "").strip(),
                }
            )
    return skills


def extract_occupation_skill_relations(csv_dir: Path) -> dict[str, list[str]]:
    """Read occupationSkillRelations_en.csv → {occupationUri: [skillUri, ...]}
    for essential skills only."""
    relations: dict[str, list[str]] = {}
    path = csv_dir / "occupationSkillRelations_en.csv"
    with path.open(encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            if row["relationType"] != "essential":
                continue
            occ_uri = row["occupationUri"]
            skill_uri = row["skillUri"]
            relations.setdefault(occ_uri, []).append(skill_uri)
    return relations


def extract_occupations(
    csv_dir: Path, relations: dict[str, list[str]]
) -> list[dict]:
    """Read occupations_en.csv → list of occupation dicts with real URIs
    and essential skill URI lists."""
    occupations = []
    path = csv_dir / "occupations_en.csv"
    with path.open(encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            if row["conceptType"] != "Occupation":
                continue
            isco_code = row.get("iscoGroup", "").strip()
            occ_uri = row["conceptUri"]
            essential_skills = relations.get(occ_uri, [])

            # Skip occupations with no essential skills — nothing to match on.
            if not essential_skills:
                continue

            plain = PLAIN_LANGUAGE_BY_ISCO.get(isco_code, "").strip()
            # Fall back to ESCO definition (truncated) when we have no hand-written label.
            if not plain:
                definition = row.get("definition", "").strip()
                plain = definition[:120] + "…" if len(definition) > 120 else definition

            occupations.append(
                {
                    "isco_code": isco_code,
                    "esco_uri": occ_uri,
                    "preferred_label": row["preferredLabel"].strip(),
                    "plain_language": plain,
                    "essential_skills": essential_skills,
                    "frey_osborne_raw": FREY_OSBORNE_BY_ISCO.get(isco_code, 0),
                }
            )
    return occupations


def main() -> None:
    csv_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_CSV_DIR

    if not csv_dir.exists():
        # The ESCO v1.2.1 release is large (~250 MB) and lives outside the
        # repo. When it's missing we keep the already-committed
        # public/data/esco_*.json files instead of failing the pipeline, so
        # data-prep stays runnable on any clone. The Frey-Osborne overlay
        # below still patches frey_osborne_raw on the existing committed file.
        print(f"WARN: ESCO CSV directory not found: {csv_dir}")
        print("  Skipping fetch_esco — keeping existing public/data/esco_*.json.")
        print("  Download the ESCO v1.2.1 CSV release from:")
        print("    https://esco.ec.europa.eu/en/use-esco/download")
        return

    print(f"Reading ESCO CSVs from: {csv_dir}")

    print("  Extracting skills...")
    skills = extract_skills(csv_dir)
    print(f"  → {len(skills):,} skills extracted")

    print("  Extracting occupation-skill relations...")
    relations = extract_occupation_skill_relations(csv_dir)
    print(f"  → {len(relations):,} occupations have essential skills")

    print("  Extracting occupations...")
    occupations = extract_occupations(csv_dir, relations)
    print(f"  → {len(occupations):,} occupations extracted")

    write_output(
        "esco_skills.json",
        source="ESCO v1.2.1 CSV release — KnowledgeSkillCompetence concepts",
        values=skills,
    )
    write_output(
        "esco_occupations.json",
        source="ESCO v1.2.1 CSV release — Occupation concepts with essential skills",
        values=occupations,
    )

    print("Done.")
    print(f"  public/data/esco_skills.json      — {len(skills):,} skills")
    print(f"  public/data/esco_occupations.json — {len(occupations):,} occupations")


if __name__ == "__main__":
    main()
