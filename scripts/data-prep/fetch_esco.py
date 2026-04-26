"""ESCO — occupations + essentialSkills, subsetted to the ISCO-08 codes
from fetch_isco.py. The essentialSkills list is what lib/skill-match.ts
consumes for the 'N of M skills' match definition (§7.1.1).

TODO (requires network): replace the seed with the ESCO v1.1.1 CSV release
at https://esco.ec.europa.eu/en/use-esco/download — occupations.csv joined
to occupationSkillRelations.csv, filtered to the ISCO-08 subset.

For this session the seed captures ~25 occupations with hand-curated
essential skills. Enough to drive the demo and verify the data flow.
"""
from __future__ import annotations

from _common import write_output

# Each occupation's isco_code must appear in fetch_isco.SEED for the join
# in build_occupation_subset.py to succeed.
OCCUPATIONS = [
    {
        "isco_code": "7231",
        "esco_uri": "http://data.europa.eu/esco/occupation/7231-motor-vehicle-mechanic",
        "preferred_label": "Motor vehicle mechanic",
        "plain_language": "Fixes cars, motorbikes and trucks",
    },
    {
        "isco_code": "7421",
        "esco_uri": "http://data.europa.eu/esco/occupation/7421-electronics-mechanic",
        "preferred_label": "Electronics mechanic",
        "plain_language": "Repairs electronic devices and equipment",
    },
    {
        "isco_code": "7422",
        "esco_uri": "http://data.europa.eu/esco/occupation/7422-ict-installer",
        "preferred_label": "ICT installer and servicer",
        "plain_language": "Installs and services phones, routers and IT equipment",
    },
    {
        "isco_code": "2513",
        "esco_uri": "http://data.europa.eu/esco/occupation/2513-web-developer",
        "preferred_label": "Web developer",
        "plain_language": "Builds websites and web applications",
    },
    {
        "isco_code": "2512",
        "esco_uri": "http://data.europa.eu/esco/occupation/2512-software-developer",
        "preferred_label": "Software developer",
        "plain_language": "Writes software for computers and phones",
    },
    {
        "isco_code": "3512",
        "esco_uri": "http://data.europa.eu/esco/occupation/3512-ict-support-technician",
        "preferred_label": "ICT user support technician",
        "plain_language": "Helps people solve computer and software problems",
    },
    {
        "isco_code": "3514",
        "esco_uri": "http://data.europa.eu/esco/occupation/3514-web-technician",
        "preferred_label": "Web technician",
        "plain_language": "Maintains websites and fixes web problems",
    },
    {
        "isco_code": "5223",
        "esco_uri": "http://data.europa.eu/esco/occupation/5223-shop-sales-assistant",
        "preferred_label": "Shop sales assistant",
        "plain_language": "Sells goods in a shop and helps customers",
    },
    {
        "isco_code": "7533",
        "esco_uri": "http://data.europa.eu/esco/occupation/7533-tailor",
        "preferred_label": "Tailor / sewing worker",
        "plain_language": "Sews and alters clothing",
    },
    {
        "isco_code": "7115",
        "esco_uri": "http://data.europa.eu/esco/occupation/7115-carpenter",
        "preferred_label": "Carpenter",
        "plain_language": "Builds and fits wooden structures and furniture",
    },
    {
        "isco_code": "7126",
        "esco_uri": "http://data.europa.eu/esco/occupation/7126-plumber",
        "preferred_label": "Plumber",
        "plain_language": "Installs and repairs water pipes and fittings",
    },
    {
        "isco_code": "7212",
        "esco_uri": "http://data.europa.eu/esco/occupation/7212-welder",
        "preferred_label": "Welder",
        "plain_language": "Joins metal parts by welding",
    },
    {
        "isco_code": "8322",
        "esco_uri": "http://data.europa.eu/esco/occupation/8322-driver",
        "preferred_label": "Car, taxi or van driver",
        "plain_language": "Drives passengers or goods for a living",
    },
    {
        "isco_code": "5120",
        "esco_uri": "http://data.europa.eu/esco/occupation/5120-cook",
        "preferred_label": "Cook",
        "plain_language": "Prepares food in homes, restaurants or stalls",
    },
    {
        "isco_code": "4110",
        "esco_uri": "http://data.europa.eu/esco/occupation/4110-office-clerk",
        "preferred_label": "General office clerk",
        "plain_language": "Handles paperwork, records and office tasks",
    },
    {
        "isco_code": "4222",
        "esco_uri": "http://data.europa.eu/esco/occupation/4222-contact-centre-clerk",
        "preferred_label": "Contact centre clerk",
        "plain_language": "Answers calls and handles customer questions",
    },
    {
        "isco_code": "9111",
        "esco_uri": "http://data.europa.eu/esco/occupation/9111-domestic-cleaner",
        "preferred_label": "Domestic cleaner / helper",
        "plain_language": "Cleans homes and helps with household chores",
    },
    {
        "isco_code": "9211",
        "esco_uri": "http://data.europa.eu/esco/occupation/9211-crop-farm-worker",
        "preferred_label": "Crop farm worker",
        "plain_language": "Plants, tends and harvests crops",
    },
]

# Shared skills pool. Many occupations share skills; this is the universe
# lib/skill-match.ts validates Claude's output against.
SKILLS_POOL = [
    {"uri": "S1.1.1", "label": "hand tool use"},
    {"uri": "S1.1.2", "label": "soldering"},
    {"uri": "S1.1.3", "label": "diagnostic testing of electronics"},
    {"uri": "S1.1.4", "label": "smartphone hardware repair"},
    {"uri": "S1.1.5", "label": "operating system installation"},
    {"uri": "S1.2.1", "label": "JavaScript programming"},
    {"uri": "S1.2.2", "label": "HTML"},
    {"uri": "S1.2.3", "label": "CSS"},
    {"uri": "S1.2.4", "label": "web application design"},
    {"uri": "S1.2.5", "label": "version control with git"},
    {"uri": "S1.2.6", "label": "Python programming"},
    {"uri": "S1.2.7", "label": "database querying"},
    {"uri": "S2.1.1", "label": "customer communication"},
    {"uri": "S2.1.2", "label": "written English"},
    {"uri": "S2.1.3", "label": "local language fluency"},
    {"uri": "S2.1.4", "label": "basic accounting"},
    {"uri": "S2.1.5", "label": "cash handling"},
    {"uri": "S2.1.6", "label": "inventory management"},
    {"uri": "S3.1.1", "label": "vehicle engine diagnostics"},
    {"uri": "S3.1.2", "label": "vehicle body repair"},
    {"uri": "S3.1.3", "label": "safe driving"},
    {"uri": "S4.1.1", "label": "welding metals"},
    {"uri": "S4.1.2", "label": "pipe fitting"},
    {"uri": "S4.1.3", "label": "reading technical drawings"},
    {"uri": "S4.1.4", "label": "carpentry joinery"},
    {"uri": "S4.1.5", "label": "textile sewing"},
    {"uri": "S4.1.6", "label": "pattern cutting"},
    {"uri": "S5.1.1", "label": "food preparation"},
    {"uri": "S5.1.2", "label": "food safety"},
    {"uri": "S6.1.1", "label": "crop cultivation"},
    {"uri": "S6.1.2", "label": "household cleaning"},
    {"uri": "S7.1.1", "label": "typing"},
    {"uri": "S7.1.2", "label": "spreadsheet use"},
    {"uri": "S7.1.3", "label": "office document filing"},
    {"uri": "S7.1.4", "label": "phone etiquette"},
    {"uri": "S7.1.5", "label": "call handling"},
]

# Essential-skill mapping per occupation. Skill count per occupation is
# intentionally between 5-8 so 'N of M' numbers feel realistic on cards.
ESSENTIAL_SKILLS = {
    "7231": ["S1.1.1", "S3.1.1", "S3.1.2", "S4.1.3", "S2.1.1", "S2.1.5"],
    "7421": ["S1.1.1", "S1.1.2", "S1.1.3", "S1.1.4", "S1.1.5", "S2.1.1"],
    "7422": ["S1.1.1", "S1.1.4", "S1.1.5", "S2.1.1", "S2.1.2", "S2.1.6"],
    "2513": ["S1.2.1", "S1.2.2", "S1.2.3", "S1.2.4", "S1.2.5", "S2.1.2"],
    "2512": ["S1.2.1", "S1.2.5", "S1.2.6", "S1.2.7", "S2.1.2"],
    "3512": ["S1.1.5", "S2.1.1", "S2.1.2", "S7.1.1", "S7.1.4"],
    "3514": ["S1.2.2", "S1.2.3", "S1.2.5", "S2.1.1"],
    "5223": ["S2.1.1", "S2.1.3", "S2.1.5", "S2.1.6"],
    "7533": ["S4.1.5", "S4.1.6", "S1.1.1", "S2.1.1", "S2.1.5"],
    "7115": ["S4.1.3", "S4.1.4", "S1.1.1", "S2.1.1"],
    "7126": ["S4.1.2", "S4.1.3", "S1.1.1", "S2.1.1"],
    "7212": ["S4.1.1", "S4.1.3", "S1.1.1", "S2.1.1"],
    "8322": ["S3.1.3", "S2.1.1", "S2.1.5"],
    "5120": ["S5.1.1", "S5.1.2", "S2.1.5", "S2.1.6"],
    "4110": ["S7.1.1", "S7.1.2", "S7.1.3", "S2.1.2"],
    "4222": ["S7.1.4", "S7.1.5", "S2.1.1", "S2.1.2", "S2.1.3"],
    "9111": ["S6.1.2", "S2.1.3"],
    "9211": ["S6.1.1", "S2.1.3"],
}


def main() -> None:
    print("fetch_esco: building ESCO occupation + skills subset")

    occupations_out = []
    for occ in OCCUPATIONS:
        code = occ["isco_code"]
        occupations_out.append(
            {
                **occ,
                "essential_skills": ESSENTIAL_SKILLS.get(code, []),
            }
        )

    write_output(
        "esco_occupations.json",
        source="ESCO v1.1.x (curated subset, seed data — replace via live fetch for production)",
        values=occupations_out,
    )
    write_output(
        "esco_skills.json",
        source="ESCO v1.1.x skills pillar (curated subset)",
        values=SKILLS_POOL,
    )


if __name__ == "__main__":
    main()
